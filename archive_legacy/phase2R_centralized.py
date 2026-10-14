import os
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (precision_score, recall_score, f1_score, roc_auc_score, 
                             average_precision_score, confusion_matrix, accuracy_score, brier_score_loss)
from sklearn.inspection import permutation_importance
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_v2', exist_ok=True)
os.makedirs('models_v2', exist_ok=True)

zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
target = 'outbreak_onset_next_7_days'

exp_features = {
    'Exp1': ['hospital_cases', 'hosp_cases_7d_mean'],
    'Exp2': ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean'],
    'Exp3': ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
             'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth'],
    'Exp4': ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
             'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 'humidity', 'rainfall']
}
features = exp_features['Exp4']

# ============================================================
# A. FINAL DATASET GATE — BEFORE TRAINING
# ============================================================
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')
dfs = []
mismatches = 0
audit_rows = []

for z in zones:
    df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    z_gt = gt_df[gt_df['zone_id'] == z]
    z_onsets = z_gt[z_gt['latent_outbreak_onset'] == 1]['day_idx'].values
    
    # Audit Recompute
    for _, row in df.iterrows():
        T = int(row['day_idx'])
        y_stored = int(row[target])
        falls_in_horizon = 1 if any((O > T) and (O <= T + 7) for O in z_onsets) else 0
        if falls_in_horizon != y_stored:
            mismatches += 1
            
    n = len(df)
    n_tr, n_va = int(n*0.7), int(n*0.85)
    tr = df.iloc[:n_tr]
    va = df.iloc[n_tr:n_va]
    te = df.iloc[n_va:]
    
    audit_rows.append({
        'Zone': z, 'Total': n, 'Train': len(tr), 'Val': len(va), 'Test': len(te),
        'Pos_Train': tr[target].sum(), 'Pos_Val': va[target].sum(), 'Pos_Test': te[target].sum(),
        'Neg_Train': len(tr)-tr[target].sum(), 'Neg_Val': len(va)-va[target].sum(), 'Neg_Test': len(te)-te[target].sum()
    })
    
    # Check illegal cols
    illegal_exact = ['s', 'e', 'i', 'r']
    illegal_sub = ['latent', 'valid_future', 'forecast_eligible']
    for c in df.columns:
        if c.lower() in illegal_exact or any(sub in c.lower() for sub in illegal_sub):
            raise ValueError(f"Leakage Audit Failed: {c} found.")
            
    dfs.append(df)

pd.DataFrame(audit_rows).to_csv('results_v2/dataset_audit.csv', index=False)

if mismatches > 0:
    print(f"Target mismatches found: {mismatches}. STOPPING.")
    exit(1)
print(f"Target verification passed! Mismatches: {mismatches}")

# ============================================================
# B & C. CHRONOLOGICAL SPLITTING & PREPROCESSING
# ============================================================
all_df = pd.concat(dfs, ignore_index=True)
tr_dfs, va_dfs, te_dfs = [], [], []

for z in zones:
    d = all_df[all_df['zone_id'] == z]
    n = len(d)
    tr_dfs.append(d.iloc[:int(n*0.7)])
    va_dfs.append(d.iloc[int(n*0.7):int(n*0.85)])
    te_dfs.append(d.iloc[int(n*0.85):])

train_df = pd.concat(tr_dfs)
val_df = pd.concat(va_dfs)
test_df = pd.concat(te_dfs)

scaler = StandardScaler()
train_df[features] = scaler.fit_transform(train_df[features])
val_df[features] = scaler.transform(val_df[features])
test_df[features] = scaler.transform(test_df[features])

with open('results_v2/preprocessing_config.json', 'w') as f:
    json.dump({
        'features': features,
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist()
    }, f, indent=4)

# ============================================================
# D. CLASS IMBALANCE
# ============================================================
pos_train = train_df[target].sum()
neg_train = len(train_df) - pos_train
pos_weight = neg_train / pos_train

X_tr, y_tr = train_df[features].values, train_df[target].values
X_v, y_v = val_df[features].values, val_df[target].values
X_te, y_te = test_df[features].values, test_df[target].values

def get_metrics(y_true, y_prob, thresh=0.5):
    y_pred = (y_prob > thresh).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (np.sum(y_true==0), 0, np.sum(y_true==1), 0)
    
    return {
        'TP': tp, 'FP': fp, 'TN': tn, 'FN': fn,
        'Precision': precision_score(y_true, y_pred, zero_division=0) if (tp+fp)>0 else np.nan,
        'Recall': recall_score(y_true, y_pred, zero_division=0) if (tp+fn)>0 else np.nan,
        'F1': f1_score(y_true, y_pred, zero_division=0) if (tp+fp+fn)>0 else np.nan,
        'Specificity': tn/(tn+fp) if (tn+fp)>0 else np.nan,
        'FPR': fp/(tn+fp) if (tn+fp)>0 else np.nan,
        'Accuracy': accuracy_score(y_true, y_pred),
        'AUROC': roc_auc_score(y_true, y_prob) if (tp+fn)>0 and (tn+fp)>0 else np.nan,
        'PR-AUC': average_precision_score(y_true, y_prob) if (tp+fn)>0 else np.nan,
        'Brier': brier_score_loss(y_true, y_prob)
    }

# ============================================================
# E & F & G. MODELS & SELECTION
# ============================================================
class MLP(nn.Module):
    def __init__(self, in_dim, drop_rate=0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, 64), nn.ReLU(), nn.Dropout(drop_rate),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(drop_rate),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x)

def train_mlp(X_t, y_t, X_v, y_v, seed=42, lr=1e-3, drop=0.3, max_epochs=100):
    torch.manual_seed(seed)
    np.random.seed(seed)
    model = MLP(X_t.shape[1], drop)
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    opt = optim.Adam(model.parameters(), lr=lr)
    
    loader = DataLoader(TensorDataset(torch.tensor(X_t, dtype=torch.float32), 
                                      torch.tensor(y_t, dtype=torch.float32).unsqueeze(1)), 
                        batch_size=64, shuffle=True)
    best_pr = -1
    best_state = None
    
    X_v_t = torch.tensor(X_v, dtype=torch.float32)
    y_v_t = torch.tensor(y_v, dtype=torch.float32).unsqueeze(1)
    
    for epoch in range(max_epochs):
        model.train()
        for bx, by in loader:
            opt.zero_grad()
            crit(model(bx), by).backward()
            opt.step()
        
        model.eval()
        with torch.no_grad():
            out = model(X_v_t)
            prob = torch.sigmoid(out).numpy().flatten()
            pr = average_precision_score(y_v, prob) if np.sum(y_v)>0 else 0
            if pr > best_pr:
                best_pr = pr
                best_state = model.state_dict()
                
    model.load_state_dict(best_state)
    return model

# Train standard baselines
models = {
    'Dummy': DummyClassifier(strategy='prior').fit(X_tr, y_tr),
    'Logistic': LogisticRegression(class_weight='balanced', max_iter=1000).fit(X_tr, y_tr),
    'RandomForest': RandomForestClassifier(class_weight='balanced', random_state=42).fit(X_tr, y_tr),
    'HistGBM': HistGradientBoostingClassifier(random_state=42).fit(X_tr, y_tr)
}

# MLP Hyperparameter Search
cfg1 = train_mlp(X_tr, y_tr, X_v, y_v, 42, 1e-3, 0.3)
cfg2 = train_mlp(X_tr, y_tr, X_v, y_v, 42, 5e-4, 0.2)

with torch.no_grad():
    p1 = torch.sigmoid(cfg1(torch.tensor(X_v, dtype=torch.float32))).numpy().flatten()
    p2 = torch.sigmoid(cfg2(torch.tensor(X_v, dtype=torch.float32))).numpy().flatten()
    pr1 = average_precision_score(y_v, p1)
    pr2 = average_precision_score(y_v, p2)

best_mlp_cfg = {'lr': 1e-3, 'drop': 0.3} if pr1 >= pr2 else {'lr': 5e-4, 'drop': 0.2}

# Train 3 seeds
seed_res = []
mlps = []
for s in [42, 43, 44]:
    m = train_mlp(X_tr, y_tr, X_v, y_v, s, best_mlp_cfg['lr'], best_mlp_cfg['drop'])
    mlps.append(m)
    with torch.no_grad():
        prob = torch.sigmoid(m(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
    res = get_metrics(y_te, prob)
    res['Seed'] = s
    seed_res.append(res)

seed_df = pd.DataFrame(seed_res)
seed_df.to_csv('results_v2/centralized_seed_summary.csv', index=False)
final_mlp = mlps[0] # Using seed 42 as representative
torch.save(final_mlp.state_dict(), 'models_v2/centralized_mlp.pt')

# ============================================================
# H. PRIMARY FIXED-THRESHOLD RESULTS
# ============================================================
base_res = []
preds_prob = {}

for name, m in models.items():
    p = m.predict_proba(X_te)[:, 1] if hasattr(m, 'predict_proba') else m.predict(X_te)
    preds_prob[name] = p
    r = get_metrics(y_te, p, 0.5)
    r['Model'] = name
    base_res.append(r)

with torch.no_grad():
    p_mlp = torch.sigmoid(final_mlp(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
preds_prob['MLP'] = p_mlp
r_mlp = get_metrics(y_te, p_mlp, 0.5)
r_mlp['Model'] = 'MLP'
base_res.append(r_mlp)

pd.DataFrame(base_res).to_csv('results_v2/centralized_model_metrics.csv', index=False)

# ============================================================
# I. SECONDARY VALIDATION-SELECTED THRESHOLD
# ============================================================
with torch.no_grad():
    v_mlp = torch.sigmoid(final_mlp(torch.tensor(X_v, dtype=torch.float32))).numpy().flatten()

best_f1, best_thresh = -1, 0.5
for t in np.arange(0.1, 0.9, 0.05):
    f = get_metrics(y_v, v_mlp, t)['F1']
    if not np.isnan(f) and f > best_f1:
        best_f1 = f
        best_thresh = t

t_fixed = get_metrics(y_te, p_mlp, 0.5)
t_fixed['Threshold'] = 0.5
t_fixed['Type'] = 'Fixed'

t_val = get_metrics(y_te, p_mlp, best_thresh)
t_val['Threshold'] = best_thresh
t_val['Type'] = 'Validation_Selected (Max F1)'

pd.DataFrame([t_fixed, t_val]).to_csv('results_v2/threshold_analysis.csv', index=False)

# ============================================================
# L. SOURCE ABLATION
# ============================================================
abl_res = []
for exp_name, exp_cols in exp_features.items():
    xtr = train_df[exp_cols].values
    xv = val_df[exp_cols].values
    xte = test_df[exp_cols].values
    
    hgb = HistGradientBoostingClassifier(random_state=42).fit(xtr, y_tr)
    phgb = hgb.predict_proba(xte)[:, 1]
    rhgb = get_metrics(y_te, phgb, 0.5)
    rhgb['Experiment'] = exp_name
    rhgb['Model'] = 'HistGBM'
    abl_res.append(rhgb)
    
    m_mlp = train_mlp(xtr, y_tr, xv, y_v, 42, best_mlp_cfg['lr'], best_mlp_cfg['drop'])
    with torch.no_grad():
        pmlp = torch.sigmoid(m_mlp(torch.tensor(xte, dtype=torch.float32))).numpy().flatten()
    rmlp = get_metrics(y_te, pmlp, 0.5)
    rmlp['Experiment'] = exp_name
    rmlp['Model'] = 'MLP'
    abl_res.append(rmlp)

pd.DataFrame(abl_res).to_csv('results_v2/source_ablation_metrics.csv', index=False)

# ============================================================
# M. PER-ZONE ANALYSIS
# ============================================================
zone_res = []
for z in zones:
    z_te = test_df[test_df['zone_id'] == z]
    X_z = z_te[features].values
    y_z = z_te[target].values
    with torch.no_grad():
        pz = torch.sigmoid(final_mlp(torch.tensor(X_z, dtype=torch.float32))).numpy().flatten()
    rz = get_metrics(y_z, pz, 0.5)
    rz['Zone'] = z
    rz['Pos_Targets'] = y_z.sum()
    
    # Eval outbrea events in test
    t_start, t_end = z_te['day_idx'].min(), z_te['day_idx'].max()
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    events = sum(1 for O in z_onsets if (O-1 >= t_start) and (O-7 <= t_end))
    rz['Test_Events'] = events
    
    zone_res.append(rz)
pd.DataFrame(zone_res).to_csv('results_v2/per_zone_metrics.csv', index=False)

# ============================================================
# K. EVENT-LEVEL EARLY-WARNING
# ============================================================
test_df['y_prob'] = p_mlp
test_df['y_pred'] = (p_mlp > 0.5).astype(int)

total_eval = 0
detected = 0
lead_times = []
warning_episodes = []

for z in zones:
    z_te = test_df[test_df['zone_id'] == z]
    t_start, t_end = z_te['day_idx'].min(), z_te['day_idx'].max()
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    
    for O in z_onsets:
        if (O - 1 < t_start) or (O - 7 > t_end):
            continue
            
        preds_window = z_te[(z_te['day_idx'] >= O - 7) & (z_te['day_idx'] <= O - 1)]
        if len(preds_window) == 7:
            total_eval += 1
            if preds_window['y_pred'].sum() > 0:
                detected += 1
                first_pos = preds_window[preds_window['y_pred'] == 1]['day_idx'].min()
                lead_times.append(O - first_pos)
                
    # Warning episodes
    ep_start = None
    in_episode = False
    ep_dates = []
    
    for _, row in z_te.iterrows():
        if row['y_pred'] == 1:
            if not in_episode:
                in_episode = True
                ep_start = row['day_idx']
            ep_dates.append(row['day_idx'])
        else:
            if in_episode:
                warning_episodes.append({'zone': z, 'start': ep_start, 'end': ep_dates[-1]})
                in_episode = False
                ep_dates = []
    if in_episode:
        warning_episodes.append({'zone': z, 'start': ep_start, 'end': ep_dates[-1]})

true_eps = 0
false_eps = 0

for ep in warning_episodes:
    w_start = ep['start'] + 1
    w_end = ep['end'] + 7
    z_onsets = gt_df[(gt_df['zone_id'] == ep['zone']) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    if any((O >= w_start) and (O <= w_end) for O in z_onsets):
        true_eps += 1
    else:
        false_eps += 1

ev_metrics = {
    'Total Evaluable Onsets': total_eval,
    'Detected Onsets': detected,
    'Missed Onsets': total_eval - detected,
    'Event Detection Rate': detected / max(1, total_eval),
    'Mean Lead Time': np.mean(lead_times) if lead_times else 0,
    'Median Lead Time': np.median(lead_times) if lead_times else 0,
    'Total Warning Episodes': len(warning_episodes),
    'True Warning Episodes': true_eps,
    'False Warning Episodes': false_eps,
    'False Alarm Rate': false_eps / max(1, len(warning_episodes))
}
with open('results_v2/event_detection_metrics.json', 'w') as f:
    json.dump(ev_metrics, f, indent=4)

# ============================================================
# N. FEATURE ANALYSIS
# ============================================================
# Permutation Importance for MLP on Test Set
def mlp_score(X, y):
    with torch.no_grad():
        p = torch.sigmoid(final_mlp(torch.tensor(X, dtype=torch.float32))).numpy().flatten()
    return average_precision_score(y, p) if np.sum(y)>0 else 0

baseline_pr = mlp_score(X_te, y_te)
imp_mlp = []
for i in range(X_te.shape[1]):
    X_shuf = X_te.copy()
    np.random.shuffle(X_shuf[:, i])
    shuf_pr = mlp_score(X_shuf, y_te)
    imp_mlp.append(baseline_pr - shuf_pr)

plt.figure(figsize=(10,6))
sns.barplot(x=imp_mlp, y=features)
plt.title('MLP Permutation Importance (Drop in PR-AUC)')
plt.tight_layout()
plt.savefig('results_v2/feature_importance.png')

print("Phase 2R complete.")

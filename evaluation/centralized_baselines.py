import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (precision_score, recall_score, f1_score, roc_auc_score, 
                             average_precision_score, confusion_matrix)
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import json
import warnings
warnings.filterwarnings('ignore')

os.makedirs('evaluation', exist_ok=True)
os.makedirs('results', exist_ok=True)

print("=== A. PRE-TRAINING DATASET AUDIT ===")
zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
ml_files = [f'ai-service/datasets/ml_ready/{z}_features.csv' for z in zones]

all_dfs = []
audit_info = []

for z, f in zip(zones, ml_files):
    df = pd.read_csv(f)
    all_dfs.append(df)
    
    # 1. Shape & Columns
    forbidden = ['S', 'E', 'I', 'R', 'daily_incidence', 'latent_outbreak_active', 'latent_outbreak_onset']
    has_forbidden = any(c in df.columns for c in forbidden)
    
    # 2. Target distribution
    t1 = df['outbreak_onset_next_7_days'].sum()
    t0 = len(df) - t1
    
    # 4. Missing/Inf
    has_na = df.isna().sum().sum() > 0
    has_inf = np.isinf(df.select_dtypes(include=np.number)).sum().sum() > 0
    
    audit_info.append({
        'Zone': z,
        'Shape': df.shape,
        'Has_Forbidden': has_forbidden,
        'Missing_Values': has_na,
        'Inf_Values': has_inf,
        'Target_1': t1,
        'Target_0': t0
    })

audit_df = pd.DataFrame(audit_info)
print(audit_df.to_string(index=False))

df_all = pd.concat(all_dfs, ignore_index=True)
print("\nGlobal Target Distribution: 1s =", df_all['outbreak_onset_next_7_days'].sum(), "0s =", len(df_all) - df_all['outbreak_onset_next_7_days'].sum())

# 7. Correlations
numeric_cols = df_all.select_dtypes(include=np.number).columns
corr = df_all[numeric_cols].corr()['outbreak_onset_next_7_days'].sort_values(ascending=False)
print("\nTop Correlations with Target:")
print(corr.head(5).to_string())
print(corr.tail(3).to_string())

if corr.drop('outbreak_onset_next_7_days').max() > 0.95:
    print("WARNING: Suspiciously high correlation detected!")

print("\n=== B. CHRONOLOGICAL SPLIT ===")
train_dfs, val_dfs, test_dfs = [], [], []

for df in all_dfs:
    n = len(df)
    idx_70 = int(n * 0.7)
    idx_85 = int(n * 0.85)
    
    train_dfs.append(df.iloc[:idx_70])
    val_dfs.append(df.iloc[idx_70:idx_85])
    test_dfs.append(df.iloc[idx_85:])

train_data = pd.concat(train_dfs, ignore_index=True)
val_data = pd.concat(val_dfs, ignore_index=True)
test_data = pd.concat(test_dfs, ignore_index=True)

print(f"Train Shape: {train_data.shape}, Onsets: {train_data['outbreak_onset_next_7_days'].sum()}")
print(f"Val Shape: {val_data.shape}, Onsets: {val_data['outbreak_onset_next_7_days'].sum()}")
print(f"Test Shape: {test_data.shape}, Onsets: {test_data['outbreak_onset_next_7_days'].sum()}")

# Features definitions
feat_hosp = ['hospital_cases', 'hosp_cases_7d_mean']
feat_lab = ['lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean']
feat_pharm = ['pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth']
feat_weather = ['temperature', 'humidity', 'rainfall']

target = 'outbreak_onset_next_7_days'
all_features = feat_hosp + feat_lab + feat_pharm + feat_weather

# Fit Scaler on TRAIN ONLY
scaler = StandardScaler()
X_train_full = scaler.fit_transform(train_data[all_features])
X_val_full = scaler.transform(val_data[all_features])
X_test_full = scaler.transform(test_data[all_features])

y_train = train_data[target].values
y_val = val_data[target].values
y_test = test_data[target].values

def calc_metrics(y_true, y_pred, y_prob):
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0,0,0,0)
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    
    return {
        'Precision': precision_score(y_true, y_pred, zero_division=0),
        'Recall': recall_score(y_true, y_pred, zero_division=0),
        'F1': f1_score(y_true, y_pred, zero_division=0),
        'AUROC': roc_auc_score(y_true, y_prob),
        'PR-AUC': average_precision_score(y_true, y_prob),
        'Specificity': spec,
        'FPR': fpr,
        'TP': tp, 'FP': fp, 'TN': tn, 'FN': fn
    }

print("\n=== C. BASELINE MODELS ===")
results = []

# 1. Dummy
print("Training Dummy...")
dummy = DummyClassifier(strategy='prior')
dummy.fit(X_train_full, y_train)
res_dummy = calc_metrics(y_test, dummy.predict(X_test_full), dummy.predict_proba(X_test_full)[:,1])
res_dummy['Model'] = 'Dummy (Majority)'
results.append(res_dummy)

# 2. Logistic
print("Training Logistic Regression...")
lr = LogisticRegression(class_weight='balanced', max_iter=1000)
lr.fit(X_train_full, y_train)
res_lr = calc_metrics(y_test, lr.predict(X_test_full), lr.predict_proba(X_test_full)[:,1])
res_lr['Model'] = 'Logistic Regression'
results.append(res_lr)

# 3. Random Forest
print("Training Random Forest...")
rf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
rf.fit(X_train_full, y_train)
res_rf = calc_metrics(y_test, rf.predict(X_test_full), rf.predict_proba(X_test_full)[:,1])
res_rf['Model'] = 'Random Forest'
results.append(res_rf)

# 4. HistGradientBoosting
print("Training HistGradientBoosting...")
hgb = HistGradientBoostingClassifier(random_state=42)
hgb.fit(X_train_full, y_train)
res_hgb = calc_metrics(y_test, hgb.predict(X_test_full), hgb.predict_proba(X_test_full)[:,1])
res_hgb['Model'] = 'HistGradientBoosting (XGB-proxy)'
results.append(res_hgb)

# 5. PyTorch MLP
class MLP(nn.Module):
    def __init__(self, input_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x)

def train_mlp(X_tr, y_tr, X_v, y_v):
    model = MLP(X_tr.shape[1])
    pos_weight = torch.tensor([(len(y_tr) - sum(y_tr)) / sum(y_tr)], dtype=torch.float32)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    dataset = TensorDataset(torch.tensor(X_tr, dtype=torch.float32), torch.tensor(y_tr, dtype=torch.float32).unsqueeze(1))
    loader = DataLoader(dataset, batch_size=64, shuffle=True)
    
    X_v_t = torch.tensor(X_v, dtype=torch.float32)
    y_v_t = torch.tensor(y_v, dtype=torch.float32).unsqueeze(1)
    
    best_pr_auc = 0
    best_weights = None
    patience = 10
    no_improve = 0
    
    for epoch in range(100):
        model.train()
        for bx, by in loader:
            optimizer.zero_grad()
            out = model(bx)
            loss = criterion(out, by)
            loss.backward()
            optimizer.step()
            
        model.eval()
        with torch.no_grad():
            out_v = model(X_v_t)
            probs_v = torch.sigmoid(out_v).numpy()
            pr = average_precision_score(y_v, probs_v)
            if pr > best_pr_auc:
                best_pr_auc = pr
                best_weights = model.state_dict().copy()
                no_improve = 0
            else:
                no_improve += 1
                
        if no_improve >= patience:
            break
            
    model.load_state_dict(best_weights)
    return model

print("Training Centralized PyTorch MLP...")
mlp = train_mlp(X_train_full, y_train, X_val_full, y_val)
mlp.eval()
with torch.no_grad():
    mlp_probs = torch.sigmoid(mlp(torch.tensor(X_test_full, dtype=torch.float32))).numpy().flatten()
    mlp_preds = (mlp_probs > 0.5).astype(int)
res_mlp = calc_metrics(y_test, mlp_preds, mlp_probs)
res_mlp['Model'] = 'Centralized MLP'
results.append(res_mlp)

pd.DataFrame(results).to_csv('results/centralized_model_metrics.csv', index=False)

print("\n=== D. FEATURE EXPERIMENTS (ABLATION) ===")
experiments = {
    'Exp1_Hosp': feat_hosp,
    'Exp2_Hosp_Lab': feat_hosp + feat_lab,
    'Exp3_Hosp_Lab_Pharm': feat_hosp + feat_lab + feat_pharm,
    'Exp4_All': all_features
}

ablation_results = []
for exp_name, feats in experiments.items():
    idx = [all_features.index(f) for f in feats]
    X_tr = X_train_full[:, idx]
    X_v = X_val_full[:, idx]
    X_te = X_test_full[:, idx]
    
    # MLP
    model = train_mlp(X_tr, y_train, X_v, y_val)
    model.eval()
    with torch.no_grad():
        probs = torch.sigmoid(model(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
    preds = (probs > 0.5).astype(int)
    res = calc_metrics(y_test, preds, probs)
    res['Experiment'] = exp_name
    res['Model'] = 'MLP'
    ablation_results.append(res)

pd.DataFrame(ablation_results).to_csv('results/source_ablation_metrics.csv', index=False)
print("Ablation experiments saved.")

print("\n=== E. EVENT-LEVEL OUTBREAK DETECTION ===")
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')
gt_test_dfs = []

# Filter GT to align with test data exactly
for z in zones:
    gt_zone = gt_df[gt_df['zone_id'] == z]
    n = len(gt_zone)
    # The ML datasets dropped first 28 days
    # So we need to match the indices carefully.
    # ML dataset length = n - 28.
    idx_85 = int((n - 28) * 0.85)
    gt_test_zone = gt_zone.iloc[28 + idx_85:].copy()
    gt_test_dfs.append(gt_test_zone)

gt_test = pd.concat(gt_test_dfs, ignore_index=True)

# Using MLP predictions on Test Set
test_data['y_pred'] = mlp_preds
test_data['latent_onset'] = gt_test['latent_outbreak_onset'].values
test_data['day_idx'] = gt_test['day_idx'].values

detected_onsets = 0
total_onsets = 0
lead_times = []
false_alarms = 0

for z in zones:
    z_test = test_data[test_data['zone_id'] == z]
    onset_indices = z_test[z_test['latent_onset'] == 1].index
    
    for idx in onset_indices:
        total_onsets += 1
        # Look at preceding 7 days in the test set
        # If it's near the start of the test set, we just look as far back as possible
        start_idx = max(z_test.index[0], idx - 7)
        window = z_test.loc[start_idx : idx - 1]
        
        warnings = window[window['y_pred'] == 1]
        if len(warnings) > 0:
            detected_onsets += 1
            first_warning = warnings.index[0]
            lead_time = idx - first_warning
            lead_times.append(lead_time)

# False alarms: y_pred=1 but y_true=0
false_alarms = len(test_data[(test_data['y_pred'] == 1) & (test_data['outbreak_onset_next_7_days'] == 0)])

event_res = {
    'Total Test Onsets': total_onsets,
    'Detected Onsets': detected_onsets,
    'Missed Onsets': total_onsets - detected_onsets,
    'Detection Rate': detected_onsets / total_onsets if total_onsets > 0 else 0,
    'Mean Lead Time (Days)': np.mean(lead_times) if lead_times else 0,
    'Median Lead Time (Days)': np.median(lead_times) if lead_times else 0,
    'False Alarms (Days)': false_alarms
}
with open('results/event_detection_metrics.json', 'w') as f:
    json.dump(event_res, f, indent=4)
print("Event-level detection evaluated.")
print(json.dumps(event_res, indent=2))

print("\n=== F. PER-ZONE PERFORMANCE (MLP) ===")
zone_results = []
for z in zones:
    mask = test_data['zone_id'] == z
    res = calc_metrics(y_test[mask], mlp_preds[mask], mlp_probs[mask])
    res['Zone'] = z
    zone_results.append(res)

pd.DataFrame(zone_results).to_csv('results/per_zone_metrics.csv', index=False)
print("Per-zone metrics saved.")

print("\n=== GENERATING PLOTS ===")
plt.figure()
sns.barplot(data=pd.DataFrame(ablation_results), x='Experiment', y='PR-AUC')
plt.title('Ablation Study: Feature Addition vs PR-AUC')
plt.savefig('results/ablation_prauc.png')

print("\n=== EVALUATION COMPLETE. STOPPING. ===")

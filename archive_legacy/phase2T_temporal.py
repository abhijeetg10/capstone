import os
import json
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (precision_score, recall_score, f1_score, roc_auc_score, 
                             average_precision_score, confusion_matrix, accuracy_score, brier_score_loss)
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_temporal', exist_ok=True)
os.makedirs('models_temporal', exist_ok=True)

zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
target = 'outbreak_onset_next_7_days'

exp_features = {
    'Exp1': ['hospital_cases'],
    'Exp2': ['hospital_cases', 'lab_total', 'lab_positive', 'lab_pos_rate'],
    'Exp3': ['hospital_cases', 'lab_total', 'lab_positive', 'lab_pos_rate', 'pharmacy_sales'],
    'Exp4': ['hospital_cases', 'lab_total', 'lab_positive', 'lab_pos_rate', 'pharmacy_sales', 'temperature', 'humidity', 'rainfall']
}

raw_features = exp_features['Exp4']

# ============================================================
# A & B. LOAD TEMPORAL DATA
# ============================================================
def load_sequences(W, features):
    X, y, meta = [], [], []
    audit_rows = []
    
    for z in zones:
        ml_df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
        temp_df = pd.read_csv(f'ai-service/datasets/temporal_data/{z}_observable_daily.csv')
        
        n_eligible = len(ml_df)
        n_seq = 0
        
        for _, row in ml_df.iterrows():
            T = int(row['day_idx'])
            tgt = int(row[target])
            
            seq_df = temp_df[(temp_df['day_idx'] > T - W) & (temp_df['day_idx'] <= T)].sort_values('day_idx')
            
            if len(seq_df) == W:
                # Check for strictly consecutive
                days = seq_df['day_idx'].values
                if np.all(days[1:] - days[:-1] == 1) and days[-1] == T:
                    X.append(seq_df[features].values)
                    y.append(tgt)
                    meta.append({'zone_id': z, 'day_idx': T})
                    n_seq += 1
                    
        audit_rows.append({'Zone': z, 'Window': W, 'Eligible_Days': n_eligible, 'Valid_Sequences': n_seq})
        
    return np.array(X), np.array(y), pd.DataFrame(meta), pd.DataFrame(audit_rows)

print("Testing look-back windows for sequence construction...")
X7, y7, m7, a7 = load_sequences(7, raw_features)
X14, y14, m14, a14 = load_sequences(14, raw_features)
X21, y21, m21, a21 = load_sequences(21, raw_features)
a14.to_csv('results_temporal/sequence_audit.csv', index=False)

# Split logic based on indices
def get_split_indices(meta_df, max_pct=1.0):
    indices = []
    for z in zones:
        z_idx = meta_df[meta_df['zone_id'] == z].index.values
        limit = int(len(z_idx) * max_pct)
        indices.extend(z_idx[:limit])
    return np.array(indices)

def get_fold_indices(meta_df, train_end_pct, val_end_pct):
    tr_idx, va_idx = [], []
    for z in zones:
        z_idx = meta_df[meta_df['zone_id'] == z].index.values
        tr_limit = int(len(z_idx) * train_end_pct)
        va_limit = int(len(z_idx) * val_end_pct)
        tr_idx.extend(z_idx[:tr_limit])
        va_idx.extend(z_idx[tr_limit:va_limit])
    return np.array(tr_idx), np.array(va_idx)

# ============================================================
# E & G. TEMPORAL NEURAL MODELS & CROSS-VALIDATION
# ============================================================
class RNNModel(nn.Module):
    def __init__(self, rnn_type, input_size, hidden_size=32):
        super().__init__()
        if rnn_type == 'gru':
            self.rnn = nn.GRU(input_size, hidden_size, batch_first=True)
        else:
            self.rnn = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(hidden_size, 1)
        
    def forward(self, x):
        out, _ = self.rnn(x)
        if isinstance(out, tuple): out = out[0]
        out = out[:, -1, :]
        out = self.dropout(out)
        return self.fc(out)

def evaluate(y_true, y_prob, thresh=0.5):
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
        'AUROC': roc_auc_score(y_true, y_prob) if (tp+fn)>0 and (tn+fp)>0 else np.nan,
        'PR-AUC': average_precision_score(y_true, y_prob) if (tp+fn)>0 else np.nan,
        'Brier': brier_score_loss(y_true, y_prob)
    }

def train_eval_rnn(X_train, y_train, X_val, y_val, rnn_type='lstm', seed=42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    model = RNNModel(rnn_type, X_train.shape[2])
    
    pos_weight = np.sum(y_train==0) / max(1, np.sum(y_train==1))
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    opt = optim.Adam(model.parameters(), lr=1e-3)
    
    loader = DataLoader(TensorDataset(torch.tensor(X_train, dtype=torch.float32), 
                                      torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)), 
                        batch_size=64, shuffle=True)
    
    best_pr = -1
    best_state = None
    X_v_t = torch.tensor(X_val, dtype=torch.float32)
    
    for epoch in range(50):
        model.train()
        for bx, by in loader:
            opt.zero_grad()
            crit(model(bx), by).backward()
            opt.step()
            
        model.eval()
        with torch.no_grad():
            prob = torch.sigmoid(model(X_v_t)).numpy().flatten()
            pr = average_precision_score(y_val, prob) if np.sum(y_val)>0 else 0
            if pr > best_pr:
                best_pr = pr
                best_state = model.state_dict()
                
    if best_state: model.load_state_dict(best_state)
    return model

# Cross-Validation for Window Selection (Lightweight LSTM)
cv_res = []
folds = [(0.55, 0.65), (0.65, 0.75), (0.75, 0.85)]
for W, (X, y, meta) in [(7, (X7, y7, m7)), (14, (X14, y14, m14)), (21, (X21, y21, m21))]:
    for i, (te_pct, ve_pct) in enumerate(folds):
        tr_idx, va_idx = get_fold_indices(meta, te_pct, ve_pct)
        X_tr, y_tr = X[tr_idx], y[tr_idx]
        X_va, y_va = X[va_idx], y[va_idx]
        
        # Scale
        N_tr, S, F = X_tr.shape
        scaler = StandardScaler()
        X_tr_flat = X_tr.reshape(-1, F)
        scaler.fit(X_tr_flat)
        X_tr_s = scaler.transform(X_tr_flat).reshape(N_tr, S, F)
        
        N_va = X_va.shape[0]
        X_va_s = scaler.transform(X_va.reshape(-1, F)).reshape(N_va, S, F)
        
        m = train_eval_rnn(X_tr_s, y_tr, X_va_s, y_va, 'lstm', 42)
        m.eval()
        with torch.no_grad():
            pv = torch.sigmoid(m(torch.tensor(X_va_s, dtype=torch.float32))).numpy().flatten()
        res = evaluate(y_va, pv)
        res['Window'] = W
        res['Fold'] = i+1
        cv_res.append(res)

cv_df = pd.DataFrame(cv_res)
cv_df.to_csv('results_temporal/temporal_cv_metrics.csv', index=False)
mean_cv = cv_df.groupby('Window')['PR-AUC'].mean().reset_index()
best_W = int(mean_cv.sort_values('PR-AUC', ascending=False).iloc[0]['Window'])
print(f"Selected Window: {best_W} days")

if best_W == 7: X, y, meta = X7, y7, m7
elif best_W == 14: X, y, meta = X14, y14, m14
else: X, y, meta = X21, y21, m21

# Final Train/Test Split (85/15)
tr_idx, te_idx = get_fold_indices(meta, 0.85, 1.0)
X_tr_raw, y_tr = X[tr_idx], y[tr_idx]
X_te_raw, y_te = X[te_idx], y[te_idx]

scaler = StandardScaler()
X_tr = scaler.fit_transform(X_tr_raw.reshape(-1, len(raw_features))).reshape(X_tr_raw.shape)
X_te = scaler.transform(X_te_raw.reshape(-1, len(raw_features))).reshape(X_te_raw.shape)

# ============================================================
# F. STATISTICAL EARLY-WARNING BASELINE
# ============================================================
ewma_probs = []
# Best EWMA threshold on Train
# We use the raw last day hospital cases EWMA
hosp_idx = raw_features.index('hospital_cases')
best_ewma_f1 = -1
best_ewma_thresh = 0

train_ewma = []
for i in range(len(X_tr_raw)):
    s = pd.Series(X_tr_raw[i, :, hosp_idx])
    train_ewma.append(s.ewm(span=7).mean().iloc[-1])
train_ewma = np.array(train_ewma)
# Standardize EWMA probabilistically between 0 and 1 via min/max for easy thresholding
min_e, max_e = np.min(train_ewma), np.max(train_ewma)
train_ewma_p = (train_ewma - min_e) / (max_e - min_e + 1e-8)

for t in np.arange(0.1, 0.9, 0.05):
    f = evaluate(y_tr, train_ewma_p, t)['F1']
    if not np.isnan(f) and f > best_ewma_f1:
        best_ewma_f1 = f
        best_ewma_thresh = t

test_ewma = []
for i in range(len(X_te_raw)):
    s = pd.Series(X_te_raw[i, :, hosp_idx])
    test_ewma.append(s.ewm(span=7).mean().iloc[-1])
test_ewma = np.array(test_ewma)
test_ewma_p = (test_ewma - min_e) / (max_e - min_e + 1e-8)

res_ewma = evaluate(y_te, test_ewma_p, best_ewma_thresh)
res_ewma['Model'] = 'EWMA'
res_ewma['Threshold'] = best_ewma_thresh

# ============================================================
# G & J. TEMPORAL NEURAL EVALUATION (3 Seeds)
# ============================================================
final_res = [res_ewma]
seed_summary = []
best_models = {}

for rnn_type in ['gru', 'lstm']:
    models = []
    for s in [42, 43, 44]:
        # Using 85% for train and last fold val for early stopping
        tr2_idx, va2_idx = get_fold_indices(meta.iloc[tr_idx].reset_index(drop=True), 0.85, 1.0)
        m = train_eval_rnn(X_tr[tr2_idx], y_tr[tr2_idx], X_tr[va2_idx], y_tr[va2_idx], rnn_type, s)
        models.append(m)
        m.eval()
        with torch.no_grad():
            pt = torch.sigmoid(m(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
        res = evaluate(y_te, pt)
        res['Model'] = rnn_type.upper()
        res['Seed'] = s
        seed_summary.append(res)
    
    # Eval Representative model (Seed 42)
    rep_model = models[0]
    best_models[rnn_type] = rep_model
    torch.save(rep_model.state_dict(), f'models_temporal/{rnn_type}.pt')
    
    with torch.no_grad():
        pt = torch.sigmoid(rep_model(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
    rep_res = evaluate(y_te, pt, 0.5)
    rep_res['Model'] = rnn_type.upper()
    rep_res['Threshold'] = 0.5
    final_res.append(rep_res)
    
pd.DataFrame(seed_summary).to_csv('results_temporal/temporal_seed_summary.csv', index=False)
pd.DataFrame(final_res).to_csv('results_temporal/temporal_model_metrics.csv', index=False)

# K. Threshold Analysis (using val fold from train)
m_lstm = best_models['lstm']
with torch.no_grad():
    pv = torch.sigmoid(m_lstm(torch.tensor(X_tr[va2_idx], dtype=torch.float32))).numpy().flatten()
best_f1, best_t = -1, 0.5
for t in np.arange(0.1, 0.9, 0.05):
    f = evaluate(y_tr[va2_idx], pv, t)['F1']
    if not np.isnan(f) and f > best_f1: best_f1, best_t = f, t

with torch.no_grad():
    pte = torch.sigmoid(m_lstm(torch.tensor(X_te, dtype=torch.float32))).numpy().flatten()
t_val = evaluate(y_te, pte, best_t)
t_val['Threshold'] = best_t
t_val['Type'] = 'Validation_Selected'
t_fixed = evaluate(y_te, pte, 0.5)
t_fixed['Threshold'] = 0.5
t_fixed['Type'] = 'Fixed'
pd.DataFrame([t_fixed, t_val]).to_csv('results_temporal/temporal_threshold_analysis.csv', index=False)

# ============================================================
# M. EVENT-LEVEL EARLY-WARNING
# ============================================================
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')
meta_te = meta.iloc[te_idx].copy()
meta_te['y_prob'] = pte
meta_te['y_pred'] = (pte > 0.5).astype(int)

total_eval = 0
detected = 0
lead_times = []
warning_episodes = []

for z in zones:
    z_te = meta_te[meta_te['zone_id'] == z]
    t_start, t_end = z_te['day_idx'].min(), z_te['day_idx'].max()
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    
    for O in z_onsets:
        if (O - 1 < t_start) or (O - 7 > t_end): continue
        preds_window = z_te[(z_te['day_idx'] >= O - 7) & (z_te['day_idx'] <= O - 1)]
        if len(preds_window) == 7:
            total_eval += 1
            if preds_window['y_pred'].sum() > 0:
                detected += 1
                first_pos = preds_window[preds_window['y_pred'] == 1]['day_idx'].min()
                lead_times.append(O - first_pos)
                
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
    if in_episode: warning_episodes.append({'zone': z, 'start': ep_start, 'end': ep_dates[-1]})

true_eps, false_eps = 0, 0
for ep in warning_episodes:
    w_start, w_end = ep['start'] + 1, ep['end'] + 7
    z_onsets = gt_df[(gt_df['zone_id'] == ep['zone']) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    if any((O >= w_start) and (O <= w_end) for O in z_onsets): true_eps += 1
    else: false_eps += 1

ev_metrics = {
    'Total Evaluable Onsets': total_eval, 'Detected Onsets': detected,
    'Event Detection Rate': detected / max(1, total_eval),
    'Mean Lead Time': np.mean(lead_times) if lead_times else 0,
    'Total Warning Episodes': len(warning_episodes),
    'True Warning Episodes': true_eps, 'False Warning Episodes': false_eps,
    'False Alarm Rate': false_eps / max(1, len(warning_episodes))
}
with open('results_temporal/temporal_event_detection.json', 'w') as f: json.dump(ev_metrics, f, indent=4)

# ============================================================
# O. TEMPORAL SOURCE ABLATION
# ============================================================
abl_res = []
for exp, cols in exp_features.items():
    idx_cols = [raw_features.index(c) for c in cols]
    xtr_exp = X_tr[:, :, idx_cols]
    xte_exp = X_te[:, :, idx_cols]
    m_exp = train_eval_rnn(xtr_exp[tr2_idx], y_tr[tr2_idx], xtr_exp[va2_idx], y_tr[va2_idx], 'lstm', 42)
    m_exp.eval()
    with torch.no_grad():
        pexp = torch.sigmoid(m_exp(torch.tensor(xte_exp, dtype=torch.float32))).numpy().flatten()
    r = evaluate(y_te, pexp)
    r['Experiment'] = exp
    abl_res.append(r)
pd.DataFrame(abl_res).to_csv('results_temporal/temporal_source_ablation.csv', index=False)

# ============================================================
# N. COMPARISON TABLE
# ============================================================
phase2R_metrics = pd.read_csv('results_v2/centralized_model_metrics.csv')
comp_df = pd.concat([phase2R_metrics, pd.DataFrame(final_res)])
comp_df.to_csv('results_temporal/model_comparison.csv', index=False)

print("Phase 2T complete.")

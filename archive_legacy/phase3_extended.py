import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.metrics import (precision_score, recall_score, f1_score, roc_auc_score, 
                             average_precision_score, confusion_matrix)
import json
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results', exist_ok=True)

zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
features = ['hospital_cases', 'hosp_cases_7d_mean', 
            'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
            'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth',
            'temperature', 'humidity', 'rainfall']
target = 'outbreak_onset_next_7_days'

# 1. PREPROCESSING (No Raw Data Centralization)
global_n = 0
global_sum = np.zeros(len(features))
global_sq_sum = np.zeros(len(features))
global_pos, global_neg = 0, 0

clients_raw = {}

for z in zones:
    df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    n = len(df)
    train_df = df.iloc[:int(n*0.7)]
    val_df = df.iloc[int(n*0.7):int(n*0.85)]
    test_df = df.iloc[int(n*0.85):]
    
    clients_raw[z] = (train_df, val_df, test_df)
    
    X = train_df[features].values
    y = train_df[target].values
    
    global_n += len(X)
    global_sum += np.sum(X, axis=0)
    global_sq_sum += np.sum(X**2, axis=0)
    global_pos += np.sum(y == 1)
    global_neg += np.sum(y == 0)

global_mean = global_sum / global_n
global_var = (global_sq_sum / global_n) - (global_mean ** 2)
global_std = np.sqrt(np.maximum(global_var, 1e-8))
pos_weight = global_neg / global_pos

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

def prep(d):
    X = (d[features].values - global_mean) / global_std
    y = d[target].values
    return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32).unsqueeze(1)

def calc_metrics(y_true, y_prob, thresh=0.5):
    y_pred = (y_prob > thresh).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (np.sum(y_true==0), 0, np.sum(y_true==1), 0)
    
    has_pos = (tp + fn) > 0
    has_neg = (tn + fp) > 0
    
    res = {
        'TP': tp, 'FP': fp, 'TN': tn, 'FN': fn,
        'Precision': precision_score(y_true, y_pred, zero_division=0) if has_pos else np.nan,
        'Recall': recall_score(y_true, y_pred, zero_division=0) if has_pos else np.nan,
        'F1': f1_score(y_true, y_pred, zero_division=0) if has_pos else np.nan,
        'AUROC': roc_auc_score(y_true, y_prob) if has_pos and has_neg else np.nan,
        'PR-AUC': average_precision_score(y_true, y_prob) if has_pos else np.nan,
        'Specificity': tn / (tn + fp) if has_neg else np.nan,
        'FPR': fp / (fp + tn) if has_neg else np.nan
    }
    return res

clients_data = {}
all_val_X, all_val_y = [], []
all_test_X, all_test_y = [], []
all_train_X, all_train_y = [], []

for z in zones:
    tr, va, te = clients_raw[z]
    X_tr, y_tr = prep(tr)
    X_v, y_v = prep(va)
    X_te, y_te = prep(te)
    
    clients_data[z] = {
        'loader': DataLoader(TensorDataset(X_tr, y_tr), batch_size=64, shuffle=True),
        'X_tr': X_tr, 'y_tr': y_tr,
        'val_X': X_v, 'val_y': y_v,
        'test_X': X_te, 'test_y': y_te,
        'n_train': len(X_tr)
    }
    all_train_X.append(X_tr)
    all_train_y.append(y_tr)
    all_val_X.append(X_v)
    all_val_y.append(y_v)
    all_test_X.append(X_te)
    all_test_y.append(y_te)

g_train_X, g_train_y = torch.cat(all_train_X), torch.cat(all_train_y)
g_val_X, g_val_y = torch.cat(all_val_X), torch.cat(all_val_y)
g_test_X, g_test_y = torch.cat(all_test_X), torch.cat(all_test_y)

def train_fedavg(seed, get_history=False, clients_dict=clients_data):
    torch.manual_seed(seed)
    np.random.seed(seed)
    global_model = MLP(len(features))
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    
    history = []
    
    for rnd in range(10):
        global_weights = global_model.state_dict()
        client_weights = []
        
        for z in clients_dict.keys():
            local_model = MLP(len(features))
            local_model.load_state_dict(global_weights)
            optimizer = optim.Adam(local_model.parameters(), lr=0.001)
            
            local_model.train()
            train_loss_sum = 0
            steps = 0
            for epoch in range(5):
                for bx, by in clients_dict[z]['loader']:
                    optimizer.zero_grad()
                    out = local_model(bx)
                    loss = criterion(out, by)
                    loss.backward()
                    optimizer.step()
                    train_loss_sum += loss.item()
                    steps += 1
            client_weights.append((local_model.state_dict(), clients_dict[z]['n_train'], train_loss_sum/steps))
        
        new_global_weights = {}
        total_n = sum(n for _, n, _ in client_weights)
        for k in global_weights.keys():
            new_global_weights[k] = sum(w[k] * n for w, n, _ in client_weights) / total_n
            
        global_model.load_state_dict(new_global_weights)
        
        if get_history:
            global_model.eval()
            with torch.no_grad():
                val_out = global_model(g_val_X)
                val_loss = criterion(val_out, g_val_y).item()
                val_prob = torch.sigmoid(val_out).numpy().flatten()
                m = calc_metrics(g_val_y.numpy().flatten(), val_prob)
                
            history.append({
                'Round': rnd + 1,
                'Avg_Client_Train_Loss': sum(l * n for _, n, l in client_weights) / total_n,
                'Validation_Loss': val_loss,
                'Validation_F1': m['F1'],
                'Validation_PR_AUC': m['PR-AUC']
            })
            
    return global_model, history

print("Running 3 Seeds FedAvg...")
fed_models = {}
for s in [42, 43, 44]:
    fed_models[s], hist = train_fedavg(s, get_history=(s==42))
    if s == 42:
        pd.DataFrame(hist).to_csv('results/federated_training_history.csv', index=False)
        model_seed42 = fed_models[s]

# 1. Reconcile Centralized Baseline
print("Training exact Centralized Match...")
torch.manual_seed(42)
cent_model = MLP(len(features))
optimizer = optim.Adam(cent_model.parameters(), lr=0.001)
criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
loader = DataLoader(TensorDataset(g_train_X, g_train_y), batch_size=64, shuffle=True)

for epoch in range(10*5): # equivalent updates
    cent_model.train()
    for bx, by in loader:
        optimizer.zero_grad()
        out = cent_model(bx)
        loss = criterion(out, by)
        loss.backward()
        optimizer.step()

cent_model.eval()
model_seed42.eval()
with torch.no_grad():
    c_prob = torch.sigmoid(cent_model(g_test_X)).numpy().flatten()
    f_prob = torch.sigmoid(model_seed42(g_test_X)).numpy().flatten()
    
c_m = calc_metrics(g_test_y.numpy().flatten(), c_prob)
f_m = calc_metrics(g_test_y.numpy().flatten(), f_prob)
print("Reconciled Centralized F1:", c_m['F1'], "FedAvg F1:", f_m['F1'])

# 3. Seed Summary
seed_res = []
for s in [42, 43, 44]:
    m = fed_models[s]
    m.eval()
    with torch.no_grad():
        prob = torch.sigmoid(m(g_test_X)).numpy().flatten()
    res = calc_metrics(g_test_y.numpy().flatten(), prob)
    res['Seed'] = s
    seed_res.append(res)
seed_df = pd.DataFrame(seed_res)
summary = seed_df.agg(['mean', 'std']).T
seed_df.to_csv('results/federated_seed_summary.csv', index=False)

# 2. Correct Undefined Per-Zone
zone_res = []
for z in zones:
    m = model_seed42
    with torch.no_grad():
        Xte, yte = clients_data[z]['test_X'], clients_data[z]['test_y'].numpy().flatten()
        prob = torch.sigmoid(m(Xte)).numpy().flatten()
    res = calc_metrics(yte, prob)
    res['Zone'] = z
    res['Test_Samples'] = len(yte)
    res['Positive_Targets'] = np.sum(yte == 1)
    res['Negative_Targets'] = np.sum(yte == 0)
    zone_res.append(res)
pd.DataFrame(zone_res).to_csv('results/federated_per_zone_corrected.csv', index=False)

# 4. Local-Only Baselines
local_res = []
for z in zones:
    torch.manual_seed(42)
    lm = MLP(len(features))
    opt = optim.Adam(lm.parameters(), lr=0.001)
    for epoch in range(50):
        lm.train()
        for bx, by in clients_data[z]['loader']:
            opt.zero_grad()
            l = criterion(lm(bx), by)
            l.backward()
            opt.step()
    lm.eval()
    with torch.no_grad():
        # Eval local test
        prob_loc = torch.sigmoid(lm(clients_data[z]['test_X'])).numpy().flatten()
        yte = clients_data[z]['test_y'].numpy().flatten()
        m_loc = calc_metrics(yte, prob_loc)
        m_loc['Train_Zone'] = z
        m_loc['Eval_Set'] = f'Local_{z}'
        local_res.append(m_loc)
        
        # Eval global test
        prob_glob = torch.sigmoid(lm(g_test_X)).numpy().flatten()
        m_glob = calc_metrics(g_test_y.numpy().flatten(), prob_glob)
        m_glob['Train_Zone'] = z
        m_glob['Eval_Set'] = 'Global'
        local_res.append(m_glob)

# Add Federated global eval
f_m['Train_Zone'] = 'Federated'
f_m['Eval_Set'] = 'Global'
local_res.append(f_m)
pd.DataFrame(local_res).to_csv('results/local_vs_federated_metrics.csv', index=False)

# 5. IID Control
np.random.seed(42)
idx = np.random.permutation(len(g_train_X))
iid_X = g_train_X[idx]
iid_y = g_train_y[idx]
chunk_size = len(iid_X) // 5
iid_clients = {}
for i in range(5):
    cX = iid_X[i*chunk_size : (i+1)*chunk_size]
    cy = iid_y[i*chunk_size : (i+1)*chunk_size]
    iid_clients[f'IID_{i}'] = {
        'loader': DataLoader(TensorDataset(cX, cy), batch_size=64, shuffle=True),
        'n_train': len(cX)
    }

iid_model, _ = train_fedavg(42, False, iid_clients)
iid_model.eval()
with torch.no_grad():
    prob_iid = torch.sigmoid(iid_model(g_test_X)).numpy().flatten()
iid_m = calc_metrics(g_test_y.numpy().flatten(), prob_iid)
iid_m['Type'] = 'IID_FedAvg'
f_m['Type'] = 'NonIID_FedAvg'
pd.DataFrame([iid_m, f_m]).to_csv('results/iid_vs_noniid_metrics.csv', index=False)

# 7. Threshold Analysis
model_seed42.eval()
with torch.no_grad():
    val_prob = torch.sigmoid(model_seed42(g_val_X)).numpy().flatten()
    val_y = g_val_y.numpy().flatten()
    
best_f1, best_t = 0, 0.5
for t in np.arange(0.1, 0.9, 0.05):
    f = calc_metrics(val_y, val_prob, t)['F1']
    if not np.isnan(f) and f > best_f1:
        best_f1, best_t = f, t

test_prob = f_prob
res_05 = calc_metrics(g_test_y.numpy().flatten(), test_prob, 0.5)
res_05['Threshold'] = 0.5
res_05['Type'] = 'Fixed'

res_opt = calc_metrics(g_test_y.numpy().flatten(), test_prob, best_t)
res_opt['Threshold'] = best_t
res_opt['Type'] = 'Validation_Selected'

pd.DataFrame([res_05, res_opt]).to_csv('results/federated_threshold_analysis.csv', index=False)

# 6. Event-Level Early Warning
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')
test_preds = pd.DataFrame()
offset = 0

for z in zones:
    te = clients_raw[z][2].copy()
    with torch.no_grad():
        te_prob = torch.sigmoid(model_seed42(clients_data[z]['test_X'])).numpy().flatten()
    te['prob'] = te_prob
    te['pred'] = (te_prob > best_t).astype(int)
    
    # Merge with GT
    z_gt = gt_df[gt_df['zone_id'] == z]
    te = pd.merge(te, z_gt[['zone_id', 'day_idx', 'latent_outbreak_onset']], on=['zone_id', 'day_idx'], how='left')
    test_preds = pd.concat([test_preds, te])

# Event-Level logic
total_onsets, detected_onsets = 0, 0
lead_times = []
false_alarm_episodes = 0
true_warning_episodes = 0
total_warning_episodes = 0

for z in zones:
    z_te = test_preds[test_preds['zone_id'] == z].reset_index(drop=True)
    onsets = z_te.index[z_te['latent_outbreak_onset'] == 1].tolist()
    total_onsets += len(onsets)
    
    # Check predictions for each onset
    for idx in onsets:
        # T-7 to T-1
        start = max(0, idx - 7)
        window = z_te.iloc[start:idx]
        if window['pred'].sum() > 0:
            detected_onsets += 1
            first_idx = window[window['pred'] == 1].index[0]
            lead_times.append(idx - first_idx)
            
    # Calculate Warning Episodes
    in_episode = False
    ep_start = 0
    for i in range(len(z_te)):
        if z_te.loc[i, 'pred'] == 1 and not in_episode:
            in_episode = True
            ep_start = i
        elif z_te.loc[i, 'pred'] == 0 and in_episode:
            in_episode = False
            total_warning_episodes += 1
            # Check T+1 to T+7 from ANY point in the episode. Or simply from the episode end?
            # A false alarm episode is one where no true onset occurs in [ep_start+1 : ep_end+7]
            end = i - 1
            horizon = z_te.loc[ep_start+1 : min(len(z_te)-1, end+7)]
            if horizon['latent_outbreak_onset'].sum() > 0:
                true_warning_episodes += 1
            else:
                false_alarm_episodes += 1
                
    if in_episode: # trailing episode
        total_warning_episodes += 1
        end = len(z_te) - 1
        horizon = z_te.loc[ep_start+1 : min(len(z_te)-1, end+7)]
        if horizon['latent_outbreak_onset'].sum() > 0:
            true_warning_episodes += 1
        else:
            false_alarm_episodes += 1

event_metrics = {
    'Total Onsets': total_onsets,
    'Detected Onsets': detected_onsets,
    'Missed Onsets': total_onsets - detected_onsets,
    'Detection Rate': detected_onsets / total_onsets if total_onsets > 0 else 0,
    'Mean Lead Time': np.mean(lead_times) if lead_times else 0,
    'Median Lead Time': np.median(lead_times) if lead_times else 0,
    'Total Warning Episodes': total_warning_episodes,
    'True Warning Episodes': true_warning_episodes,
    'False Alarm Episodes': false_alarm_episodes,
    'False Alarm Rate (Per Episode)': false_alarm_episodes / total_warning_episodes if total_warning_episodes > 0 else 0
}

with open('results/federated_event_detection_metrics.json', 'w') as f:
    json.dump(event_metrics, f, indent=4)

# 9. Comm Cost
num_params = sum(p.numel() for p in model_seed42.parameters() if p.requires_grad)
param_size_mb = num_params * 4 / (1024 * 1024)
comm = {
    'Trainable Parameters': num_params,
    'Model Size (MB)': param_size_mb,
    'Clients': 5,
    'Rounds': 10,
    'Uploads/Downloads per Round': 10,
    'Total Transfer Volume (MB)': param_size_mb * 10 * 10 # 5 up, 5 down per round * 10 rounds
}
with open('results/federated_communication_cost.json', 'w') as f:
    json.dump(comm, f, indent=4)

print("Evaluation Complete. All files written.")

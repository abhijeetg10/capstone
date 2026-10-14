import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results', exist_ok=True)

zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
features = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
            'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 'humidity', 'rainfall']
target = 'outbreak_onset_next_7_days'

# 1. SETUP & RE-RUN FedAvg to get exact predictions
global_n, global_pos, global_neg = 0, 0, 0
global_sum = np.zeros(len(features))
global_sq_sum = np.zeros(len(features))

clients_raw = {}

for z in zones:
    df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    n = len(df)
    clients_raw[z] = (df.iloc[:int(n*0.7)], df.iloc[int(n*0.7):int(n*0.85)], df.iloc[int(n*0.85):])
    
    X = clients_raw[z][0][features].values
    y = clients_raw[z][0][target].values
    
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
            nn.Linear(input_dim, 64), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x)

def prep(d):
    X = (d[features].values - global_mean) / global_std
    y = d[target].values
    return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32).unsqueeze(1)

clients_data = {}
for z in zones:
    X_tr, y_tr = prep(clients_raw[z][0])
    X_te, y_te = prep(clients_raw[z][2])
    clients_data[z] = {
        'loader': DataLoader(TensorDataset(X_tr, y_tr), batch_size=64, shuffle=True),
        'n_train': len(X_tr),
        'test_X': X_te, 'test_y': y_te
    }

torch.manual_seed(42)
np.random.seed(42)
global_model = MLP(len(features))
criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))

for rnd in range(10):
    global_weights = global_model.state_dict()
    client_weights = []
    for z in zones:
        local_model = MLP(len(features))
        local_model.load_state_dict(global_weights)
        optimizer = optim.Adam(local_model.parameters(), lr=0.001)
        local_model.train()
        for epoch in range(5):
            for bx, by in clients_data[z]['loader']:
                optimizer.zero_grad()
                loss = criterion(local_model(bx), by)
                loss.backward()
                optimizer.step()
        client_weights.append((local_model.state_dict(), clients_data[z]['n_train']))
        
    new_global_weights = {}
    total_n = sum(n for _, n in client_weights)
    for k in global_weights.keys():
        new_global_weights[k] = sum(w[k] * n for w, n in client_weights) / total_n
    global_model.load_state_dict(new_global_weights)

global_model.eval()

# 2. CREATE AUDIT MAPPING
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')
mapping_rows = []
tp_rows = []
mismatches = 0

print("============================================================")
print("1. TEST-PREDICTION AUDIT TABLE")
print("============================================================")

for z in zones:
    z_gt = gt_df[gt_df['zone_id'] == z].copy()
    z_onsets = z_gt[z_gt['latent_outbreak_onset'] == 1]['day_idx'].values
    
    test_raw = clients_raw[z][2]
    with torch.no_grad():
        probs = torch.sigmoid(global_model(clients_data[z]['test_X'])).numpy().flatten()
    preds = (probs > 0.5).astype(int)
    
    for i, (_, row) in enumerate(test_raw.iterrows()):
        T = int(row['day_idx'])
        y_stored = int(row[target])
        y_pred = preds[i]
        y_prob = probs[i]
        
        # Recompute Target
        future_onsets = [O for O in z_onsets if O > T]
        next_onset = future_onsets[0] if future_onsets else np.nan
        days_until = next_onset - T if future_onsets else np.nan
        falls_in_horizon = 1 if (1 <= days_until <= 7) else 0
        
        if y_stored != falls_in_horizon:
            # Special case: generator used min_periods=1, so if onset is outside dataset it might not trigger.
            # We strictly log this mismatch.
            mismatches += 1
            
        status = ''
        if y_pred == 1 and y_stored == 1: status = 'TP'
        elif y_pred == 1 and y_stored == 0: status = 'FP'
        elif y_pred == 0 and y_stored == 1: status = 'FN'
        else: status = 'TN'
        
        mapping = {
            'zone_id': z,
            'prediction_date': T,
            'target': y_stored,
            'predicted_probability': y_prob,
            'predicted_class': y_pred,
            'status': status,
            'next_latent_onset_date': next_onset,
            'days_until_next_onset': days_until,
            'falls_in_horizon': falls_in_horizon
        }
        mapping_rows.append(mapping)
        if status == 'TP':
            tp_rows.append(mapping)

mapping_df = pd.DataFrame(mapping_rows)
mapping_df.to_csv('results/test_prediction_event_mapping.csv', index=False)
print("Mapping saved to results/test_prediction_event_mapping.csv")

print("\n============================================================")
print("2. TRUE POSITIVE INSPECTION")
print("============================================================")
for r in tp_rows:
    print(f"Zone: {r['zone_id']} | Date: {r['prediction_date']} | Prob: {r['predicted_probability']:.4f} | Target: {r['target']} | Next Onset: {r['next_latent_onset_date']} | Lead Time: {r['days_until_next_onset']} days")
    if not (1 <= r['days_until_next_onset'] <= 7):
        print("  -> WARNING: Lead time is out of bounds! This confirms an evaluation mapping error.")

print("\n============================================================")
print("3. TARGET GENERATION VERIFICATION")
print("============================================================")
print(f"Stored vs Recomputed Target Mismatches: {mismatches}")

print("\n============================================================")
print("7. REPORT TEST-SET EVENT COUNTS")
print("============================================================")

total_raw_onsets = 0
fully_eval_onsets = 0
boundary_onsets = 0
detected_events = 0
lead_times = []
warning_episodes = []

for z in zones:
    z_map = mapping_df[mapping_df['zone_id'] == z]
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    
    test_start = z_map['prediction_date'].min()
    test_end = z_map['prediction_date'].max()
    
    for O in z_onsets:
        # Eligible if ANY of its 7 preceding days are in the test set.
        if (O - 1 < test_start) or (O - 7 > test_end):
            continue
            
        total_raw_onsets += 1
        
        preds_window = z_map[(z_map['prediction_date'] >= O - 7) & (z_map['prediction_date'] <= O - 1)]
        if len(preds_window) == 7:
            fully_eval_onsets += 1
        else:
            boundary_onsets += 1
            
        if preds_window['predicted_class'].sum() > 0:
            detected_events += 1
            first_pos = preds_window[preds_window['predicted_class'] == 1]['prediction_date'].min()
            lead_times.append(O - first_pos)
            
    # Warning episodes
    ep_start = None
    in_episode = False
    ep_dates = []
    
    for _, row in z_map.iterrows():
        if row['predicted_class'] == 1:
            if not in_episode:
                in_episode = True
                ep_start = row['prediction_date']
            ep_dates.append(row['prediction_date'])
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
    # A true warning episode has at least one onset in [start+1, end+7]
    w_start = ep['start'] + 1
    w_end = ep['end'] + 7
    z_onsets = gt_df[(gt_df['zone_id'] == ep['zone']) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    
    if any((O >= w_start) and (O <= w_end) for O in z_onsets):
        true_eps += 1
    else:
        false_eps += 1

print(f"Total Raw Outbreak Onsets in Test Period: {total_raw_onsets}")
print(f"Fully Evaluable Onsets: {fully_eval_onsets}")
print(f"Partially Evaluable (Boundary) Onsets: {boundary_onsets}")
print(f"Detected Events: {detected_events}")
print(f"Missed Events (Fully/Partially): {total_raw_onsets - detected_events}")
print(f"Event Detection Rate: {detected_events / max(1, total_raw_onsets):.2f}")
print(f"Lead Times of Detections: {lead_times}")
print(f"Mean Lead Time: {np.mean(lead_times) if lead_times else 0:.2f}")
print(f"Median Lead Time: {np.median(lead_times) if lead_times else 0:.2f}")
print(f"Total Warning Episodes: {len(warning_episodes)}")
print(f"True Warning Episodes: {true_eps}")
print(f"False Warning Episodes: {false_eps}")
print(f"False Alarm Rate (Per Episode): {false_eps / max(1, len(warning_episodes)):.2f}")

print("\n============================================================")
print("8. FINAL TEST CLASS STRUCTURE (Onset -> Dates Mapping)")
print("============================================================")
for z in zones:
    z_map = mapping_df[(mapping_df['zone_id'] == z) & (mapping_df['target'] == 1)]
    if len(z_map) == 0:
        continue
    print(f"\n{z} Positive Targets ({len(z_map)} total days):")
    # Group by the corresponding future onset date
    grouped = z_map.groupby('next_latent_onset_date')
    for onset, group in grouped:
        dates = group['prediction_date'].tolist()
        print(f"  -> Onset Date {onset} generated positive targets on dates: {dates}")

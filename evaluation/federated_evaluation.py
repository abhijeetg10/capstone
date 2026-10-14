import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader
from sklearn.metrics import (precision_score, recall_score, f1_score, roc_auc_score, 
                             average_precision_score, confusion_matrix)
import warnings
warnings.filterwarnings('ignore')

os.makedirs('evaluation', exist_ok=True)
os.makedirs('results', exist_ok=True)

zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
features = ['hospital_cases', 'hosp_cases_7d_mean', 
            'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
            'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth',
            'temperature', 'humidity', 'rainfall']
target = 'outbreak_onset_next_7_days'

print("=== 1. PREPROCESSING WITHOUT RAW-DATA CENTRALIZATION ===")
global_n = 0
global_sum = np.zeros(len(features))
global_sq_sum = np.zeros(len(features))
global_pos = 0
global_neg = 0

for z in zones:
    df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    train_len = int(len(df) * 0.7)
    train_df = df.iloc[:train_len]
    
    X = train_df[features].values
    y = train_df[target].values
    
    # Aggregating sufficient statistics only
    global_n += len(X)
    global_sum += np.sum(X, axis=0)
    global_sq_sum += np.sum(X**2, axis=0)
    global_pos += np.sum(y == 1)
    global_neg += np.sum(y == 0)

global_mean = global_sum / global_n
global_var = (global_sq_sum / global_n) - (global_mean ** 2)
global_std = np.sqrt(np.maximum(global_var, 1e-8))
pos_weight = global_neg / global_pos

print(f"Global Training Rows: {global_n}")
print(f"Global Pos Weight: {pos_weight:.4f}")

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

print("\n=== 2. FEDERATED LEARNING (FedAvg) ===")
# Simulating the Flower FedAvg algorithm synchronously to ensure exact 
# chronological evaluation without gRPC/network/Ray overhead.

clients_data = {}
for z in zones:
    df = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    n = len(df)
    
    # Strictly preserving chronological boundaries
    train_df = df.iloc[:int(n*0.7)]
    val_df = df.iloc[int(n*0.7):int(n*0.85)]
    test_df = df.iloc[int(n*0.85):]
    
    def prep(d):
        X = (d[features].values - global_mean) / global_std
        y = d[target].values
        return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32).unsqueeze(1)
    
    X_tr, y_tr = prep(train_df)
    X_v, y_v = prep(val_df)
    X_te, y_te = prep(test_df)
    
    ds = TensorDataset(X_tr, y_tr)
    loader = DataLoader(ds, batch_size=64, shuffle=True)
    
    clients_data[z] = {
        'loader': loader,
        'val_X': X_v, 'val_y': y_v,
        'test_X': X_te, 'test_y': y_te,
        'n_train': len(X_tr)
    }

global_model = MLP(len(features))
criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))

num_rounds = 10
local_epochs = 5

for rnd in range(num_rounds):
    print(f"--- Federated Round {rnd+1}/{num_rounds} ---")
    global_weights = global_model.state_dict()
    
    client_weights = []
    
    for z in zones:
        local_model = MLP(len(features))
        local_model.load_state_dict(global_weights)
        optimizer = optim.Adam(local_model.parameters(), lr=0.001)
        
        local_model.train()
        for epoch in range(local_epochs):
            for bx, by in clients_data[z]['loader']:
                optimizer.zero_grad()
                out = local_model(bx)
                loss = criterion(out, by)
                loss.backward()
                optimizer.step()
                
        client_weights.append((local_model.state_dict(), clients_data[z]['n_train']))
    
    # Flower FedAvg Aggregation
    new_global_weights = {}
    total_n = sum(n for _, n in client_weights)
    for k in global_weights.keys():
        new_global_weights[k] = sum(w[k] * n for w, n in client_weights) / total_n
        
    global_model.load_state_dict(new_global_weights)

print("\n=== 3. EVALUATION ON TEST SETS ===")
global_model.eval()

results = []
all_y_true = []
all_y_prob = []
all_y_pred = []

with torch.no_grad():
    for z in zones:
        X_te = clients_data[z]['test_X']
        y_te = clients_data[z]['test_y'].numpy().flatten()
        
        out = global_model(X_te)
        probs = torch.sigmoid(out).numpy().flatten()
        preds = (probs > 0.5).astype(int)
        
        all_y_true.extend(y_te)
        all_y_prob.extend(probs)
        all_y_pred.extend(preds)
        
        cm = confusion_matrix(y_te, preds)
        tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0,0,0,0)
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        results.append({
            'Zone': z,
            'Precision': round(precision_score(y_te, preds, zero_division=0), 3),
            'Recall': round(recall_score(y_te, preds, zero_division=0), 3),
            'F1': round(f1_score(y_te, preds, zero_division=0), 3),
            'PR-AUC': round(average_precision_score(y_te, probs) if len(np.unique(y_te)) > 1 else 0.0, 3),
            'Specificity': round(spec, 3),
            'FPR': round(fpr, 3)
        })

all_y_true = np.array(all_y_true)
all_y_prob = np.array(all_y_prob)
all_y_pred = np.array(all_y_pred)

cm = confusion_matrix(all_y_true, all_y_pred)
tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0,0,0,0)
spec = tn / (tn + fp) if (tn + fp) > 0 else 0
fpr = fp / (fp + tn) if (fp + tn) > 0 else 0

results.append({
    'Zone': 'Global_Federated_Model',
    'Precision': round(precision_score(all_y_true, all_y_pred, zero_division=0), 3),
    'Recall': round(recall_score(all_y_true, all_y_pred, zero_division=0), 3),
    'F1': round(f1_score(all_y_true, all_y_pred, zero_division=0), 3),
    'PR-AUC': round(average_precision_score(all_y_true, all_y_prob), 3),
    'Specificity': round(spec, 3),
    'FPR': round(fpr, 3)
})

res_df = pd.DataFrame(results)
print(res_df.to_string(index=False))
res_df.to_csv('results/federated_model_metrics.csv', index=False)
print("\nFederated metrics saved to results/federated_model_metrics.csv")
print("=== FEDERATED EVALUATION COMPLETE ===")

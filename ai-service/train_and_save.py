import os
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import pickle

FEATURES = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
            'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
            'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
            'humidity', 'rainfall']

class MLP(nn.Module):
    def __init__(self, in_features=12, drop=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 64), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(32, 1)
        )
    def forward(self, x): return self.net(x).squeeze(1)

def main():
    print("Saving frozen model for production...")
    # Use seed 1010 Train split as the frozen representation
    seed = 1010
    base_dir = f"../simulation_replicates/seed_{seed}"
    gt = pd.read_csv(f"{base_dir}/latent_ground_truth.csv")
    
    ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
    df_all = []
    
    for z in ZONES:
        df = pd.read_csv(f"{base_dir}/{z}_observable_daily.csv")
        gt_z = gt[gt['zone_id'] == z]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_active', 'latent_outbreak_onset']], on='day_idx', how='left')
        df['split'] = df['day_idx'].apply(lambda d: 'Train' if d <= 765 else 'None')
        df['valid_anchor'] = (df['latent_outbreak_active'] == 0).astype(int)
        df_all.append(df[(df['split'] == 'Train') & (df['valid_anchor'] == 1)])
        
    tr_df = pd.concat(df_all)
    x_val = tr_df[FEATURES].values
    mean = x_val.mean(axis=0)
    std = x_val.std(axis=0)
    std[std == 0] = 1.0
    
    # Save scaler
    os.makedirs('models', exist_ok=True)
    with open('models/scaler.pkl', 'wb') as f:
        pickle.dump({'mean': mean, 'std': std}, f)
        
    pos_c = tr_df['outbreak_onset_next_7_days'].sum()
    neg_c = len(tr_df) - pos_c
    pos_weight = neg_c / max(1, pos_c)
    
    x_t = torch.tensor((x_val - mean) / std, dtype=torch.float32)
    y_t = torch.tensor(tr_df['outbreak_onset_next_7_days'].values, dtype=torch.float32)
    
    torch.manual_seed(42)
    model = MLP()
    opt = torch.optim.Adam(model.parameters(), lr=5e-4)
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    
    model.train()
    sz = len(x_t)
    for _ in range(10): # 10 epochs
        perm = torch.randperm(sz)
        for i in range(0, sz, 256):
            idx = perm[i:i+256]
            opt.zero_grad()
            loss = crit(model(x_t[idx]), y_t[idx])
            loss.backward()
            opt.step()
            
    torch.save(model.state_dict(), 'models/frozen_mlp.pth')
    print("Frozen model and scaler saved.")

if __name__ == '__main__':
    main()

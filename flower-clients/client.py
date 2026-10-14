import flwr as fl
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import argparse
import sys
import os
import pickle
from collections import OrderedDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "ai-service"))

from main import MLP, FEATURES

class ZoneClient(fl.client.NumPyClient):
    def __init__(self, zone_id, seed=1010):
        self.zone_id = zone_id
        self.model = MLP()
        
        # Load dataset for the zone
        base_path = os.path.join(BASE_DIR, "simulation_replicates", f"seed_{seed}")
        df = pd.read_csv(os.path.join(base_path, f"{zone_id}_observable_daily.csv"))
        gt = pd.read_csv(os.path.join(base_path, "latent_ground_truth.csv"))
        gt_z = gt[gt['zone_id'] == zone_id]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_active', 'latent_outbreak_onset']], on='day_idx', how='left')
        
        # Train split only! (Chronological split)
        df['split'] = df['day_idx'].apply(lambda d: 'Train' if d <= 765 else 'None')
        df['valid_anchor'] = (df['latent_outbreak_active'] == 0).astype(int)
        tr_df = df[(df['split'] == 'Train') & (df['valid_anchor'] == 1)]
        
        # Load scaler
        with open(os.path.join(BASE_DIR, "ai-service", "models", "scaler.pkl"), 'rb') as f:
            self.scaler = pickle.load(f)
            
        x_val = tr_df[FEATURES].values
        self.x_train = torch.tensor((x_val - self.scaler['mean']) / self.scaler['std'], dtype=torch.float32)
        
        target = gt_z.set_index('day_idx')['outbreak_onset_next_7_days']
        y_val = tr_df.apply(lambda r: target.get(r['day_idx'], 0), axis=1).values
        self.y_train = torch.tensor(y_val, dtype=torch.float32)
        
        pos_c = sum(y_val)
        neg_c = len(y_val) - pos_c
        self.pos_weight = neg_c / max(1, pos_c)
        
    def get_parameters(self, config):
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def set_parameters(self, parameters):
        params_dict = zip(self.model.state_dict().keys(), parameters)
        state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        self.set_parameters(parameters)
        opt = torch.optim.Adam(self.model.parameters(), lr=5e-4)
        crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([self.pos_weight], dtype=torch.float32))
        
        self.model.train()
        sz = len(self.x_train)
        epochs = config.get("epochs", 1)
        for _ in range(epochs):
            perm = torch.randperm(sz)
            for i in range(0, sz, 32):
                idx = perm[i:i+32]
                opt.zero_grad()
                loss = crit(self.model(self.x_train[idx]), self.y_train[idx])
                loss.backward()
                opt.step()
                
        return self.get_parameters(config), sz, {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        self.model.eval()
        crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([self.pos_weight], dtype=torch.float32))
        with torch.no_grad():
            loss = crit(self.model(self.x_train), self.y_train)
        return float(loss), len(self.x_train), {"loss": float(loss)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--zone", type=str, required=True, help="Zone_A, Zone_B, etc.")
    args = parser.parse_args()
    
    # Try to connect, if server is not in docker, might be localhost
    server_host = os.environ.get("FLOWER_SERVER_HOST", "127.0.0.1")
    server_port = os.environ.get("FLOWER_SERVER_PORT", "8080")
    
    fl.client.start_numpy_client(
        server_address=f"{server_host}:{server_port}",
        client=ZoneClient(args.zone)
    )

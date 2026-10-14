import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_recall_curve, average_precision_score, roc_auc_score,
    precision_score, recall_score, f1_score, confusion_matrix, brier_score_loss
)
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_development', exist_ok=True)
DEV_SEEDS = list(range(1000, 1010))

# ----------------- Models -----------------
class MLP(nn.Module):
    def __init__(self, input_dim, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x).squeeze(1)

class GRUModel(nn.Module):
    def __init__(self, input_dim, hidden_dim=16):
        super().__init__()
        self.gru = nn.GRU(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)
    def forward(self, x):
        _, h_n = self.gru(x)
        return self.fc(h_n[-1]).squeeze(1)

def get_data(seed, features, seq_len=1):
    assert seed in DEV_SEEDS, "EVALUATION SEEDS LOCKED"
    base_dir = f"simulation_replicates/seed_{seed}"
    zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
    
    tr_x, tr_y, va_x, va_y, te_x, te_y = [], [], [], [], [], []
    tr_meta, va_meta, te_meta = [], [], []
    
    for z in zones:
        df = pd.read_csv(f"{base_dir}/{z}_features.csv")
        gt = pd.read_csv(f"{base_dir}/latent_ground_truth.csv")
        gt_z = gt[gt['zone_id'] == z]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_onset']], on='day_idx', how='left')
        
        n = len(df)
        if seq_len > 1:
            X, Y, M = [], [], []
            feat_data = df[features].values
            y_data = df['outbreak_onset_next_7_days'].values
            for i in range(seq_len, n):
                X.append(feat_data[i-seq_len:i])
                Y.append(y_data[i-1])
                M.append((z, df['day_idx'].iloc[i-1], df['latent_outbreak_onset'].iloc[i-1]))
            X, Y = np.array(X), np.array(Y)
            n_seq = len(X)
            idx1, idx2 = int(n_seq*0.7), int(n_seq*0.85)
            
            tr_x.append(X[:idx1]); tr_y.append(Y[:idx1]); tr_meta.extend(M[:idx1])
            va_x.append(X[idx1:idx2]); va_y.append(Y[idx1:idx2]); va_meta.extend(M[idx1:idx2])
            te_x.append(X[idx2:]); te_y.append(Y[idx2:]); te_meta.extend(M[idx2:])
        else:
            idx1, idx2 = int(n*0.7), int(n*0.85)
            X = df[features].values
            Y = df['outbreak_onset_next_7_days'].values
            M = list(zip(df['zone_id'], df['day_idx'], df['latent_outbreak_onset']))
            
            tr_x.append(X[:idx1]); tr_y.append(Y[:idx1]); tr_meta.extend(M[:idx1])
            va_x.append(X[idx1:idx2]); va_y.append(Y[idx1:idx2]); va_meta.extend(M[idx1:idx2])
            te_x.append(X[idx2:]); te_y.append(Y[idx2:]); te_meta.extend(M[idx2:])
            
    return (np.concatenate(tr_x), np.concatenate(tr_y), pd.DataFrame(tr_meta, columns=['zone','day','onset'])), \
           (np.concatenate(va_x), np.concatenate(va_y), pd.DataFrame(va_meta, columns=['zone','day','onset'])), \
           (np.concatenate(te_x), np.concatenate(te_y), pd.DataFrame(te_meta, columns=['zone','day','onset']))

def calc_metrics(y_true, y_prob, thresh=0.5):
    y_pred = (y_prob > thresh).astype(int)
    if len(np.unique(y_true)) > 1:
        pr_auc = average_precision_score(y_true, y_prob)
        auroc = roc_auc_score(y_true, y_prob)
        brier = brier_score_loss(y_true, y_prob)
    else:
        pr_auc, auroc, brier = 0.0, 0.0, 0.0
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    spec = tn / (tn + fp) if (tn+fp)>0 else 0.0
    fpr = fp / (tn + fp) if (tn+fp)>0 else 0.0
    return {'PR-AUC': pr_auc, 'AUROC': auroc, 'Precision': prec, 'Recall': rec, 
            'F1': f1, 'Specificity': spec, 'FPR': fpr, 'Brier': brier}

def evaluate_events(meta, y_prob, thresh=0.5):
    meta = meta.copy()
    meta['prob'] = y_prob
    meta['pred'] = (y_prob > thresh).astype(int)
    
    total_onsets = meta[meta['onset'] == 1]
    detected = 0
    leads = []
    
    for _, row in total_onsets.iterrows():
        z, o_day = row['zone'], row['day']
        window = meta[(meta['zone'] == z) & (meta['day'] >= o_day - 7) & (meta['day'] < o_day)]
        if len(window) > 0 and window['pred'].max() == 1:
            detected += 1
            first_warn = window[window['pred'] == 1]['day'].min()
            leads.append(o_day - first_warn)
            
    # Warning episodes
    # Merge consecutive predictions
    episodes = 0
    false_episodes = 0
    for z in meta['zone'].unique():
        zdf = meta[meta['zone'] == z].sort_values('day')
        preds = zdf['pred'].values
        diffs = np.diff(np.concatenate([[0], preds]))
        starts = np.where(diffs == 1)[0]
        ends = np.where(diffs == -1)[0]
        if len(ends) < len(starts):
            ends = np.append(ends, len(preds))
        
        episodes += len(starts)
        # Check if episode corresponds to an onset in next 7 days
        for s, e in zip(starts, ends):
            # check next 7 days from episode start
            start_day = zdf['day'].iloc[s]
            future = zdf[(zdf['day'] > start_day) & (zdf['day'] <= start_day + 7)]
            if future['onset'].sum() == 0:
                false_episodes += 1
                
    return {
        'total_evaluable_onsets': len(total_onsets),
        'detected_onsets': detected,
        'missed_onsets': len(total_onsets) - detected,
        'event_detection_rate': detected / max(1, len(total_onsets)),
        'earliest_warning': max(leads) if leads else 0,
        'mean_lead_time': np.mean(leads) if leads else 0,
        'median_lead_time': np.median(leads) if leads else 0,
        'total_warning_episodes': episodes,
        'true_warning_episodes': episodes - false_episodes,
        'false_warning_episodes': false_episodes,
        'false_warning_rate': false_episodes / max(1, episodes)
    }

def find_best_threshold(y_true, y_prob):
    prec, rec, thresh = precision_recall_curve(y_true, y_prob)
    f1s = 2 * (prec * rec) / (prec + rec + 1e-8)
    best_idx = np.argmax(f1s)
    if best_idx >= len(thresh):
        best_idx = len(thresh) - 1
    return thresh[best_idx]

def train_nn(model_cls, kwargs, tr_x, tr_y, va_x, va_y, lr, pos_weight, seed):
    torch.manual_seed(seed)
    model = model_cls(**kwargs)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    
    xt = torch.tensor(tr_x, dtype=torch.float32)
    yt = torch.tensor(tr_y, dtype=torch.float32)
    xv = torch.tensor(va_x, dtype=torch.float32)
    yv = torch.tensor(va_y, dtype=torch.float32)
    
    dataset = TensorDataset(xt, yt)
    loader = DataLoader(dataset, batch_size=256, shuffle=True)
    
    best_va = 0
    best_model = None
    
    for ep in range(15):
        model.train()
        for bx, by in loader:
            opt.zero_grad()
            out = model(bx)
            loss = crit(out, by)
            loss.backward()
            opt.step()
            
        model.eval()
        with torch.no_grad():
            vp = torch.sigmoid(model(xv)).numpy()
            pr = average_precision_score(va_y, vp) if len(np.unique(va_y)) > 1 else 0
            if pr >= best_va:
                best_va = pr
                best_model = model.state_dict()
                
    model.load_state_dict(best_model)
    model.eval()
    return model

def main():
    print("Starting Model Development Phase...")
    
    features_all = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
                    'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
                    'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
                    'humidity', 'rainfall']
                    
    baseline_res = []
    mlp_res = []
    gru_res = []
    
    mlp_configs = [{'lr': 1e-3, 'drop': 0.2}, {'lr': 1e-3, 'drop': 0.3}, {'lr': 5e-4, 'drop': 0.2}]
    gru_configs = [{'lr': 1e-3, 'hid': 16, 'seq': 7}, {'lr': 1e-3, 'hid': 32, 'seq': 7},
                   {'lr': 1e-3, 'hid': 16, 'seq': 14}, {'lr': 5e-4, 'hid': 32, 'seq': 14}]
    model_seeds = [42, 43, 44]
    
    for seed in DEV_SEEDS:
        print(f"Simulation Seed: {seed}")
        # A. Baselines
        tr, va, te = get_data(seed, features_all, 1)
        tr_x, tr_y, tr_meta = tr
        va_x, va_y, va_meta = va
        te_x, te_y, te_meta = te
        
        scaler = StandardScaler().fit(tr_x)
        tr_xs = scaler.transform(tr_x)
        va_xs = scaler.transform(va_x)
        te_xs = scaler.transform(te_x)
        
        # Dummy
        p_prev = np.mean(tr_y)
        d_p = np.full_like(va_y, p_prev, dtype=float)
        b_met = calc_metrics(va_y, d_p, 0.5)
        baseline_res.append({'Model': 'Dummy', 'Sim_Seed': seed, **b_met})
        
        # LR
        lr_model = LogisticRegression(class_weight='balanced', max_iter=200).fit(tr_xs, tr_y)
        lr_p = lr_model.predict_proba(va_xs)[:,1]
        baseline_res.append({'Model': 'LogReg', 'Sim_Seed': seed, **calc_metrics(va_y, lr_p, 0.5)})
        
        # HistGBM
        hgb = HistGradientBoostingClassifier(random_state=42).fit(tr_xs, tr_y)
        hg_p = hgb.predict_proba(va_xs)[:,1]
        baseline_res.append({'Model': 'HistGBM', 'Sim_Seed': seed, **calc_metrics(va_y, hg_p, 0.5)})
        
        pos_w = np.sum(tr_y == 0) / max(1, np.sum(tr_y == 1))
        
        # MLP
        for c in mlp_configs:
            for ms in model_seeds:
                net = train_nn(MLP, {'input_dim': len(features_all), 'dropout': c['drop']}, 
                               tr_xs, tr_y, va_xs, va_y, c['lr'], pos_w, ms)
                with torch.no_grad():
                    vp = torch.sigmoid(net(torch.tensor(va_xs, dtype=torch.float32))).numpy()
                met = calc_metrics(va_y, vp, 0.5)
                mlp_res.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Config': str(c), **met})
                
        # GRU
        for c in gru_configs:
            # Need sequential data
            tr_seq, va_seq, te_seq = get_data(seed, features_all, c['seq'])
            tr_x_sq, tr_y_sq, _ = tr_seq
            va_x_sq, va_y_sq, _ = va_seq
            
            # Normalize 3D
            shp_tr = tr_x_sq.shape
            shp_va = va_x_sq.shape
            tr_x_sq_flat = tr_x_sq.reshape(-1, shp_tr[-1])
            va_x_sq_flat = va_x_sq.reshape(-1, shp_va[-1])
            
            sc_sq = StandardScaler().fit(tr_x_sq_flat)
            tr_x_sq = sc_sq.transform(tr_x_sq_flat).reshape(shp_tr)
            va_x_sq = sc_sq.transform(va_x_sq_flat).reshape(shp_va)
            
            for ms in model_seeds:
                net = train_nn(GRUModel, {'input_dim': len(features_all), 'hidden_dim': c['hid']}, 
                               tr_x_sq, tr_y_sq, va_x_sq, va_y_sq, c['lr'], pos_w, ms)
                with torch.no_grad():
                    vp = torch.sigmoid(net(torch.tensor(va_x_sq, dtype=torch.float32))).numpy()
                met = calc_metrics(va_y_sq, vp, 0.5)
                gru_res.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Config': str(c), **met})

    pd.DataFrame(baseline_res).to_csv('results_development/baseline_metrics.csv', index=False)
    df_mlp = pd.DataFrame(mlp_res)
    df_mlp.to_csv('results_development/mlp_metrics.csv', index=False)
    df_gru = pd.DataFrame(gru_res)
    df_gru.to_csv('results_development/gru_metrics.csv', index=False)
    
    # 12. Architecture Selection
    mlp_agg = df_mlp.groupby('Config')['PR-AUC'].mean().reset_index()
    gru_agg = df_gru.groupby('Config')['PR-AUC'].mean().reset_index()
    
    best_mlp = mlp_agg.loc[mlp_agg['PR-AUC'].idxmax()]
    best_gru = gru_agg.loc[gru_agg['PR-AUC'].idxmax()]
    
    arch = []
    arch.append({'Architecture': 'MLP', 'Best_Config': best_mlp['Config'], 'Val_PR_AUC': best_mlp['PR-AUC']})
    arch.append({'Architecture': 'GRU', 'Best_Config': best_gru['Config'], 'Val_PR_AUC': best_gru['PR-AUC']})
    pd.DataFrame(arch).to_csv('results_development/architecture_comparison.csv', index=False)
    
    # Ablation
    # Choose architecture based on 0.02 absolute difference rule
    if best_gru['PR-AUC'] - best_mlp['PR-AUC'] > 0.02:
        fed_arch = 'GRU'
        best_c = eval(best_gru['Config'])
    else:
        fed_arch = 'MLP'
        best_c = eval(best_mlp['Config'])
        
    print(f"Selected Federatable Architecture: {fed_arch}")
    with open('results_development/frozen_model_config.json', 'w') as f:
        json.dump({'architecture': fed_arch, 'hyperparameters': best_c}, f, indent=4)

    # 17. Source Ablation (on MLP as example or chosen arch)
    ablation_sets = {
        'Exp1_Hosp': ['hospital_cases', 'hosp_cases_7d_mean'],
        'Exp2_Hosp_Lab': ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean'],
        'Exp3_Hosp_Lab_Pharm': ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth'],
        'Exp4_All': features_all
    }
    
    ablation_res = []
    for exp, feats in ablation_sets.items():
        for seed in DEV_SEEDS:
            seq_len = best_c.get('seq', 1)
            tr, va, _ = get_data(seed, feats, seq_len)
            tr_x, tr_y, _ = tr
            va_x, va_y, _ = va
            
            if seq_len > 1:
                shp_tr, shp_va = tr_x.shape, va_x.shape
                sc = StandardScaler().fit(tr_x.reshape(-1, shp_tr[-1]))
                tr_xs = sc.transform(tr_x.reshape(-1, shp_tr[-1])).reshape(shp_tr)
                va_xs = sc.transform(va_x.reshape(-1, shp_va[-1])).reshape(shp_va)
            else:
                sc = StandardScaler().fit(tr_x)
                tr_xs, va_xs = sc.transform(tr_x), sc.transform(va_x)
            
            pos_w = np.sum(tr_y == 0) / max(1, np.sum(tr_y == 1))
            
            if fed_arch == 'MLP':
                net = train_nn(MLP, {'input_dim': len(feats), 'dropout': best_c['drop']}, tr_xs, tr_y, va_xs, va_y, best_c['lr'], pos_w, 42)
            else:
                net = train_nn(GRUModel, {'input_dim': len(feats), 'hidden_dim': best_c['hid']}, tr_xs, tr_y, va_xs, va_y, best_c['lr'], pos_w, 42)
                
            with torch.no_grad():
                vp = torch.sigmoid(net(torch.tensor(va_xs, dtype=torch.float32))).numpy()
            met = calc_metrics(va_y, vp, 0.5)
            ablation_res.append({'Experiment': exp, 'Sim_Seed': seed, 'PR-AUC': met['PR-AUC'], 'AUROC': met['AUROC']})
            
    pd.DataFrame(ablation_res).to_csv('results_development/source_ablation.csv', index=False)

if __name__ == '__main__':
    main()

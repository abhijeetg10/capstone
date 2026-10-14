import os
import json
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    average_precision_score, roc_auc_score, precision_score, 
    recall_score, f1_score, confusion_matrix, brier_score_loss
)
import copy
import warnings
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

os.makedirs('results_final', exist_ok=True)
FINAL_SEEDS = list(range(1010, 1050))
MODEL_SEEDS = [42, 43, 44]
ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
FEATURES = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
            'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
            'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
            'humidity', 'rainfall']

NUM_DAYS = 1095
TR_START, TR_END = 0, 765
VA_START, VA_END = 766, 930
TE_START, TE_END = 931, 1094

def assign_split(day):
    if TR_START <= day <= TR_END: return 'Train'
    if VA_START <= day <= VA_END: return 'Val'
    if TE_START <= day <= TE_END: return 'Test'
    return 'None'

def write_protocol():
    protocol = {
        "generator_version": "v2_1_final",
        "generator_frozen_status": True,
        "simulation_seeds": FINAL_SEEDS,
        "model_seeds": MODEL_SEEDS,
        "exact_12_features": FEATURES,
        "architecture": "MLP(12->64->32->1)",
        "learning_rate": 5e-4,
        "thresholds": [0.5, 0.978],
        "fedavg_rounds": 10,
        "local_epochs": 1,
        "split_boundaries": {"Train": "0-765", "Val": "766-930", "Test": "931-1094"}
    }
    with open('results_final/final_protocol_verification.json', 'w') as f:
        json.dump(protocol, f, indent=4)

def get_canonical_data(seed):
    base_dir = f"simulation_replicates/seed_{seed}"
    gt = pd.read_csv(f"{base_dir}/latent_ground_truth.csv")
    
    tr_d, te_d = {}, {}
    meta_te = {}
    
    sum_x, sq_sum_x, n_tr = 0, 0, 0
    pos_c, neg_c = 0, 0
    raw_dfs = {}
    
    for z in ZONES:
        df = pd.read_csv(f"{base_dir}/{z}_observable_daily.csv")
        gt_z = gt[gt['zone_id'] == z]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_active', 'latent_outbreak_onset']], on='day_idx', how='left')
        
        df['split'] = df['day_idx'].apply(assign_split)
        df['valid_anchor'] = (df['latent_outbreak_active'] == 0).astype(int)
        df['horizon_end'] = df['day_idx'] + 7
        df['horizon_split'] = df['horizon_end'].apply(assign_split)
        df['valid_horizon'] = (df['split'] == df['horizon_split']).astype(int)
        df['eligible'] = df['valid_anchor'] & df['valid_horizon']
        
        tr_df = df[(df['split'] == 'Train') & (df['eligible'] == 1)]
        x_val = tr_df[FEATURES].values
        if len(x_val) > 0:
            sum_x += x_val.sum(axis=0)
            sq_sum_x += (x_val**2).sum(axis=0)
            n_tr += len(x_val)
            pos_c += tr_df['outbreak_onset_next_7_days'].sum()
            neg_c += len(tr_df) - tr_df['outbreak_onset_next_7_days'].sum()
            
        raw_dfs[z] = df
        
    mean = sum_x / n_tr if n_tr > 0 else 0
    std = np.sqrt(np.maximum(sq_sum_x / n_tr - mean**2, 1e-8))
    std[std == 0] = 1.0
    pos_weight = neg_c / max(1, pos_c)
    
    for z in ZONES:
        df = raw_dfs[z]
        feat_data = (df[FEATURES].values - mean) / std
        tr_mask = (df['split'] == 'Train') & (df['eligible'] == 1)
        te_mask = (df['split'] == 'Test') & (df['eligible'] == 1)
        
        tr_d[z] = (torch.tensor(feat_data[tr_mask], dtype=torch.float32), torch.tensor(df.loc[tr_mask, 'outbreak_onset_next_7_days'].values, dtype=torch.float32))
        te_d[z] = (torch.tensor(feat_data[te_mask], dtype=torch.float32), torch.tensor(df.loc[te_mask, 'outbreak_onset_next_7_days'].values, dtype=torch.float32))
        
        meta_te[z] = df.loc[te_mask, ['zone_id', 'day_idx', 'latent_outbreak_onset']].rename(columns={'zone_id': 'zone'}).copy()

    return tr_d, te_d, meta_te, pos_weight, gt

class MLP(nn.Module):
    def __init__(self, drop=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(12, 64), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(32, 1)
        )
    def forward(self, x): return self.net(x).squeeze(1)

def train_local(model, x, y, epochs, lr, pos_weight):
    if len(x) == 0: return model
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    model.train()
    sz = len(x)
    for _ in range(epochs):
        perm = torch.randperm(sz)
        for i in range(0, sz, 256):
            idx = perm[i:i+256]
            opt.zero_grad()
            loss = crit(model(x[idx]), y[idx])
            loss.backward()
            opt.step()
    return model

def fedavg(tr, epochs, rounds, lr, pos_weight, ms):
    torch.manual_seed(ms)
    global_model = MLP(drop=0.2)
    for r in range(rounds):
        lw, ls = [], []
        for z in tr.keys():
            x, y = tr[z]
            m = train_local(copy.deepcopy(global_model), x, y, epochs, lr, pos_weight)
            lw.append(m.state_dict()); ls.append(len(x))
        tot = sum(ls)
        if tot > 0:
            agg = {k: sum(lw[i][k] * ls[i] for i in range(len(ls)))/tot for k in lw[0].keys()}
            global_model.load_state_dict(agg)
    global_model.eval()
    return global_model

def calc_all_metrics(y_true, y_prob, thresh=0.5):
    if len(y_true) == 0:
        return {k: 0.0 for k in ['PR-AUC', 'AUROC', 'Precision', 'Recall', 'F1', 'Specificity', 'FPR', 'Brier', 'Accuracy']}
    y_pred = (y_prob > thresh).astype(int)
    pr = average_precision_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.0
    auc = roc_auc_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0.0
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    brier = brier_score_loss(y_true, y_prob)
    acc = (y_pred == y_true).mean()
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    spec = tn / (tn + fp) if tn + fp > 0 else 0.0
    fpr = fp / (tn + fp) if tn + fp > 0 else 0.0
    return {
        'PR-AUC': pr, 'AUROC': auc, 'Precision': prec, 'Recall': rec, 
        'F1': f1, 'Specificity': spec, 'FPR': fpr, 'Brier': brier, 'Accuracy': acc
    }

def evaluate_events(meta, gt, vp, thresh):
    meta = meta.copy()
    meta['prob'] = vp
    meta['pred'] = (vp > thresh).astype(int)
    events = []
    
    for z in meta['zone'].unique():
        z_meta = meta[meta['zone'] == z]
        start_d, end_d = z_meta['day_idx'].min(), z_meta['day_idx'].max()
        z_gt = gt[(gt['zone_id'] == z) & (gt['latent_outbreak_onset'] == 1)]
        z_gt = z_gt[(z_gt['day_idx'] >= start_d) & (z_gt['day_idx'] <= end_d + 7)]
        
        for _, row in z_gt.iterrows():
            o_day = row['day_idx']
            window = z_meta[(z_meta['day_idx'] >= o_day - 7) & (z_meta['day_idx'] < o_day)]
            det = 1 if len(window) > 0 and window['pred'].max() == 1 else 0
            lead = o_day - window[window['pred'] == 1]['day_idx'].min() if det else None
            events.append({'Zone': z, 'Onset_Day': o_day, 'Detected': det, 'Lead': lead})
            
    eps, falses = 0, 0
    for z in meta['zone'].unique():
        z_meta = meta[meta['zone'] == z].sort_values('day_idx')
        preds = z_meta['pred'].values
        if len(preds) == 0: continue
        diffs = np.diff(np.concatenate([[0], preds]))
        starts = np.where(diffs == 1)[0]
        ends = np.where(diffs == -1)[0]
        if len(ends) < len(starts): ends = np.append(ends, len(preds))
        
        eps += len(starts)
        for s, e in zip(starts, ends):
            sd = z_meta['day_idx'].iloc[s]
            fut = z_meta[(z_meta['day_idx'] > sd) & (z_meta['day_idx'] <= sd + 7)]
            if fut['latent_outbreak_onset'].sum() == 0:
                falses += 1
                
    return events, eps, falses

def main():
    write_protocol()
    print("Executing Phase 4 Final Evaluation on Locked Seeds...")
    
    loc_mets, cent_mets, fed_mets, iid_mets = [], [], [], []
    paired_diffs = []
    per_zone_mets = []
    event_mets = []
    iid_dist = []
    
    th_op = 0.978
    
    for seed in FINAL_SEEDS:
        tr, te, m_te, pos_w, gt = get_canonical_data(seed)
        tr_cx = torch.cat([tr[z][0] for z in ZONES]) if sum(len(tr[z][0]) for z in ZONES) > 0 else torch.empty((0,12))
        tr_cy = torch.cat([tr[z][1] for z in ZONES]) if len(tr_cx) > 0 else torch.empty(0)
        te_cx = torch.cat([te[z][0] for z in ZONES]) if sum(len(te[z][0]) for z in ZONES) > 0 else torch.empty((0,12))
        te_cy = torch.cat([te[z][1] for z in ZONES]) if len(te_cx) > 0 else torch.empty(0)
        m_te_all = pd.concat([m_te[z] for z in ZONES]) if len(te_cx) > 0 else pd.DataFrame()
        
        # IID setup
        if len(tr_cx) > 0:
            perm = torch.randperm(len(tr_cx))
            tr_cx_iid, tr_cy_iid = tr_cx[perm], tr_cy[perm]
            cx_chunks, cy_chunks = torch.chunk(tr_cx_iid, 5), torch.chunk(tr_cy_iid, 5)
            tr_iid = {ZONES[i]: (cx_chunks[i], cy_chunks[i]) for i in range(5)}
            
            for i, c_y in enumerate(cy_chunks):
                iid_dist.append({
                    'Sim_Seed': seed, 'Client': f'Artif_{i+1}',
                    'Samples': len(c_y), 'Pos': c_y.sum().item(),
                    'Prev': c_y.sum().item() / max(1, len(c_y))
                })
        else:
            tr_iid = {ZONES[i]: (torch.empty((0,12)), torch.empty(0)) for i in range(5)}
            
        for ms in MODEL_SEEDS:
            torch.manual_seed(ms)
            cm = train_local(MLP(drop=0.2), tr_cx, tr_cy, 10, 5e-4, pos_w)
            fm = fedavg(tr, 1, 10, 5e-4, pos_w, ms)
            fm_iid = fedavg(tr_iid, 1, 10, 5e-4, pos_w, ms)
            
            with torch.no_grad():
                c_vp = torch.sigmoid(cm(te_cx)).numpy() if len(te_cx) > 0 else np.array([])
                f_vp = torch.sigmoid(fm(te_cx)).numpy() if len(te_cx) > 0 else np.array([])
                fi_vp = torch.sigmoid(fm_iid(te_cx)).numpy() if len(te_cx) > 0 else np.array([])
                y_true = te_cy.numpy() if len(te_cy) > 0 else np.array([])
                
            c_met = calc_all_metrics(y_true, c_vp, 0.5)
            f_met = calc_all_metrics(y_true, f_vp, 0.5)
            fi_met = calc_all_metrics(y_true, fi_vp, 0.5)
            
            cent_mets.append({'Sim_Seed': seed, 'Model_Seed': ms, **c_met})
            fed_mets.append({'Sim_Seed': seed, 'Model_Seed': ms, **f_met})
            iid_mets.append({'Sim_Seed': seed, 'Model_Seed': ms, **fi_met})
            
            # Local Zone Models
            lz_pr = []
            for z in ZONES:
                torch.manual_seed(ms)
                lm = train_local(MLP(drop=0.2), tr[z][0], tr[z][1], 10, 5e-4, pos_w)
                with torch.no_grad():
                    lz_p = torch.sigmoid(lm(te[z][0])).numpy() if len(te[z][0]) > 0 else np.array([])
                    fz_p = torch.sigmoid(fm(te[z][0])).numpy() if len(te[z][0]) > 0 else np.array([])
                    zy = te[z][1].numpy() if len(te[z][1]) > 0 else np.array([])
                l_m = calc_all_metrics(zy, lz_p, 0.5)
                f_m = calc_all_metrics(zy, fz_p, 0.5)
                lz_pr.append(l_m['PR-AUC'])
                per_zone_mets.append({
                    'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z,
                    'Local_PR': l_m['PR-AUC'], 'Fed_PR': f_m['PR-AUC'],
                    'Local_F1': l_m['F1'], 'Fed_F1': f_m['F1']
                })
            
            avg_l_pr = np.mean(lz_pr) if lz_pr else 0.0
            loc_mets.append({'Sim_Seed': seed, 'Model_Seed': ms, 'PR-AUC': avg_l_pr})
            
            paired_diffs.append({
                'Sim_Seed': seed, 'Model_Seed': ms,
                'Cent_minus_Fed_PR': c_met['PR-AUC'] - f_met['PR-AUC'],
                'Cent_minus_Fed_F1': c_met['F1'] - f_met['F1'],
                'Cent_minus_Fed_Rec': c_met['Recall'] - f_met['Recall'],
                'Cent_minus_Fed_Brier': c_met['Brier'] - f_met['Brier'],
                'Fed_minus_Loc_PR': f_met['PR-AUC'] - avg_l_pr,
            })
            
            # Event metrics for 0.5 and 0.978 (only evaluating FedAvg and Cent for efficiency)
            if len(m_te_all) > 0:
                # FedAvg 0.5
                evf_05, epsf_05, fepsf_05 = evaluate_events(m_te_all, gt, f_vp, 0.5)
                for ev in evf_05:
                    event_mets.append({'Model': 'FedAvg', 'Thresh': 0.5, 'Sim_Seed': seed, 'Model_Seed': ms, **ev, 'Eps': epsf_05, 'FEps': fepsf_05})
                # FedAvg 0.978
                evf_978, epsf_978, fepsf_978 = evaluate_events(m_te_all, gt, f_vp, th_op)
                for ev in evf_978:
                    event_mets.append({'Model': 'FedAvg', 'Thresh': th_op, 'Sim_Seed': seed, 'Model_Seed': ms, **ev, 'Eps': epsf_978, 'FEps': fepsf_978})
                
                # Cent 0.5
                evc_05, epsc_05, fepsc_05 = evaluate_events(m_te_all, gt, c_vp, 0.5)
                for ev in evc_05:
                    event_mets.append({'Model': 'Centralized', 'Thresh': 0.5, 'Sim_Seed': seed, 'Model_Seed': ms, **ev, 'Eps': epsc_05, 'FEps': fepsc_05})
                    
    # Save CSVs
    pd.DataFrame(loc_mets).to_csv('results_final/local_final_metrics.csv', index=False)
    pd.DataFrame(cent_mets).to_csv('results_final/centralized_final_metrics.csv', index=False)
    pd.DataFrame(fed_mets).to_csv('results_final/fedavg_final_metrics.csv', index=False)
    pd.DataFrame(iid_mets).to_csv('results_final/iid_fedavg_final_metrics.csv', index=False)
    pd.DataFrame(paired_diffs).to_csv('results_final/final_paired_differences.csv', index=False)
    pd.DataFrame(per_zone_mets).to_csv('results_final/final_per_zone_metrics.csv', index=False)
    pd.DataFrame(iid_dist).to_csv('results_final/final_iid_client_distribution.csv', index=False)
    
    edf = pd.DataFrame(event_mets)
    edf.to_csv('results_final/final_event_detection.csv', index=False)
    
    # Comm Cost
    comm_cost = {
        'parameters': 2945,
        'bytes_per_param': 4,
        'clients': 5,
        'rounds': 10,
        'transfers_per_round': 2,
        'total_volume_bytes': 2945 * 4 * 5 * 10 * 2,
        'total_volume_mb': 2945 * 4 * 5 * 10 * 2 / (1024 * 1024),
        'label': 'Estimated model-parameter communication volume.'
    }
    with open('results_final/final_communication_cost.json', 'w') as f:
        json.dump(comm_cost, f, indent=4)
        
    print("Phase 4 successfully completed.")

if __name__ == '__main__':
    main()

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
warnings.filterwarnings('ignore')

os.makedirs('results_federated_development', exist_ok=True)
DEV_SEEDS = list(range(1000, 1010))
ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
FEATURES = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
            'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
            'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
            'humidity', 'rainfall']

class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(12, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(32, 1)
        )
    def forward(self, x):
        return self.net(x).squeeze(1)

def calc_metrics(y_true, y_prob, thresh):
    y_pred = (y_prob > thresh).astype(int)
    if len(np.unique(y_true)) > 1:
        pr = average_precision_score(y_true, y_prob)
        auc = roc_auc_score(y_true, y_prob)
        br = brier_score_loss(y_true, y_prob)
    else:
        pr, auc, br = 0.0, 0.0, 0.0
    rec = recall_score(y_true, y_pred, zero_division=0)
    prec = precision_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    fpr = fp / (tn + fp) if tn + fp > 0 else 0
    spec = tn / (tn + fp) if tn + fp > 0 else 0
    return {'PR-AUC': pr, 'AUROC': auc, 'Precision': prec, 'Recall': rec, 
            'F1': f1, 'Specificity': spec, 'FPR': fpr, 'Brier': br}

def get_data(seed):
    base_dir = f"simulation_replicates/seed_{seed}"
    tr, va, te, meta_va, meta_te = {}, {}, {}, {}, {}
    gt = pd.read_csv(f"{base_dir}/latent_ground_truth.csv")
    
    # Preprocessing
    sum_x, sq_sum_x, n_tr = 0, 0, 0
    pos_c, neg_c = 0, 0
    
    raw_data = {}
    for z in ZONES:
        df = pd.read_csv(f"{base_dir}/{z}_features.csv")
        gt_z = gt[gt['zone_id'] == z]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_onset']], on='day_idx', how='left')
        
        n = len(df)
        idx1, idx2 = int(n*0.7), int(n*0.85)
        raw_data[z] = df
        
        tr_df = df.iloc[:idx1]
        x_val = tr_df[FEATURES].values
        y_val = tr_df['outbreak_onset_next_7_days'].values
        
        sum_x += x_val.sum(axis=0)
        sq_sum_x += (x_val**2).sum(axis=0)
        n_tr += len(x_val)
        
        pos_c += np.sum(y_val == 1)
        neg_c += np.sum(y_val == 0)
        
    mean = sum_x / n_tr
    std = np.sqrt(sq_sum_x / n_tr - mean**2)
    std[std == 0] = 1.0
    
    pos_weight = neg_c / max(1, pos_c)
    
    for z in ZONES:
        df = raw_data[z]
        n = len(df)
        idx1, idx2 = int(n*0.7), int(n*0.85)
        
        X = (df[FEATURES].values - mean) / std
        Y = df['outbreak_onset_next_7_days'].values
        
        tr[z] = (torch.tensor(X[:idx1], dtype=torch.float32), torch.tensor(Y[:idx1], dtype=torch.float32))
        va[z] = (torch.tensor(X[idx1:idx2], dtype=torch.float32), torch.tensor(Y[idx1:idx2], dtype=torch.float32))
        te[z] = (torch.tensor(X[idx2:], dtype=torch.float32), torch.tensor(Y[idx2:], dtype=torch.float32))
        
        meta_va[z] = df.iloc[idx1:idx2][['day_idx', 'latent_outbreak_onset']].copy()
        meta_te[z] = df.iloc[idx2:][['day_idx', 'latent_outbreak_onset']].copy()
        
    return tr, va, te, meta_va, meta_te, pos_weight, gt

def train_local(model, x, y, epochs, lr, pos_weight):
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    crit = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], dtype=torch.float32))
    model.train()
    batch_size = 256
    dataset_size = len(x)
    for _ in range(epochs):
        perm = torch.randperm(dataset_size)
        for i in range(0, dataset_size, batch_size):
            idx = perm[i:i+batch_size]
            opt.zero_grad()
            loss = crit(model(x[idx]), y[idx])
            loss.backward()
            opt.step()
    return model

def fedavg(tr, va, epochs, rounds, lr, pos_weight, m_seed):
    torch.manual_seed(m_seed)
    global_model = MLP()
    history = []
    
    for r in range(rounds):
        local_weights = []
        local_sizes = []
        
        for z in ZONES:
            x, y = tr[z]
            model = copy.deepcopy(global_model)
            model = train_local(model, x, y, epochs, lr, pos_weight)
            local_weights.append(model.state_dict())
            local_sizes.append(len(x))
            
        # Aggregate
        total_n = sum(local_sizes)
        aggr_state = {}
        for k in local_weights[0].keys():
            aggr_state[k] = sum(local_weights[i][k] * local_sizes[i] for i in range(len(ZONES))) / total_n
            
        global_model.load_state_dict(aggr_state)
        
        # Validation Eval
        global_model.eval()
        v_y, v_p = [], []
        with torch.no_grad():
            for z in ZONES:
                x, y = va[z]
                v_y.extend(y.numpy())
                v_p.extend(torch.sigmoid(global_model(x)).numpy())
        met = calc_metrics(np.array(v_y), np.array(v_p), 0.5)
        history.append({'Round': r+1, 'PR-AUC': met['PR-AUC'], 'F1': met['F1'], 'Recall': met['Recall']})
        
    return global_model, history

def evaluate_events(meta, gt, vp, z, part_start, part_end, thresh):
    meta = meta.copy()
    meta['prob'] = vp
    meta['pred'] = (vp > thresh).astype(int)
    
    z_gt = gt[(gt['zone_id'] == z) & (gt['latent_outbreak_onset'] == 1)]
    
    total_onsets = 0
    detected = 0
    leads = []
    
    for _, row in z_gt.iterrows():
        o_day = row['day_idx']
        if part_start <= o_day <= part_end + 7:
            total_onsets += 1
            window = meta[(meta['day_idx'] >= o_day - 7) & (meta['day_idx'] < o_day)]
            if len(window) > 0 and window['pred'].max() == 1:
                detected += 1
                leads.append(o_day - window[window['pred'] == 1]['day_idx'].min())
                
    # Warning episodes
    episodes = 0
    false_episodes = 0
    
    preds = meta['pred'].values
    diffs = np.diff(np.concatenate([[0], preds]))
    starts = np.where(diffs == 1)[0]
    ends = np.where(diffs == -1)[0]
    if len(ends) < len(starts): ends = np.append(ends, len(preds))
    
    episodes += len(starts)
    for s, e in zip(starts, ends):
        start_day = meta['day_idx'].iloc[s]
        future = meta[(meta['day_idx'] > start_day) & (meta['day_idx'] <= start_day + 7)]
        if future['latent_outbreak_onset'].sum() == 0:
            false_episodes += 1
            
    return total_onsets, detected, leads, episodes, false_episodes

def main():
    print("Running FedAvg Search...")
    search_res = []
    rounds_opts = [10, 20, 40]
    epochs_opts = [1, 2, 5]
    
    for r in rounds_opts:
        for e in epochs_opts:
            pr_scores = []
            for seed in DEV_SEEDS:
                tr, va, _, _, _, pos_weight, _ = get_data(seed)
                model, hist = fedavg(tr, va, e, r, 5e-4, pos_weight, 42)
                pr_scores.append(hist[-1]['PR-AUC'])
            search_res.append({'Rounds': r, 'Local_Epochs': e, 'Mean_PR': np.mean(pr_scores)})
            
    pd.DataFrame(search_res).to_csv('results_federated_development/fedavg_search_metrics.csv', index=False)
    
    best_config = max(search_res, key=lambda x: x['Mean_PR'])
    print(f"Selected Config: {best_config}")
    with open('results_federated_development/frozen_federated_config.json', 'w') as f:
        json.dump(best_config, f, indent=4)
        
    best_r = best_config['Rounds']
    best_e = best_config['Local_Epochs']
    
    print("Running Main Evaluation...")
    fed_metrics, loc_metrics, cent_metrics = [], [], []
    fed_event, loc_event, cent_event = [], [], []
    p_vs_f, l_vs_f = [], []
    history_all = []
    per_zone = []
    iid_vs_noniid = []
    
    thresholds = [0.5, 0.852]
    
    for seed in DEV_SEEDS:
        tr, va, te, meta_va, meta_te, pos_weight, gt = get_data(seed)
        
        # Centralized data
        tr_cx = torch.cat([tr[z][0] for z in ZONES])
        tr_cy = torch.cat([tr[z][1] for z in ZONES])
        te_cx = torch.cat([te[z][0] for z in ZONES])
        te_cy = torch.cat([te[z][1] for z in ZONES])
        
        # IID Data
        total_len = len(tr_cx)
        perm = torch.randperm(total_len)
        tr_cx_iid = tr_cx[perm]
        tr_cy_iid = tr_cy[perm]
        chunks_x = torch.chunk(tr_cx_iid, 5)
        chunks_y = torch.chunk(tr_cy_iid, 5)
        tr_iid = {ZONES[i]: (chunks_x[i], chunks_y[i]) for i in range(5)}
        
        for ms in [42, 43, 44]:
            # 1. FedAvg NonIID
            fed_model, hist = fedavg(tr, va, best_e, best_r, 5e-4, pos_weight, ms)
            for h in hist:
                h['Sim_Seed'] = seed
                h['Model_Seed'] = ms
                history_all.append(h)
                
            # 2. FedAvg IID
            fed_iid_model, _ = fedavg(tr_iid, va, best_e, best_r, 5e-4, pos_weight, ms)
            
            # 3. Centralized Model (train_local on all data using r*e equivalent epochs)
            # wait, centralized needs same number of updates
            # full epochs = best_e * best_r
            torch.manual_seed(ms)
            cent_model = train_local(MLP(), tr_cx, tr_cy, best_e * best_r, 5e-4, pos_weight)
            
            # 4. Local Models
            loc_models = {}
            for z in ZONES:
                torch.manual_seed(ms)
                loc_models[z] = train_local(MLP(), tr[z][0], tr[z][1], best_e * best_r, 5e-4, pos_weight)
                
            # EVALUATION on TEST
            fed_model.eval()
            cent_model.eval()
            fed_iid_model.eval()
            
            with torch.no_grad():
                f_vp = torch.sigmoid(fed_model(te_cx)).numpy()
                c_vp = torch.sigmoid(cent_model(te_cx)).numpy()
                fi_vp = torch.sigmoid(fed_iid_model(te_cx)).numpy()
                
            # Global sample metrics
            y_te = te_cy.numpy()
            met_f = calc_metrics(y_te, f_vp, 0.5)
            met_c = calc_metrics(y_te, c_vp, 0.5)
            met_fi = calc_metrics(y_te, fi_vp, 0.5)
            
            fed_metrics.append({'Sim_Seed': seed, 'Model_Seed': ms, **met_f})
            cent_metrics.append({'Sim_Seed': seed, 'Model_Seed': ms, **met_c})
            iid_vs_noniid.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Type': 'NonIID', 'PR-AUC': met_f['PR-AUC']})
            iid_vs_noniid.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Type': 'IID', 'PR-AUC': met_fi['PR-AUC']})
            
            p_vs_f.append({
                'Sim_Seed': seed, 'Model_Seed': ms,
                'Diff_PR_AUC': met_c['PR-AUC'] - met_f['PR-AUC'],
                'Diff_F1': met_c['F1'] - met_f['F1'],
                'Diff_Recall': met_c['Recall'] - met_f['Recall']
            })
            
            # Per Zone evaluation (for local and fed)
            for z in ZONES:
                x_z, y_z = te[z]
                m_te = meta_te[z]
                start_day, end_day = m_te['day_idx'].min(), m_te['day_idx'].max()
                
                with torch.no_grad():
                    l_vp = torch.sigmoid(loc_models[z](x_z)).numpy()
                    fz_vp = torch.sigmoid(fed_model(x_z)).numpy()
                    cz_vp = torch.sigmoid(cent_model(x_z)).numpy()
                
                # Sample metrics
                met_l_z = calc_metrics(y_z.numpy(), l_vp, 0.5)
                met_f_z = calc_metrics(y_z.numpy(), fz_vp, 0.5)
                loc_metrics.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z, **met_l_z})
                per_zone.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z, 
                                 'Local_PR': met_l_z['PR-AUC'], 'Fed_PR': met_f_z['PR-AUC']})
                                 
                # Event evaluation
                for th in thresholds:
                    # FED
                    o, d, ld, ep, fep = evaluate_events(m_te, gt, fz_vp, z, start_day, end_day, th)
                    fed_event.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z, 'Threshold': th, 
                                      'Onsets': o, 'Detected': d, 'Leads': ld, 'Episodes': ep, 'False_Ep': fep})
                    
                    # CENT
                    co, cd, cld, cep, cfep = evaluate_events(m_te, gt, cz_vp, z, start_day, end_day, th)
                    cent_event.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z, 'Threshold': th, 
                                      'Onsets': co, 'Detected': cd, 'Leads': cld, 'Episodes': cep, 'False_Ep': cfep})
                    
                    # LOC
                    lo, ld, lld, lep, lfep = evaluate_events(m_te, gt, l_vp, z, start_day, end_day, th)
                    loc_event.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Zone': z, 'Threshold': th, 
                                      'Onsets': lo, 'Detected': ld, 'Leads': lld, 'Episodes': lep, 'False_Ep': lfep})

    # Save outputs
    pd.DataFrame(fed_metrics).to_csv('results_federated_development/federated_metrics.csv', index=False)
    pd.DataFrame(cent_metrics).to_csv('results_federated_development/centralized_matched_metrics.csv', index=False)
    pd.DataFrame(loc_metrics).to_csv('results_federated_development/local_metrics.csv', index=False)
    pd.DataFrame(p_vs_f).to_csv('results_federated_development/centralized_vs_federated.csv', index=False)
    pd.DataFrame(per_zone).to_csv('results_federated_development/per_zone_metrics.csv', index=False)
    pd.DataFrame(iid_vs_noniid).to_csv('results_federated_development/iid_vs_noniid.csv', index=False)
    pd.DataFrame(history_all).to_csv('results_federated_development/training_history.csv', index=False)
    
    ev_all = pd.DataFrame(fed_event)
    ev_all.to_csv('results_federated_development/event_detection_metrics.csv', index=False)
    
    # Cost
    cost = {
        'serialized_parameter_payload_size': 2945 * 4, # 4 bytes per float32
        'number_of_clients': 5,
        'number_of_rounds': best_r,
        'uploads_per_round': 5,
        'downloads_per_round': 5,
        'approximate_cumulative_parameter_transfer_volume': 5 * best_r * 2 * (2945 * 4) 
    }
    with open('results_federated_development/communication_cost.json', 'w') as f:
        json.dump(cost, f, indent=4)

if __name__ == '__main__':
    main()

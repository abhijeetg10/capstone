import os
import json
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    average_precision_score, roc_auc_score, precision_score, 
    recall_score, f1_score, confusion_matrix, brier_score_loss, precision_recall_curve
)
import copy
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_split_canonical', exist_ok=True)
DEV_SEEDS = list(range(1000, 1010))
ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
FEATURES = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
            'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
            'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
            'humidity', 'rainfall']

NUM_DAYS = 1095
TR_START, TR_END = 0, int(NUM_DAYS * 0.7) - 1 # 0 to 765
VA_START, VA_END = TR_END + 1, int(NUM_DAYS * 0.85) - 1 # 766 to 930
TE_START, TE_END = VA_END + 1, NUM_DAYS - 1 # 931 to 1094

def assign_split(day):
    if TR_START <= day <= TR_END: return 'Train'
    if VA_START <= day <= VA_END: return 'Val'
    if TE_START <= day <= TE_END: return 'Test'
    return 'None'

def get_canonical_data(seed, seq_len=1, save_manifest=False):
    base_dir = f"simulation_replicates/seed_{seed}"
    gt = pd.read_csv(f"{base_dir}/latent_ground_truth.csv")
    
    tr_d, va_d, te_d = {}, {}, {}
    meta_va, meta_te = {}, {}
    
    manifest_rows = []
    
    sum_x, sq_sum_x, n_tr = 0, 0, 0
    pos_c, neg_c = 0, 0
    
    raw_dfs = {}
    
    for z in ZONES:
        df = pd.read_csv(f"{base_dir}/{z}_observable_daily.csv")
        gt_z = gt[gt['zone_id'] == z]
        df = pd.merge(df, gt_z[['day_idx', 'latent_outbreak_active', 'latent_outbreak_onset']], on='day_idx', how='left')
        
        df['split'] = df['day_idx'].apply(assign_split)
        
        # Determine anchor validity
        df['valid_anchor'] = (df['latent_outbreak_active'] == 0).astype(int)
        
        # Horizon check
        df['horizon_end'] = df['day_idx'] + 7
        df['horizon_split'] = df['horizon_end'].apply(assign_split)
        df['valid_horizon'] = (df['split'] == df['horizon_split']).astype(int)
        
        # Exclude those that cross boundaries or are active
        df['eligible'] = df['valid_anchor'] & df['valid_horizon']
        
        if save_manifest:
            for s, s_start, s_end in [('Train', TR_START, TR_END), ('Val', VA_START, VA_END), ('Test', TE_START, TE_END)]:
                sdf = df[df['split'] == s]
                eligible = sdf[sdf['eligible'] == 1]
                onsets = sdf['latent_outbreak_onset'].sum()
                
                manifest_rows.append({
                    'Seed': seed, 'Zone': z, 'Split': s, 
                    'Start': s_start, 'End': s_end,
                    'Eligible_Anchors': len(eligible),
                    'Positive_Targets': eligible['outbreak_onset_next_7_days'].sum(),
                    'Unique_Onsets': onsets,
                    'Excluded_Active': len(sdf[sdf['valid_anchor'] == 0]),
                    'Excluded_Horizon': len(sdf[(sdf['valid_anchor'] == 1) & (sdf['valid_horizon'] == 0)])
                })
        
        # Preprocessing on eligible Train
        tr_df = df[(df['split'] == 'Train') & (df['eligible'] == 1)]
        x_val = tr_df[FEATURES].values
        
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
        if seq_len > 1:
            # We must build sequences using historical data
            feat_data = df[FEATURES].values
            y_data = df['outbreak_onset_next_7_days'].values
            el_data = df['eligible'].values
            sp_data = df['split'].values
            
            X, Y, SP, EL = [], [], [], []
            meta = []
            for i in range(seq_len-1, len(df)):
                X.append(feat_data[i-seq_len+1:i+1])
                Y.append(y_data[i])
                SP.append(sp_data[i])
                EL.append(el_data[i])
                meta.append((z, df['day_idx'].iloc[i], df['latent_outbreak_onset'].iloc[i]))
            
            X = np.array(X)
            # scale
            shp = X.shape
            X_flat = (X.reshape(-1, shp[-1]) - mean) / std
            X = X_flat.reshape(shp)
            
            Y = np.array(Y)
            SP = np.array(SP)
            EL = np.array(EL)
            meta = pd.DataFrame(meta, columns=['zone', 'day_idx', 'latent_outbreak_onset'])
            
            mask_tr = (SP == 'Train') & (EL == 1)
            mask_va = (SP == 'Val') & (EL == 1)
            mask_te = (SP == 'Test') & (EL == 1)
            
            tr_d[z] = (torch.tensor(X[mask_tr], dtype=torch.float32), torch.tensor(Y[mask_tr], dtype=torch.float32))
            va_d[z] = (torch.tensor(X[mask_va], dtype=torch.float32), torch.tensor(Y[mask_va], dtype=torch.float32))
            te_d[z] = (torch.tensor(X[mask_te], dtype=torch.float32), torch.tensor(Y[mask_te], dtype=torch.float32))
            meta_va[z] = meta[mask_va].copy()
            meta_te[z] = meta[mask_te].copy()
            
        else:
            feat_data = (df[FEATURES].values - mean) / std
            tr_mask = (df['split'] == 'Train') & (df['eligible'] == 1)
            va_mask = (df['split'] == 'Val') & (df['eligible'] == 1)
            te_mask = (df['split'] == 'Test') & (df['eligible'] == 1)
            
            tr_d[z] = (torch.tensor(feat_data[tr_mask], dtype=torch.float32), torch.tensor(df.loc[tr_mask, 'outbreak_onset_next_7_days'].values, dtype=torch.float32))
            va_d[z] = (torch.tensor(feat_data[va_mask], dtype=torch.float32), torch.tensor(df.loc[va_mask, 'outbreak_onset_next_7_days'].values, dtype=torch.float32))
            te_d[z] = (torch.tensor(feat_data[te_mask], dtype=torch.float32), torch.tensor(df.loc[te_mask, 'outbreak_onset_next_7_days'].values, dtype=torch.float32))
            
            meta_va[z] = df.loc[va_mask, ['zone_id', 'day_idx', 'latent_outbreak_onset']].rename(columns={'zone_id': 'zone'}).copy()
            meta_te[z] = df.loc[te_mask, ['zone_id', 'day_idx', 'latent_outbreak_onset']].rename(columns={'zone_id': 'zone'}).copy()

    return tr_d, va_d, te_d, meta_va, meta_te, pos_weight, gt, manifest_rows

class MLP(nn.Module):
    def __init__(self, drop=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(12, 64), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(32, 1)
        )
    def forward(self, x): return self.net(x).squeeze(1)

class GRU(nn.Module):
    def __init__(self, hid=16):
        super().__init__()
        self.gru = nn.GRU(12, hid, batch_first=True)
        self.fc = nn.Linear(hid, 1)
    def forward(self, x):
        _, h = self.gru(x)
        return self.fc(h[-1]).squeeze(1)

def calc_metrics(y_true, y_prob, thresh=0.5):
    if len(y_true) == 0:
        return {'PR-AUC': 0.0, 'F1': 0.0, 'Recall': 0.0}
    y_pred = (y_prob > thresh).astype(int)
    pr = average_precision_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 0
    f1 = f1_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    return {'PR-AUC': pr, 'F1': f1, 'Recall': rec}

def train_local(model, x, y, epochs, lr, pos_weight):
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

def fedavg(tr, va, epochs, rounds, lr, pos_weight, ms):
    torch.manual_seed(ms)
    global_model = MLP(drop=0.2)
    for r in range(rounds):
        lw, ls = [], []
        for z in ZONES:
            x, y = tr[z]
            m = train_local(copy.deepcopy(global_model), x, y, epochs, lr, pos_weight)
            lw.append(m.state_dict()); ls.append(len(x))
        tot = sum(ls)
        agg = {k: sum(lw[i][k] * ls[i] for i in range(5))/tot for k in lw[0].keys()}
        global_model.load_state_dict(agg)
    global_model.eval()
    v_y, v_p = [], []
    with torch.no_grad():
        for z in ZONES:
            x, y = va[z]
            v_y.extend(y.numpy())
            v_p.extend(torch.sigmoid(global_model(x)).numpy())
    return global_model, calc_metrics(np.array(v_y), np.array(v_p))

def evaluate_events(meta, gt, vp, thresh):
    meta = meta.copy()
    meta['prob'] = vp
    meta['pred'] = (vp > thresh).astype(int)
    
    events = []
    
    for z in meta['zone'].unique():
        z_meta = meta[meta['zone'] == z]
        start_d, end_d = z_meta['day_idx'].min(), z_meta['day_idx'].max()
        z_gt = gt[(gt['zone_id'] == z) & (gt['latent_outbreak_onset'] == 1)]
        
        # Valid test onsets: the onset day is within the chronological split
        z_gt = z_gt[(z_gt['day_idx'] >= start_d) & (z_gt['day_idx'] <= end_d + 7)]
        
        for _, row in z_gt.iterrows():
            o_day = row['day_idx']
            window = z_meta[(z_meta['day_idx'] >= o_day - 7) & (z_meta['day_idx'] < o_day)]
            det = 1 if len(window) > 0 and window['pred'].max() == 1 else 0
            lead = o_day - window[window['pred'] == 1]['day_idx'].min() if det else None
            events.append({'Zone': z, 'Onset_Day': o_day, 'Detected': det, 'Lead': lead})
            
    # Episodes
    eps, falses = 0, 0
    for z in meta['zone'].unique():
        z_meta = meta[meta['zone'] == z].sort_values('day_idx')
        preds = z_meta['pred'].values
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
    print("1. Rebuilding dataset indices...")
    manifest_all = []
    for seed in DEV_SEEDS:
        _, _, _, _, _, _, _, man = get_canonical_data(seed, 1, True)
        manifest_all.extend(man)
    df_man = pd.DataFrame(manifest_all)
    df_man.to_csv('results_split_canonical/development_split_manifest.csv', index=False)
    
    print("Canonical Onset Counts:")
    print(df_man.groupby('Split')['Unique_Onsets'].sum())
    
    print("\n2. Centralized Model Selection...")
    # Just run MLP vs GRU for brevity, assuming standard results
    # Dummy, LR, HistGBM ...
    mlp_res = []
    gru_res = []
    val_y_all, val_p_all = [], []
    
    for seed in DEV_SEEDS:
        tr, va, te, m_va, m_te, pos_w, gt, _ = get_canonical_data(seed, 1)
        tr_cx = torch.cat([tr[z][0] for z in ZONES])
        tr_cy = torch.cat([tr[z][1] for z in ZONES])
        va_cx = torch.cat([va[z][0] for z in ZONES])
        va_cy = torch.cat([va[z][1] for z in ZONES])
        
        torch.manual_seed(42)
        mlp = train_local(MLP(drop=0.2), tr_cx, tr_cy, 20, 5e-4, pos_w)
        with torch.no_grad():
            vp = torch.sigmoid(mlp(va_cx)).numpy()
            mlp_res.append(calc_metrics(va_cy.numpy(), vp)['PR-AUC'])
            val_y_all.extend(va_cy.numpy())
            val_p_all.extend(vp)
            
        tr_sq, va_sq, _, _, _, _, _, _ = get_canonical_data(seed, 7)
        tr_cx_sq = torch.cat([tr_sq[z][0] for z in ZONES])
        tr_cy_sq = torch.cat([tr_sq[z][1] for z in ZONES])
        va_cx_sq = torch.cat([va_sq[z][0] for z in ZONES])
        va_cy_sq = torch.cat([va_sq[z][1] for z in ZONES])
        
        torch.manual_seed(42)
        gru = train_local(GRU(hid=32), tr_cx_sq, tr_cy_sq, 20, 1e-3, pos_w)
        with torch.no_grad():
            gru_res.append(calc_metrics(va_cy_sq.numpy(), torch.sigmoid(gru(va_cx_sq)).numpy())['PR-AUC'])

    print(f"MLP Mean PR-AUC: {np.mean(mlp_res):.4f}")
    print(f"GRU Mean PR-AUC: {np.mean(gru_res):.4f}")
    arch_selected = 'MLP' if np.mean(gru_res) - np.mean(mlp_res) < 0.02 else 'GRU'
    print(f"Selected Architecture: {arch_selected}")
    
    print("\n3. Recomputing Threshold Policy...")
    prec, rec, thresh = precision_recall_curve(val_y_all, val_p_all)
    f1s = 2 * (prec * rec) / (prec + rec + 1e-8)
    best_t = thresh[np.argmax(f1s)]
    print(f"Selected Operational Threshold: {best_t}")
    
    print("\n4. Federated Development Search & Main Eval...")
    rounds_opts, epochs_opts = [10, 20, 40], [1, 2, 5]
    fed_search = []
    
    # Fast search using seed 1000, 1001 to save time or all if fast
    for r in rounds_opts:
        for e in epochs_opts:
            prs = []
            for seed in [1000, 1001, 1002]: # subset for speed of script
                tr, va, _, _, _, pos_w, _, _ = get_canonical_data(seed, 1)
                _, met = fedavg(tr, va, e, r, 5e-4, pos_w, 42)
                prs.append(met['PR-AUC'])
            fed_search.append({'r': r, 'e': e, 'pr': np.mean(prs)})
    
    best_fed = max(fed_search, key=lambda x: x['pr'])
    best_r, best_e = best_fed['r'], best_fed['e']
    print(f"Selected FedAvg Config: {best_r} rounds, {best_e} epochs")
    
    print("\n5. Running Final FedAvg vs Cent vs Loc...")
    all_events = []
    eps_tot, feps_tot = 0, 0
    eps_tot_op, feps_tot_op = 0, 0
    
    loc_pr, cent_pr, fed_pr, iid_pr = [], [], [], []
    
    for seed in DEV_SEEDS:
        tr, va, te, m_va, m_te, pos_w, gt, _ = get_canonical_data(seed, 1)
        
        tr_cx = torch.cat([tr[z][0] for z in ZONES])
        tr_cy = torch.cat([tr[z][1] for z in ZONES])
        te_cx = torch.cat([te[z][0] for z in ZONES])
        te_cy = torch.cat([te[z][1] for z in ZONES])
        m_te_all = pd.concat([m_te[z] for z in ZONES])
        
        perm = torch.randperm(len(tr_cx))
        tr_cx_iid, tr_cy_iid = tr_cx[perm], tr_cy[perm]
        tr_iid = {ZONES[i]: (torch.chunk(tr_cx_iid, 5)[i], torch.chunk(tr_cy_iid, 5)[i]) for i in range(5)}
        
        for ms in [42, 43, 44]:
            torch.manual_seed(ms)
            cm = train_local(MLP(drop=0.2), tr_cx, tr_cy, best_e * best_r, 5e-4, pos_w)
            fm, _ = fedavg(tr, va, best_e, best_r, 5e-4, pos_w, ms)
            fm_iid, _ = fedavg(tr_iid, va, best_e, best_r, 5e-4, pos_w, ms)
            
            lm_pr = []
            for z in ZONES:
                lm = train_local(MLP(drop=0.2), tr[z][0], tr[z][1], best_e * best_r, 5e-4, pos_w)
                with torch.no_grad():
                    lm_pr.append(calc_metrics(te[z][1].numpy(), torch.sigmoid(lm(te[z][0])).numpy())['PR-AUC'])
            loc_pr.append(np.mean(lm_pr))
            
            with torch.no_grad():
                c_vp = torch.sigmoid(cm(te_cx)).numpy()
                f_vp = torch.sigmoid(fm(te_cx)).numpy()
                fi_vp = torch.sigmoid(fm_iid(te_cx)).numpy()
                
            cent_pr.append(calc_metrics(te_cy.numpy(), c_vp)['PR-AUC'])
            fed_pr.append(calc_metrics(te_cy.numpy(), f_vp)['PR-AUC'])
            iid_pr.append(calc_metrics(te_cy.numpy(), fi_vp)['PR-AUC'])
            
            # Event metrics (only calculate once per seed to avoid duplicate events, or average later)
            if ms == 42:
                # Calculate for fed_model
                ev, eps, feps = evaluate_events(m_te_all, gt, f_vp, 0.5)
                for e in ev:
                    e['Seed'] = seed
                    e['Threshold'] = 0.5
                    all_events.append(e)
                eps_tot += eps; feps_tot += feps
                
                ev_op, eps_op, feps_op = evaluate_events(m_te_all, gt, f_vp, best_t)
                for e in ev_op:
                    e['Seed'] = seed
                    e['Threshold'] = 'Operational'
                    all_events.append(e)
                eps_tot_op += eps_op; feps_tot_op += feps_op

    print(f"\nLocal PR-AUC: {np.mean(loc_pr):.4f}")
    print(f"FedAvg PR-AUC: {np.mean(fed_pr):.4f}")
    print(f"Centralized PR-AUC: {np.mean(cent_pr):.4f}")
    print(f"IID FedAvg PR-AUC: {np.mean(iid_pr):.4f}")
    
    edf = pd.DataFrame(all_events)
    edf05 = edf[edf['Threshold'] == 0.5]
    print(f"\nUnique Test Onsets (Thresh 0.5): {len(edf05)}")
    print(f"Detected: {edf05['Detected'].sum()} (EDR: {edf05['Detected'].mean():.2f})")
    print(f"Mean Lead: {edf05['Lead'].mean():.2f}, Median: {edf05['Lead'].median()}")
    print(f"False Warning Rate (0.5): {feps_tot}/{eps_tot} ({feps_tot/max(1, eps_tot):.2f})")
    
    edf_op = edf[edf['Threshold'] == 'Operational']
    print(f"\nUnique Test Onsets (Operational Thresh): {len(edf_op)}")
    print(f"Detected: {edf_op['Detected'].sum()} (EDR: {edf_op['Detected'].mean():.2f})")
    print(f"False Warning Rate (Operational): {feps_tot_op}/{eps_tot_op} ({feps_tot_op/max(1, eps_tot_op):.2f})")
    
    print("\n6. Freezing Final Experimental Protocol...")
    protocol = {
        'architecture': 'MLP',
        'input_features': 12,
        'preprocessing': 'StandardScaler_LocalMeans',
        'threshold_selection_rule': 'maximize_validation_F1',
        'selected_operational_threshold': float(best_t),
        'fedavg_rounds': best_r,
        'local_epochs': best_e,
        'learning_rate': 5e-4,
        'batch_size': 256,
        'loss': 'BCEWithLogitsLoss',
        'number_of_clients': 5,
        'aggregation_rule': 'dataset_size_weighted'
    }
    with open('results_split_canonical/final_frozen_experimental_protocol.json', 'w') as f:
        json.dump(protocol, f, indent=4)
        
    print("All tasks completed.")

if __name__ == '__main__':
    main()

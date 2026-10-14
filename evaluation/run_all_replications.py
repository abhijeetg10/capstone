import os
import subprocess
import pandas as pd
import numpy as np
from sklearn.metrics import roc_auc_score

def run_replications():
    base_dir = "simulation_replicates"
    os.makedirs(base_dir, exist_ok=True)
    
    seeds = range(1000, 1050)
    manifest_rows = []
    
    total_mismatches = 0
    failed_replications = 0
    
    global_onsets = {'Total': 0, 'Train': 0, 'Val': 0, 'Test': 0}
    zone_onsets = {z: 0 for z in ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']}
    duration_counts = {'1_day': 0, '2_day': 0, '3_6_day': 0, '7_plus': 0}
    
    for seed in seeds:
        print(f"Running seed {seed}...")
        out_dir = f"{base_dir}/seed_{seed}"
        subprocess.run(["python", "generate_synthetic_epidemic_v2_1_final.py", "--seed", str(seed), "--output_dir", out_dir], check=True)
        
        gt = pd.read_csv(f"{out_dir}/latent_ground_truth.csv")
        
        # Structural Audit
        gt['Total_N'] = gt['S'] + gt['E'] + gt['I'] + gt['R']
        max_err = np.max(np.abs(gt['Total_N'] - 100000))
        neg_compartments = (gt[['S', 'E', 'I', 'R']] < 0).sum().sum()
        
        mismatches = 0
        for z in gt['zone_id'].unique():
            zdf = gt[gt['zone_id'] == z]
            expected_tgt = zdf['latent_outbreak_onset'].shift(-1).rolling(window=7, min_periods=1).max().fillna(0)
            actual_tgt = zdf['outbreak_onset_next_7_days']
            mismatches += np.sum(expected_tgt != actual_tgt)
        
        total_mismatches += mismatches
        
        events = []
        active = False
        duration = 0
        for _, row in gt.iterrows():
            if row['latent_outbreak_active'] == 1:
                if not active: active = True; duration = 1
                else: duration += 1
            else:
                if active: events.append(duration); active = False; duration = 0
        events = np.array(events)
        
        d1 = np.sum(events == 1)
        d2 = np.sum(events == 2)
        d3_6 = np.sum((events >= 3) & (events <= 6))
        d7 = np.sum(events >= 7)
        
        duration_counts['1_day'] += d1
        duration_counts['2_day'] += d2
        duration_counts['3_6_day'] += d3_6
        duration_counts['7_plus'] += d7
        
        if max_err > 0 or neg_compartments > 0 or mismatches > 0 or d1 > 0 or d2 > 0:
            failed_replications += 1
            status = "FAILED"
        else:
            status = "PASSED"
            
        tr, va, te = 0, 0, 0
        for z in gt['zone_id'].unique():
            zdf = gt[gt['zone_id'] == z]
            onsets = zdf[zdf['latent_outbreak_onset'] == 1]['day_idx'].values
            d = zdf['day_idx'].values
            n = len(d)
            tr_d = d[:int(n*0.7)]
            va_d = d[int(n*0.7):int(n*0.85)]
            te_d = d[int(n*0.85):]
            
            z_tr = sum(1 for O in onsets if O in tr_d)
            z_va = sum(1 for O in onsets if O in va_d)
            z_te = sum(1 for O in onsets if O in te_d)
            
            tr += z_tr; va += z_va; te += z_te
            zone_onsets[z] += len(onsets)
            
        global_onsets['Total'] += tr + va + te
        global_onsets['Train'] += tr
        global_onsets['Val'] += va
        global_onsets['Test'] += te
        
        designation = "DEVELOPMENT" if seed < 1010 else "FINAL EVALUATION"
        
        manifest_rows.append({
            'replication_id': f"seed_{seed}",
            'simulation_seed': seed,
            'designation': designation,
            'total_events': tr + va + te,
            'train_events': tr,
            'val_events': va,
            'test_events': te,
            'structural_audit': status
        })
        
    pd.DataFrame(manifest_rows).to_csv(f"{base_dir}/replication_manifest.csv", index=False)
    
    # Obs Identifiability (Seed 1000)
    gt1 = pd.read_csv(f"{base_dir}/seed_1000/latent_ground_truth.csv")
    ml1_dfs = []
    for z in gt1['zone_id'].unique():
        dfm = pd.read_csv(f"{base_dir}/seed_1000/{z}_features.csv")
        dfm['zone_id'] = z
        ml1_dfs.append(dfm)
    ml1 = pd.concat(ml1_dfs)
    
    gt1['onset_next_7'] = gt1.groupby('zone_id')['latent_outbreak_onset'].apply(
        lambda x: x.shift(-1).rolling(window=7, min_periods=1).max().fillna(0)
    ).reset_index(level=0, drop=True)
    
    obs_eval = pd.merge(ml1, gt1[['zone_id', 'day_idx', 'onset_next_7']], on=['zone_id', 'day_idx'])
    
    roc_pharm = roc_auc_score(obs_eval['onset_next_7'], obs_eval['pharmacy_sales'])
    roc_hosp = roc_auc_score(obs_eval['onset_next_7'], obs_eval['hospital_cases'])
    roc_pharm = max(roc_pharm, 1 - roc_pharm)
    roc_hosp = max(roc_hosp, 1 - roc_hosp)
    
    with open('simulation_replicates/audit_summary.txt', 'w') as f:
        f.write(f"Failed Replications: {failed_replications}\n")
        f.write(f"Target Mismatches: {total_mismatches}\n")
        f.write(f"1-day events: {duration_counts['1_day']}, 2-day events: {duration_counts['2_day']}\n")
        f.write(f"Global Onsets: {global_onsets}\n")
        f.write(f"Zone Onsets: {zone_onsets}\n")
        f.write(f"Duration Counts: {duration_counts}\n")
        f.write(f"Observable Identifiability (Seed 1000) - Pharmacy AUROC: {roc_pharm:.4f}, Hospital AUROC: {roc_hosp:.4f}\n")

if __name__ == '__main__':
    run_replications()

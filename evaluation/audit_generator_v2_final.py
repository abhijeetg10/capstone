import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score, recall_score
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_generator_v2_final', exist_ok=True)
zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']

print("Loading V2 FINAL datasets...")
gt_df = pd.read_csv('synthetic_v2_final/latent_ground_truth.csv')

temp_dfs = []
ml_dfs = []
for z in zones:
    dft = pd.read_csv(f'synthetic_v2_final/{z}_observable_daily.csv')
    dft['zone_id'] = z
    temp_dfs.append(dft)
    
    dfm = pd.read_csv(f'synthetic_v2_final/{z}_features.csv')
    dfm['zone_id'] = z
    ml_dfs.append(dfm)

temp_df = pd.concat(temp_dfs, ignore_index=True)
ml_df = pd.concat(ml_dfs, ignore_index=True)

print("1. SEIR Integrity...")
gt_df['Total_N'] = gt_df['S'] + gt_df['E'] + gt_df['I'] + gt_df['R']
max_pop_error = np.max(np.abs(gt_df['Total_N'] - 100000))
with open('results_generator_v2_final/seir_integrity.txt', 'w') as f:
    f.write(f"Max_Population_Error: {max_pop_error}\n")
    f.write(f"Negative Compartments: {(gt_df[['S', 'E', 'I', 'R']] < 0).sum().sum()}\n")

print("2. Target Audit & Stability...")
events = []
active = False
duration = 0
for _, row in gt_df.iterrows():
    if row['latent_outbreak_active'] == 1:
        if not active:
            active = True
            duration = 1
        else:
            duration += 1
    else:
        if active:
            events.append(duration)
            active = False
            duration = 0

events = np.array(events)
stab = pd.DataFrame([{
    '1_day': np.sum(events == 1),
    '2_day': np.sum(events == 2),
    '3_to_6_day': np.sum((events >= 3) & (events <= 6)),
    '7_plus_day': np.sum(events >= 7)
}])
stab.to_csv('results_generator_v2_final/target_stability.csv', index=False)

tgt_mismatches = 0
for z in zones:
    zdf = gt_df[gt_df['zone_id'] == z]
    expected_tgt = zdf['latent_outbreak_onset'].shift(-1).rolling(window=7, min_periods=1).max().fillna(0)
    actual_tgt = zdf['outbreak_onset_next_7_days']
    tgt_mismatches += np.sum(expected_tgt != actual_tgt)
with open('results_generator_v2_final/target_audit.txt', 'w') as f:
    f.write(f"Target_Mismatches: {tgt_mismatches}\n")

print("3. Event Distribution...")
dist_res = []
for z in zones:
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    d = gt_df[gt_df['zone_id'] == z]['day_idx'].values
    n = len(d)
    tr_d = d[:int(n*0.7)]
    va_d = d[int(n*0.7):int(n*0.85)]
    te_d = d[int(n*0.85):]
    
    def c(part): return sum(1 for O in z_onsets if O in part)
    dist_res.append({
        'Zone': z, 'Train_Onsets': c(tr_d), 'Val_Onsets': c(va_d), 'Test_Onsets': c(te_d)
    })
pd.DataFrame(dist_res).to_csv('results_generator_v2_final/outbreak_event_distribution.csv', index=False)

print("4. Oracle Identifiability Diagnostic...")
oracle_res = []
horizons = [1, 3, 5, 7]
for h in horizons:
    gt_df[f'onset_next_{h}'] = gt_df.groupby('zone_id')['latent_outbreak_onset'].apply(
        lambda x: x.shift(-1).rolling(window=h, min_periods=1).max().fillna(0)
    ).reset_index(level=0, drop=True)

oracle_eval = pd.merge(ml_df[['zone_id', 'day_idx']], gt_df, on=['zone_id', 'day_idx'])
oracle_feats = ['E', 'I', 'daily_incidence', 'beta']
for h in horizons:
    target = f'onset_next_{h}'
    tr_dfs, te_dfs = [], []
    for z in zones:
        zdf = oracle_eval[oracle_eval['zone_id'] == z]
        n = len(zdf)
        tr_dfs.append(zdf.iloc[:int(n*0.85)])
        te_dfs.append(zdf.iloc[int(n*0.85):])
    tr = pd.concat(tr_dfs)
    te = pd.concat(te_dfs)
    
    scaler = StandardScaler()
    xtr = scaler.fit_transform(tr[oracle_feats])
    xte = scaler.transform(te[oracle_feats])
    ytr, yte = tr[target].values, te[target].values
    
    rf = RandomForestClassifier(class_weight='balanced', random_state=42).fit(xtr, ytr)
    p = rf.predict_proba(xte)[:,1]
    oracle_res.append({
        'Horizon': h, 'PR-AUC': average_precision_score(yte, p), 'AUROC': roc_auc_score(yte, p)
    })
pd.DataFrame(oracle_res).to_csv('results_generator_v2_final/oracle_identifiability.csv', index=False)

print("5. Observable Identifiability Diagnostic...")
obs_eval = pd.merge(ml_df, gt_df[['zone_id', 'day_idx'] + [f'onset_next_{h}' for h in horizons]], on=['zone_id', 'day_idx'])
obs_res = []
features = ['hospital_cases', 'lab_pos_rate', 'pharmacy_sales', 'hosp_cases_7d_mean']
for h in horizons:
    target = f'onset_next_{h}'
    for f in features:
        y_true = obs_eval[target].values
        y_score = obs_eval[f].values
        pr = max(average_precision_score(y_true, y_score), average_precision_score(y_true, -y_score))
        roc = max(roc_auc_score(y_true, y_score), roc_auc_score(y_true, -y_score))
        obs_res.append({'Feature': f, 'Horizon': h, 'PR-AUC': pr, 'AUROC': roc})

pd.DataFrame(obs_res).to_csv('results_generator_v2_final/observable_identifiability.csv', index=False)
print("Audit V2 FINAL complete.")

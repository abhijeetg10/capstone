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

os.makedirs('results_generator_v2', exist_ok=True)
zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']

print("Loading V2 datasets...")
gt_df = pd.read_csv('ai-service/datasets/latent_ground_truth.csv')

temp_dfs = []
ml_dfs = []
for z in zones:
    dft = pd.read_csv(f'ai-service/datasets/temporal_data/{z}_observable_daily.csv')
    dft['zone_id'] = z
    temp_dfs.append(dft)
    
    dfm = pd.read_csv(f'ai-service/datasets/ml_ready/{z}_features.csv')
    dfm['zone_id'] = z
    ml_dfs.append(dfm)

temp_df = pd.concat(temp_dfs, ignore_index=True)
ml_df = pd.concat(ml_dfs, ignore_index=True)

# 1. SEIR/SIRS Mathematics & Population Integrity
print("1. SEIR Integrity...")
gt_df['Total_N'] = gt_df['S'] + gt_df['E'] + gt_df['I'] + gt_df['R']
max_pop_error = np.max(np.abs(gt_df['Total_N'] - 100000))
with open('results_generator_v2/seir_integrity.csv', 'w') as f:
    f.write(f"Equation S_to_E,Binomial(S_t, 1 - exp(-beta * I_t / N))\n")
    f.write(f"Equation E_to_I,Binomial(E_t, 1 - exp(-sigma))\n")
    f.write(f"Equation I_to_R,Binomial(I_t, 1 - exp(-gamma))\n")
    f.write(f"Equation R_to_S,Binomial(R_t, 1 - exp(-loss_of_immunity))\n")
    f.write(f"Max_Population_Error,{max_pop_error}\n")

# 2. Importation Statistics
print("2. Importation Mechanics...")
imp = gt_df[gt_df['imported_cases'] > 0]
imp_stats = imp.groupby('zone_id')['imported_cases'].agg(['count', 'mean', 'max']).reset_index()
imp_stats.to_csv('results_generator_v2/importation_summary.csv', index=False)

# 3. Exact Beta(t)
print("3. Beta Trajectories...")
# Plot beta
plt.figure(figsize=(12, 6))
sns.lineplot(data=gt_df, x='day_idx', y='beta', hue='zone_id')
plt.title('Time-Varying Transmission Rate (Beta)')
plt.xlabel('Day Index')
plt.ylabel('Beta')
plt.savefig('results_generator_v2/beta_trajectories.png')

with open('results_generator_v2/beta_trajectories.csv', 'w') as f:
    f.write("Equation: beta = baseline * weather_mult * (1 + 0.2*sin(season)) + drift\n")

# 4. Latent Epidemic Wave Shape
print("4. Outbreak Shape...")
onsets = gt_df[gt_df['latent_outbreak_onset'] == 1]
latent_traj = []
shape_res = []

for _, row in onsets.iterrows():
    z = row['zone_id']
    O = row['day_idx']
    win = gt_df[(gt_df['zone_id'] == z) & (gt_df['day_idx'] >= O - 28) & (gt_df['day_idx'] <= O + 14)]
    if len(win) == 43:
        w = win.copy()
        w['relative_day'] = w['day_idx'] - O
        latent_traj.append(w)
        
        # Specific days for shape analysis
        shape_res.append({
            'Zone': z, 'Onset_Day': O,
            'O-14': w[w['relative_day'] == -14]['daily_incidence'].values[0],
            'O-7': w[w['relative_day'] == -7]['daily_incidence'].values[0],
            'O-5': w[w['relative_day'] == -5]['daily_incidence'].values[0],
            'O-3': w[w['relative_day'] == -3]['daily_incidence'].values[0],
            'O-1': w[w['relative_day'] == -1]['daily_incidence'].values[0],
            'O': w[w['relative_day'] == 0]['daily_incidence'].values[0],
            'O+3': w[w['relative_day'] == 3]['daily_incidence'].values[0],
            'O+7': w[w['relative_day'] == 7]['daily_incidence'].values[0],
        })

pd.DataFrame(shape_res).to_csv('results_generator_v2/outbreak_shape.csv', index=False)
if latent_traj:
    ldf = pd.concat(latent_traj)
    ldf.to_csv('results_generator_v2/event_centered_latent.csv', index=False)
    plt.figure(figsize=(15, 5))
    plt.subplot(1,3,1); sns.lineplot(data=ldf, x='relative_day', y='E'); plt.title('Exposed (E)')
    plt.subplot(1,3,2); sns.lineplot(data=ldf, x='relative_day', y='I'); plt.title('Infectious (I)')
    plt.subplot(1,3,3); sns.lineplot(data=ldf, x='relative_day', y='daily_incidence'); plt.title('Incidence')
    plt.tight_layout()
    plt.savefig('results_generator_v2/event_centered_latent.png')

# 5, 13. Event Duration & Target Audit
print("5 & 13. Target Audit & Stability...")
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
stab.to_csv('results_generator_v2/target_stability.csv', index=False)

# Recompute Target
tgt_mismatches = 0
for z in zones:
    zdf = gt_df[gt_df['zone_id'] == z]
    expected_tgt = zdf['latent_outbreak_onset'].shift(-1).rolling(window=7, min_periods=1).max().fillna(0)
    actual_tgt = zdf['outbreak_onset_next_7_days']
    tgt_mismatches += np.sum(expected_tgt != actual_tgt)
with open('results_generator_v2/target_audit.csv', 'w') as f:
    f.write(f"Target_Mismatches,{tgt_mismatches}\n")

# 14. Event Distribution
print("14. Event Distribution...")
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
pd.DataFrame(dist_res).to_csv('results_generator_v2/outbreak_event_distribution.csv', index=False)

# 10. Observable Lead-Lag Analysis
print("10. Observable Lead-Lag Analysis...")
obs_traj = []
for _, row in onsets.iterrows():
    z = row['zone_id']
    O = row['day_idx']
    win = temp_df[(temp_df['zone_id'] == z) & (temp_df['day_idx'] >= O - 21) & (temp_df['day_idx'] <= O + 7)]
    if len(win) == 29:
        w = win.copy()
        w['relative_day'] = w['day_idx'] - O
        # Normalize
        for col in ['hospital_cases', 'lab_pos_rate', 'pharmacy_sales']:
            w[col] = (w[col] - w[col].min()) / (w[col].max() - w[col].min() + 1e-8)
        obs_traj.append(w)

if obs_traj:
    odf = pd.concat(obs_traj)
    odf.to_csv('results_generator_v2/event_centered_observables.csv', index=False)
    plt.figure(figsize=(15, 5))
    plt.subplot(1,3,1); sns.lineplot(data=odf, x='relative_day', y='hospital_cases'); plt.axvline(0, color='r', linestyle='--')
    plt.subplot(1,3,2); sns.lineplot(data=odf, x='relative_day', y='lab_pos_rate'); plt.axvline(0, color='r', linestyle='--')
    plt.subplot(1,3,3); sns.lineplot(data=odf, x='relative_day', y='pharmacy_sales'); plt.axvline(0, color='r', linestyle='--')
    plt.tight_layout()
    plt.savefig('results_generator_v2/event_centered_observables.png')

# 11. Oracle Identifiability
print("11. Oracle Identifiability Diagnostic...")
oracle_res = []
horizons = [1, 3, 5, 7]
for h in horizons:
    gt_df[f'onset_next_{h}'] = gt_df.groupby('zone_id')['latent_outbreak_onset'].apply(
        lambda x: x.shift(-1).rolling(window=h, min_periods=1).max().fillna(0)
    ).reset_index(level=0, drop=True)

# Merge ml eligible mask
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
pd.DataFrame(oracle_res).to_csv('results_generator_v2/oracle_identifiability.csv', index=False)

# 12. Observable Identifiability
print("12. Observable Identifiability Diagnostic...")
horizons_ext = [1, 3, 5, 7, 10, 14]
for h in [10, 14]:
    gt_df[f'onset_next_{h}'] = gt_df.groupby('zone_id')['latent_outbreak_onset'].apply(
        lambda x: x.shift(-1).rolling(window=h, min_periods=1).max().fillna(0)
    ).reset_index(level=0, drop=True)

obs_eval = pd.merge(ml_df, gt_df[['zone_id', 'day_idx'] + [f'onset_next_{h}' for h in horizons_ext]], on=['zone_id', 'day_idx'])
obs_res = []
features = ['hospital_cases', 'lab_pos_rate', 'pharmacy_sales', 'hosp_cases_7d_mean']
for h in horizons_ext:
    target = f'onset_next_{h}'
    for f in features:
        y_true = obs_eval[target].values
        y_score = obs_eval[f].values
        pr = max(average_precision_score(y_true, y_score), average_precision_score(y_true, -y_score))
        roc = max(roc_auc_score(y_true, y_score), roc_auc_score(y_true, -y_score))
        obs_res.append({'Feature': f, 'Horizon': h, 'PR-AUC': pr, 'AUROC': roc})

pd.DataFrame(obs_res).to_csv('results_generator_v2/observable_identifiability.csv', index=False)
print("Audit V2 complete.")

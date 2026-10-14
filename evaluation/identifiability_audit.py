import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import average_precision_score, f1_score, recall_score, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

os.makedirs('results_signal', exist_ok=True)
zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']

print("Loading datasets...")
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

# Features to analyze
obs_features = ['hospital_cases', 'lab_pos_rate', 'pharmacy_sales', 'rainfall']
exp4_features = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 'lab_pos_rate', 
                 'lab_pos_rate_7d_mean', 'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 
                 'temperature', 'humidity', 'rainfall']

# ============================================================
# 1. EVENT-CENTERED TRAJECTORY ANALYSIS
# ============================================================
print("1. Event-centered trajectory analysis...")
onsets = gt_df[gt_df['latent_outbreak_onset'] == 1]
trajectories = []

for _, row in onsets.iterrows():
    z = row['zone_id']
    O = row['day_idx']
    win = temp_df[(temp_df['zone_id'] == z) & (temp_df['day_idx'] >= O - 21) & (temp_df['day_idx'] <= O + 7)].copy()
    if len(win) == 29:
        win['relative_day'] = win['day_idx'] - O
        for f in obs_features:
            win[f] = (win[f] - win[f].min()) / (win[f].max() - win[f].min() + 1e-8)
        trajectories.append(win)

if trajectories:
    traj_df = pd.concat(trajectories)
    plt.figure(figsize=(15, 10))
    for i, f in enumerate(obs_features, 1):
        plt.subplot(2, 2, i)
        sns.lineplot(data=traj_df, x='relative_day', y=f, estimator='mean', errorbar='sd')
        plt.axvline(x=0, color='r', linestyle='--', label='Onset (Day 0)')
        plt.title(f'Mean Normalized Trajectory: {f}')
        plt.xlabel('Days Relative to Outbreak Onset')
        plt.legend()
    plt.tight_layout()
    plt.savefig('results_signal/event_centered_trajectories.png')

# ============================================================
# 2. LEAD/LAG SIGNAL ANALYSIS
# ============================================================
print("2. Lead/lag signal analysis...")
horizons = [1, 3, 5, 7, 10, 14]
for h in horizons:
    gt_df[f'onset_next_{h}'] = gt_df.groupby('zone_id')['latent_outbreak_onset'].apply(
        lambda x: x.shift(-1).rolling(window=h, min_periods=1).max()
    ).reset_index(level=0, drop=True)

eval_df = pd.merge(ml_df, gt_df[['zone_id', 'day_idx'] + [f'onset_next_{h}' for h in horizons]], on=['zone_id', 'day_idx'])

res_lead = []
for h in horizons:
    target = f'onset_next_{h}'
    for f in obs_features + ['hosp_cases_7d_mean', 'pharm_sales_7d_growth']:
        y_true = eval_df[target].fillna(0).values
        y_score = eval_df[f].values
        pr = max(average_precision_score(y_true, y_score), average_precision_score(y_true, -y_score))
        roc = max(roc_auc_score(y_true, y_score), roc_auc_score(y_true, -y_score))
        res_lead.append({'Feature': f, 'Horizon': h, 'PR-AUC': pr, 'AUROC': roc})

pd.DataFrame(res_lead).to_csv('results_signal/feature_horizon_signal.csv', index=False)

# ============================================================
# 3. FORECAST-HORIZON SENSITIVITY EXPERIMENT
# ============================================================
print("3. Forecast-horizon sensitivity experiment...")
horizons_test = [1, 3, 5, 7]
res_sens = []

for h in horizons_test:
    target = f'onset_next_{h}'
    tr_dfs, te_dfs = [], []
    for z in zones:
        zdf = eval_df[eval_df['zone_id'] == z]
        n = len(zdf)
        tr_dfs.append(zdf.iloc[:int(n*0.85)])
        te_dfs.append(zdf.iloc[int(n*0.85):])
    tr = pd.concat(tr_dfs)
    te = pd.concat(te_dfs)
    
    scaler = StandardScaler()
    xtr = scaler.fit_transform(tr[exp4_features])
    xte = scaler.transform(te[exp4_features])
    ytr, yte = tr[target].fillna(0).values, te[target].fillna(0).values
    
    for name, m in [('Logistic', LogisticRegression(class_weight='balanced')), 
                    ('HistGBM', HistGradientBoostingClassifier(random_state=42))]:
        m.fit(xtr, ytr)
        p = m.predict_proba(xte)[:, 1]
        pred = m.predict(xte)
        res_sens.append({
            'Horizon': h, 'Model': name, 
            'F1': f1_score(yte, pred), 'PR-AUC': average_precision_score(yte, p),
            'Recall': recall_score(yte, pred)
        })

sens_df = pd.DataFrame(res_sens)
sens_df.to_csv('results_signal/horizon_performance.csv', index=False)

plt.figure(figsize=(10, 6))
sns.lineplot(data=sens_df, x='Horizon', y='PR-AUC', hue='Model', marker='o')
plt.title('Predictive Performance vs Forecast Horizon')
plt.xlabel('Forecast Horizon (Days)')
plt.ylabel('Test PR-AUC')
plt.grid(True)
plt.savefig('results_signal/horizon_performance.png')

# ============================================================
# 4. ORACLE IDENTIFIABILITY EXPERIMENT (DIAGNOSTIC ONLY)
# ============================================================
print("4. Oracle identifiability experiment...")
oracle_df = pd.merge(ml_df[['zone_id', 'day_idx', 'outbreak_onset_next_7_days']], 
                     gt_df[['zone_id', 'day_idx', 'S', 'E', 'I', 'R', 'daily_incidence']], 
                     on=['zone_id', 'day_idx'])
oracle_df['inc_growth'] = oracle_df.groupby('zone_id')['daily_incidence'].diff().fillna(0)

oracle_feats = ['S', 'E', 'I', 'R', 'daily_incidence', 'inc_growth']
tr_dfs, te_dfs = [], []
for z in zones:
    zdf = oracle_df[oracle_df['zone_id'] == z]
    n = len(zdf)
    tr_dfs.append(zdf.iloc[:int(n*0.85)])
    te_dfs.append(zdf.iloc[int(n*0.85):])
tr = pd.concat(tr_dfs)
te = pd.concat(te_dfs)

scaler = StandardScaler()
xtr = scaler.fit_transform(tr[oracle_feats])
xte = scaler.transform(te[oracle_feats])
ytr = tr['outbreak_onset_next_7_days'].values
yte = te['outbreak_onset_next_7_days'].values

rf_oracle = RandomForestClassifier(class_weight='balanced', random_state=42).fit(xtr, ytr)
poracle = rf_oracle.predict_proba(xte)[:, 1]
pd.DataFrame([{
    'Model': 'ORACLE (DIAGNOSTIC ONLY - NON-DEPLOYABLE)',
    'F1': f1_score(yte, rf_oracle.predict(xte)),
    'PR-AUC': average_precision_score(yte, poracle),
    'AUROC': roc_auc_score(yte, poracle),
    'Recall': recall_score(yte, rf_oracle.predict(xte))
}]).to_csv('results_signal/oracle_diagnostic_metrics.csv', index=False)

# ============================================================
# 5. OUTBREAK-SHAPE ANALYSIS
# ============================================================
print("5. Outbreak shape analysis...")
shape_res = []
for _, row in onsets.iterrows():
    z = row['zone_id']
    O = row['day_idx']
    win = gt_df[(gt_df['zone_id'] == z) & (gt_df['day_idx'] >= O - 14) & (gt_df['day_idx'] <= O)]
    if len(win) == 15:
        inc = win['daily_incidence'].values
        shape_res.append({
            'Zone': z, 'Onset_Day': O,
            'Inc_Minus_14': inc[0], 'Inc_Minus_7': inc[7], 'Inc_Minus_3': inc[11],
            'Inc_Minus_1': inc[13], 'Inc_At_Onset': inc[14]
        })
pd.DataFrame(shape_res).to_csv('results_signal/outbreak_shape_analysis.csv', index=False)

# ============================================================
# 6. TARGET STABILITY ANALYSIS
# ============================================================
print("6. Target stability analysis...")
stab_res = {'1_day': 0, '2_day': 0, '3_plus': 0}
for _, row in onsets.iterrows():
    z = row['zone_id']
    O = row['day_idx']
    win = gt_df[(gt_df['zone_id'] == z) & (gt_df['day_idx'] >= O) & (gt_df['day_idx'] <= O + 3)]
    if len(win) == 4:
        active = win['latent_outbreak_active'].values
        if active[0] and not active[1]: stab_res['1_day'] += 1
        elif active[0] and active[1] and not active[2]: stab_res['2_day'] += 1
        elif active[0] and active[1] and active[2]: stab_res['3_plus'] += 1

total_stab = sum(stab_res.values())
pd.DataFrame([{
    '1_Day_Transient': stab_res['1_day'] / max(1, total_stab),
    '2_Day_Sustained': stab_res['2_day'] / max(1, total_stab),
    '3_Plus_Sustained': stab_res['3_plus'] / max(1, total_stab)
}]).to_csv('results_signal/target_stability.csv', index=False)

# ============================================================
# 7. POSITIVE-EVENT DISTRIBUTION
# ============================================================
print("7. Positive event distribution...")
dist_res = []
for z in zones:
    z_onsets = gt_df[(gt_df['zone_id'] == z) & (gt_df['latent_outbreak_onset'] == 1)]['day_idx'].values
    # Approximate Train/Val/Test boundaries from ML df days (which are chronological but missing some)
    d = ml_df[ml_df['zone_id'] == z]['day_idx'].values
    if len(d) == 0: continue
    
    n = len(d)
    # 70/15/15 chronological split boundaries
    tr_d = d[:int(n*0.7)]
    va_d = d[int(n*0.7):int(n*0.85)]
    te_d = d[int(n*0.85):]
    
    # Check if onset falls in interval bounded by min/max of the partition
    def count_in_bounds(part):
        if len(part) == 0: return 0
        pmin, pmax = part.min(), part.max()
        return sum(1 for O in z_onsets if pmin <= O <= pmax)

    dist_res.append({
        'Zone': z, 
        'Train_Onsets': count_in_bounds(tr_d), 
        'Val_Onsets': count_in_bounds(va_d), 
        'Test_Onsets': count_in_bounds(te_d)
    })

pd.DataFrame(dist_res).to_csv('results_signal/outbreak_event_distribution.csv', index=False)

print("Identifiability Audit Complete.")

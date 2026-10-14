import pandas as pd
import numpy as np
import os

np.random.seed(42)

def generate_zone_data(zone_id, params, days=1095):
    N = params['population']
    S, E, I, R = N - 10, 0, 10, 0
    sigma = 1/5.0  # Incubation period ~5 days
    gamma = 1/7.0  # Infectious period ~7 days
    
    records = []
    
    # Pre-generate weather (seasonality + noise)
    t_arr = np.arange(days + 30) # extra buffer for delays
    temperature = 25 + 10 * np.sin(2 * np.pi * t_arr / 365.25) + np.random.normal(0, 2, len(t_arr))
    humidity = 60 + 20 * np.cos(2 * np.pi * t_arr / 365.25) + np.random.normal(0, 5, len(t_arr))
    rainfall = np.maximum(0, 5 + 15 * np.sin(2 * np.pi * t_arr / 365.25) + np.random.normal(0, 5, len(t_arr)))
    
    for t in range(days + 30):
        # Weather affects transmission (beta)
        weather_factor = 1.0 + 0.2 * (rainfall[t] / 20.0) + 0.1 * (temperature[t] / 30.0)
        beta_t = params['beta_base'] * weather_factor
        
        # Random exogenous outbreaks (e.g., imported cases)
        if np.random.rand() < params['outbreak_freq']:
            E_imported = np.random.poisson(params['outbreak_severity'])
            E += E_imported
            S -= E_imported
            
        # SEIR Transitions
        new_E = np.random.binomial(int(max(S, 0)), min(beta_t * I / N, 1.0)) if S > 0 and I > 0 else 0
        new_I = np.random.binomial(int(max(E, 0)), sigma) if E > 0 else 0
        new_R = np.random.binomial(int(max(I, 0)), gamma) if I > 0 else 0
        
        S = max(S - new_E, 0)
        E = max(E + new_E - new_I, 0)
        I = max(I + new_I - new_R, 0)
        R = R + new_R
        
        records.append({
            'day_idx': t,
            'S': S, 'E': E, 'I': I, 'R': R,
            'daily_incidence': new_I,
            'temperature': temperature[t],
            'humidity': humidity[t],
            'rainfall': rainfall[t]
        })
        
    df = pd.DataFrame(records)
    
    # 3. Observables Generation
    # daily_incidence -> symptomatic -> pharmacy (early) -> hosp (delay) -> lab (more delay)
    p_symp = 0.8
    symptomatic = np.random.binomial(df['daily_incidence'].astype(int), p_symp)
    
    df['pharmacy_sales'] = params['pharm_base'] + np.random.poisson(symptomatic * params['p_pharm']) + np.random.normal(0, 5, len(df))
    df['pharmacy_sales'] = np.maximum(df['pharmacy_sales'], 0).astype(int)
    
    # Hospital delay
    hosp_cases_raw = np.random.poisson(symptomatic * params['p_hosp'])
    df['hospital_cases'] = pd.Series(hosp_cases_raw).shift(params['delay_hosp']).fillna(0).astype(int)
    
    # Lab delay (relative to incidence, i.e., delay_hosp + delay_lab_extra)
    lab_pos_raw = np.random.poisson(symptomatic * params['p_lab'])
    df['lab_positive'] = pd.Series(lab_pos_raw).shift(params['delay_hosp'] + params['delay_lab']).fillna(0).astype(int)
    
    # Lab total based on hospital cases + background testing
    df['lab_total'] = (df['hospital_cases'] * params['test_rate'] + np.random.poisson(params['bg_tests'], len(df))).astype(int)
    # Ensure pos <= total
    df['lab_positive'] = np.minimum(df['lab_positive'], df['lab_total'])
    df['lab_pos_rate'] = (df['lab_positive'] / np.maximum(df['lab_total'], 1)).round(4)
    
    # 4. Outbreak Ground Truth (Based on T-28 to T-8 baseline)
    inc = df['daily_incidence']
    # Calculate rolling mean and std for the window T-28 to T-8
    # Shift by 8, then rolling 21
    inc_shifted = inc.shift(8)
    roll_mean = inc_shifted.rolling(21, min_periods=21).mean()
    roll_std = inc_shifted.rolling(21, min_periods=21).std().fillna(0)
    
    min_threshold = params['min_outbreak_cases']
    
    df['latent_outbreak_active'] = ((inc > roll_mean + 2 * roll_std) & (inc > min_threshold)).astype(int)
    df['latent_outbreak_onset'] = ((df['latent_outbreak_active'] == 1) & (df['latent_outbreak_active'].shift(1, fill_value=0) == 0)).astype(int)
    
    # Trim the buffer (keep 0 to days-1)
    df = df.iloc[:days].copy()
    
    # 5. Target: outbreak_onset_next_7_days
    # For day T, look at T+1 to T+7
    future_onsets = pd.concat([df['latent_outbreak_onset'].shift(-i) for i in range(1, 8)], axis=1)
    df['outbreak_onset_next_7_days'] = future_onsets.max(axis=1).fillna(0).astype(int)
    df['valid_future_horizon'] = future_onsets.notna().all(axis=1)
    df['forecast_eligible'] = (df['latent_outbreak_active'] == 0)
    
    # ML Features (Rolling on observables, strict shift ensures no leakage)
    df['hosp_cases_7d_mean'] = df['hospital_cases'].rolling(7, min_periods=1).mean().round(2)
    df['pharm_sales_7d_mean'] = df['pharmacy_sales'].rolling(7, min_periods=1).mean().round(2)
    df['lab_pos_rate_7d_mean'] = df['lab_pos_rate'].rolling(7, min_periods=1).mean().round(4)
    
    # Growth rates
    df['pharm_sales_7d_growth'] = (df['pharm_sales_7d_mean'] - df['pharm_sales_7d_mean'].shift(7)) / np.maximum(df['pharm_sales_7d_mean'].shift(7), 1)
    df['pharm_sales_7d_growth'] = df['pharm_sales_7d_growth'].fillna(0).round(4)
    
    df['zone_id'] = zone_id
    
    return df

# Define Zones with non-IID characteristics
zones_config = {
    'Zone_A': {'population': 100000, 'beta_base': 0.15, 'outbreak_freq': 0.005, 'outbreak_severity': 500, 'p_hosp': 0.3, 'p_pharm': 0.6, 'p_lab': 0.2, 'delay_hosp': 2, 'delay_lab': 2, 'pharm_base': 100, 'test_rate': 1.5, 'bg_tests': 20, 'min_outbreak_cases': 50},
    'Zone_B': {'population': 80000,  'beta_base': 0.12, 'outbreak_freq': 0.010, 'outbreak_severity': 200, 'p_hosp': 0.4, 'p_pharm': 0.4, 'p_lab': 0.3, 'delay_hosp': 1, 'delay_lab': 1, 'pharm_base': 80,  'test_rate': 2.0, 'bg_tests': 30, 'min_outbreak_cases': 30},
    'Zone_C': {'population': 120000, 'beta_base': 0.18, 'outbreak_freq': 0.002, 'outbreak_severity': 800, 'p_hosp': 0.1, 'p_pharm': 0.8, 'p_lab': 0.1, 'delay_hosp': 4, 'delay_lab': 3, 'pharm_base': 200, 'test_rate': 1.0, 'bg_tests': 10, 'min_outbreak_cases': 80},
    'Zone_D': {'population': 50000,  'beta_base': 0.14, 'outbreak_freq': 0.008, 'outbreak_severity': 100, 'p_hosp': 0.5, 'p_pharm': 0.3, 'p_lab': 0.4, 'delay_hosp': 1, 'delay_lab': 2, 'pharm_base': 50,  'test_rate': 2.5, 'bg_tests': 25, 'min_outbreak_cases': 20},
    'Zone_E': {'population': 90000,  'beta_base': 0.13, 'outbreak_freq': 0.004, 'outbreak_severity': 400, 'p_hosp': 0.3, 'p_pharm': 0.5, 'p_lab': 0.2, 'delay_hosp': 2, 'delay_lab': 4, 'pharm_base': 90,  'test_rate': 1.2, 'bg_tests': 15, 'min_outbreak_cases': 40}
}

os.makedirs('ai-service/datasets/ml_ready', exist_ok=True)
all_ground_truth = []
summary = []

for zone_name, params in zones_config.items():
    df = generate_zone_data(zone_name, params)
    
    # Save Ground Truth
    gt_cols = ['zone_id', 'day_idx', 'S', 'E', 'I', 'R', 'daily_incidence', 'latent_outbreak_active', 'latent_outbreak_onset', 'outbreak_onset_next_7_days']
    all_ground_truth.append(df[gt_cols])
    
    # Save ML Features (No Latent/Ground Truth info except target)
    ml_cols = [
        'zone_id', 'day_idx', 'temperature', 'humidity', 'rainfall',
        'pharmacy_sales', 'pharm_sales_7d_mean', 'pharm_sales_7d_growth',
        'hospital_cases', 'hosp_cases_7d_mean',
        'lab_total', 'lab_positive', 'lab_pos_rate', 'lab_pos_rate_7d_mean',
        'outbreak_onset_next_7_days', 'valid_future_horizon', 'forecast_eligible'
    ]
    df_ml = df[ml_cols].copy()
    
    # Drop first 28 days due to rolling baseline NaNs and lagged NaNs
    df_ml = df_ml.iloc[28:].copy()
    
    # Save full temporal observable daily data
    os.makedirs('ai-service/datasets/temporal_data', exist_ok=True)
    df_temporal = df_ml.drop(columns=['valid_future_horizon', 'forecast_eligible'])
    df_temporal.to_csv(f'ai-service/datasets/temporal_data/{zone_name}_observable_daily.csv', index=False)
    
    # Drop rows without complete future horizon or already in an outbreak
    df_ml = df_ml[(df_ml['valid_future_horizon'] == True) & (df_ml['forecast_eligible'] == True)].copy()
    
    # Clean up temporary columns
    df_ml = df_ml.drop(columns=['valid_future_horizon', 'forecast_eligible']).reset_index(drop=True)
    
    df_ml.to_csv(f'ai-service/datasets/ml_ready/{zone_name}_features.csv', index=False)
    
    onsets = df['latent_outbreak_onset'].sum()
    target_1 = df_ml['outbreak_onset_next_7_days'].sum()
    target_0 = len(df_ml) - target_1
    
    summary.append({
        'Zone': zone_name,
        'Shape': df_ml.shape,
        'Onsets (Count)': onsets,
        'Target 0 (Days)': target_0,
        'Target 1 (Days)': target_1,
        'Class Imbalance (1s %)': round((target_1 / len(df_ml)) * 100, 2)
    })

pd.concat(all_ground_truth).to_csv('ai-service/datasets/latent_ground_truth.csv', index=False)

print("\n=== GENERATION SUMMARY ===")
print(pd.DataFrame(summary).to_string(index=False))

print("\n=== FILES CREATED ===")
print("1. ai-service/datasets/latent_ground_truth.csv")
for z in zones_config.keys():
    print(f"2. ai-service/datasets/ml_ready/{z}_features.csv")

print("\n=== SAMPLE ROWS (Zone_A ML Dataset) ===")
sample_df = pd.read_csv('ai-service/datasets/ml_ready/Zone_A_features.csv')
print(sample_df[['day_idx', 'pharmacy_sales', 'hospital_cases', 'lab_pos_rate', 'outbreak_onset_next_7_days']].iloc[150:160].to_string(index=False))

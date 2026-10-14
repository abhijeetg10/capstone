import pandas as pd
import numpy as np
import os
import json

# Set seed for reproducibility
np.random.seed(42)

def generate_v2_final():
    print("Generating Synthetic Epidemic V2 FINAL")
    zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
    num_days = 1095  # ~3 years
    population = 100000
    
    os.makedirs('synthetic_v2_final', exist_ok=True)
    with open('synthetic_v2_final/generator_config.json', 'w') as f:
        json.dump({'num_days': num_days, 'population': population, 'sigma': 1/5.0, 'gamma': 1/7.0, 'loss_of_immunity': 1/180.0}, f)
        
    sigma = 1.0 / 5.0  
    gamma = 1.0 / 7.0  
    loss_of_immunity = 1.0 / 180.0  
    
    all_ml_data = []
    all_temp_data = []
    all_latent_data = []
    
    for z in zones:
        print(f"Processing {z}...")
        days = np.arange(num_days)
        
        # Weather
        temp_base = 25 + 10 * np.sin(2 * np.pi * days / 365 + np.random.uniform(0, 2*np.pi))
        temperature = temp_base + np.random.normal(0, 2, num_days)
        rain_base = 10 + 50 * np.clip(np.sin(2 * np.pi * days / 365 - np.pi/2), 0, 1)
        rainfall = np.random.poisson(rain_base)
        humidity = np.clip(40 + 0.5 * rainfall + np.random.normal(0, 5, num_days), 20, 100)
        
        # Beta
        baseline_beta = 0.15 
        rain_lag = np.zeros(num_days)
        rain_lag[7:] = rainfall[:-7]
        weather_multiplier = 1.0 + (rain_lag / 100.0) * 0.5
        drift = np.cumsum(np.random.normal(0, 0.005, num_days))
        drift = np.clip(drift, -0.1, 0.1)
        beta = baseline_beta * weather_multiplier * (1 + 0.2*np.sin(2 * np.pi * days / 365)) + drift
        beta = np.clip(beta, 0.05, 0.4)
        
        # SEIR
        S = np.zeros(num_days, dtype=int)
        E = np.zeros(num_days, dtype=int)
        I = np.zeros(num_days, dtype=int)
        R = np.zeros(num_days, dtype=int)
        daily_incidence = np.zeros(num_days, dtype=int)
        imported_cases = np.zeros(num_days, dtype=int)
        
        S[0] = population - 10
        E[0] = 5
        I[0] = 5
        R[0] = 0
        
        for t in range(1, num_days):
            s_t = S[t-1]
            e_t = E[t-1]
            i_t = I[t-1]
            r_t = R[t-1]
            
            p_inf = 1.0 - np.exp(-beta[t] * i_t / population)
            new_exposed = np.random.binomial(s_t, p_inf)
            new_infectious = np.random.binomial(e_t, 1.0 - np.exp(-sigma))
            new_recovered = np.random.binomial(i_t, 1.0 - np.exp(-gamma))
            waned_immunity = np.random.binomial(r_t, 1.0 - np.exp(-loss_of_immunity))
            
            s_next = s_t - new_exposed + waned_immunity
            e_next = e_t + new_exposed - new_infectious
            i_next = i_t + new_infectious - new_recovered
            r_next = r_t + new_recovered - waned_immunity
            
            # Importations
            if np.random.rand() < 0.02:
                imported = np.random.poisson(3)
                if s_next >= imported:
                    s_next -= imported
                    e_next += imported
                    imported_cases[t] = imported
            
            S[t] = s_next
            E[t] = e_next
            I[t] = i_next
            R[t] = r_next
            daily_incidence[t] = new_infectious

        # Pharmacy
        pharmacy_baseline = 100 + np.random.normal(0, 10, num_days)
        pharmacy_demand = 0.5 * daily_incidence + 0.3 * np.roll(daily_incidence, 1) + 0.2 * np.roll(daily_incidence, 2)
        pharmacy_demand[:2] = 0
        pharmacy_sales = np.clip(pharmacy_baseline + pharmacy_demand + np.random.normal(0, 5, num_days), 0, None)
        
        # Hospital cases (derived from incidence, not prevalence)
        hosp_pool = (0.2 * daily_incidence + 0.5 * np.roll(daily_incidence, 1) + 0.3 * np.roll(daily_incidence, 2)).astype(int)
        hosp_pool[:2] = 0
        hospital_cases = np.random.binomial(np.clip(hosp_pool, 0, None), 0.15) 
        
        # Laboratory
        lab_base = 20 + np.random.poisson(10, num_days)
        lab_total = lab_base + np.random.binomial(hospital_cases, 0.5)
        true_pos = np.random.binomial(hospital_cases, 0.4)
        lab_positive = np.minimum(lab_total, true_pos + np.random.poisson(1, num_days))
        lab_pos_rate = np.where(lab_total > 0, lab_positive / lab_total, 0)
        
        df = pd.DataFrame({
            'zone_id': z,
            'day_idx': days,
            'hospital_cases': hospital_cases,
            'lab_total': lab_total,
            'lab_positive': lab_positive,
            'lab_pos_rate': lab_pos_rate,
            'pharmacy_sales': pharmacy_sales,
            'temperature': temperature,
            'humidity': humidity,
            'rainfall': rainfall
        })
        
        df['hosp_cases_7d_mean'] = df['hospital_cases'].rolling(7, min_periods=1).mean()
        df['lab_pos_rate_7d_mean'] = df['lab_pos_rate'].rolling(7, min_periods=1).mean()
        df['pharm_sales_7d_mean'] = df['pharmacy_sales'].rolling(7, min_periods=1).mean()
        df['pharm_sales_7d_growth'] = df['pharm_sales_7d_mean'].diff().fillna(0)
        
        # 5. Sustained Outbreak Labeling
        smoothed_inc = pd.Series(daily_incidence).rolling(window=3, min_periods=1).mean().values
        elevated = (smoothed_inc > 40).astype(int)
        
        latent_outbreak_active = np.zeros(num_days, dtype=int)
        latent_outbreak_onset = np.zeros(num_days, dtype=int)
        
        i = 0
        while i < num_days:
            if elevated[i] == 1:
                j = i
                while j < num_days and elevated[j] == 1:
                    j += 1
                length = j - i
                if length >= 3:
                    latent_outbreak_onset[i] = 1
                    latent_outbreak_active[i:j] = 1
                i = j
            else:
                i += 1
                
        # Target: onset_next_7_days
        target = pd.Series(latent_outbreak_onset).shift(-1).rolling(window=7, min_periods=1).max().fillna(0).astype(int)
        df['outbreak_onset_next_7_days'] = target
        
        gt = pd.DataFrame({
            'zone_id': z,
            'day_idx': days,
            'S': S, 'E': E, 'I': I, 'R': R,
            'beta': beta,
            'imported_cases': imported_cases,
            'daily_incidence': daily_incidence,
            'latent_outbreak_active': latent_outbreak_active,
            'latent_outbreak_onset': latent_outbreak_onset,
            'outbreak_onset_next_7_days': target
        })
        all_latent_data.append(gt)
        all_temp_data.append(df.copy())
        
        # ML ready filtering
        valid_ml_days = latent_outbreak_active == 0
        df_ml = df[valid_ml_days].copy()
        
        df_ml = df_ml[df_ml['day_idx'] >= 7]
        df_ml = df_ml[df_ml['day_idx'] <= num_days - 8]
        
        all_ml_data.append(df_ml)
        
        df_ml.to_csv(f'synthetic_v2_final/{z}_features.csv', index=False)
        df.to_csv(f'synthetic_v2_final/{z}_observable_daily.csv', index=False)

    pd.concat(all_latent_data).to_csv('synthetic_v2_final/latent_ground_truth.csv', index=False)
    pd.DataFrame({'zone_id': zones, 'baseline_beta': 0.15}).to_csv('synthetic_v2_final/zone_parameters.csv', index=False)
    print("V2 FINAL Dataset generation complete.")

if __name__ == '__main__':
    generate_v2_final()

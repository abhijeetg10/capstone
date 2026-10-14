import pandas as pd
import numpy as np
import os

# Set seed for reproducibility
np.random.seed(42)

def generate_v2():
    print("Generating Synthetic Epidemic V2 (Scientifically Forecastable SEIR)")
    # Configuration
    zones = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
    num_days = 1095  # ~3 years
    population = 100000
    
    # Epidemiological Parameters
    sigma = 1.0 / 5.0  # Incubation period ~5 days (E -> I)
    gamma = 1.0 / 7.0  # Infectious period ~7 days (I -> R)
    loss_of_immunity = 1.0 / 180.0  # R -> S (waning immunity to allow multiple waves)
    
    # Output structures
    all_ml_data = []
    all_temp_data = []
    all_latent_data = []
    
    for z in zones:
        print(f"Processing {z}...")
        # 1. GENERATE WEATHER
        days = np.arange(num_days)
        # Smooth seasonal temperature
        temp_base = 25 + 10 * np.sin(2 * np.pi * days / 365 + np.random.uniform(0, 2*np.pi))
        temperature = temp_base + np.random.normal(0, 2, num_days)
        
        # Rainfall (Monsoon peaks)
        rain_base = 10 + 50 * np.clip(np.sin(2 * np.pi * days / 365 - np.pi/2), 0, 1)
        rainfall = np.random.poisson(rain_base)
        
        # Humidity
        humidity = np.clip(40 + 0.5 * rainfall + np.random.normal(0, 5, num_days), 20, 100)
        
        # 2. GENERATE TIME-VARYING TRANSMISSION (beta)
        # Beta depends on baseline, seasonality, and lagged weather
        baseline_beta = 0.15 # Just below R0=1
        
        # Weather effect (lagged by 7 days for environmental suitability, e.g. mosquito breeding)
        rain_lag = np.zeros(num_days)
        rain_lag[7:] = rainfall[:-7]
        # Normalize lagged rain
        weather_multiplier = 1.0 + (rain_lag / 100.0) * 0.5
        
        # Slow stochastic drift
        drift = np.cumsum(np.random.normal(0, 0.005, num_days))
        drift = np.clip(drift, -0.1, 0.1)
        
        beta = baseline_beta * weather_multiplier * (1 + 0.2*np.sin(2 * np.pi * days / 365)) + drift
        beta = np.clip(beta, 0.05, 0.4)
        
        # 3. SEIR SIMULATION
        S = np.zeros(num_days)
        E = np.zeros(num_days)
        I = np.zeros(num_days)
        R = np.zeros(num_days)
        daily_incidence = np.zeros(num_days)
        imported_cases = np.zeros(num_days)
        
        # Initial state
        S[0] = population - 10
        E[0] = 5
        I[0] = 5
        R[0] = 0
        
        for t in range(1, num_days):
            # Current states
            s_t = S[t-1]
            e_t = E[t-1]
            i_t = I[t-1]
            r_t = R[t-1]
            
            # Transitions (Binomial draws for stochasticity)
            p_inf = 1.0 - np.exp(-beta[t] * i_t / population)
            new_exposed = np.random.binomial(s_t, p_inf)
            
            new_infectious = np.random.binomial(e_t, 1.0 - np.exp(-sigma))
            new_recovered = np.random.binomial(i_t, 1.0 - np.exp(-gamma))
            waned_immunity = np.random.binomial(r_t, 1.0 - np.exp(-loss_of_immunity))
            
            # Importations (rare small injections to seed new waves)
            if np.random.rand() < 0.02: # 2% chance each day
                imported = np.random.poisson(3)
                if s_t >= imported:
                    s_t -= imported
                    new_exposed += imported
                    imported_cases[t] = imported
            
            # Update compartments
            S[t] = s_t - new_exposed + waned_immunity
            E[t] = e_t + new_exposed - new_infectious
            I[t] = i_t + new_infectious - new_recovered
            R[t] = r_t + new_recovered - waned_immunity
            
            daily_incidence[t] = new_infectious

        # 4. CAUSAL OBSERVATION GENERATION
        # Pharmacy (early signal, responds to recent incidence)
        pharmacy_baseline = 100 + np.random.normal(0, 10, num_days)
        # Symptomatic demand: responds to new infectious cases over the last few days
        pharmacy_demand = 0.5 * daily_incidence + 0.2 * np.roll(daily_incidence, 1) + 0.1 * np.roll(daily_incidence, 2)
        pharmacy_sales = np.clip(pharmacy_baseline + pharmacy_demand + np.random.normal(0, 5, num_days), 0, None)
        
        # Hospital cases (lagged and sampled from active I)
        hospital_cases = np.random.binomial(I.astype(int), 0.15) # 15% seek hospital care
        
        # Laboratory tests
        lab_base = 20 + np.random.poisson(10, num_days)
        # People get tested proportionally to hospital cases + some background
        lab_total = lab_base + np.random.binomial(hospital_cases.astype(int), 0.5)
        # True positives are proportional to the true disease hospital cases
        # Note: some lab positives might be background noise, but mostly from the disease
        true_pos = np.random.binomial(hospital_cases.astype(int), 0.4)
        lab_positive = np.minimum(lab_total, true_pos + np.random.poisson(1, num_days))
        lab_pos_rate = np.where(lab_total > 0, lab_positive / lab_total, 0)
        
        # Combine into dataframe
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
        
        # Rolling features
        df['hosp_cases_7d_mean'] = df['hospital_cases'].rolling(7, min_periods=1).mean()
        df['lab_pos_rate_7d_mean'] = df['lab_pos_rate'].rolling(7, min_periods=1).mean()
        df['pharm_sales_7d_mean'] = df['pharmacy_sales'].rolling(7, min_periods=1).mean()
        df['pharm_sales_7d_growth'] = df['pharm_sales_7d_mean'].diff().fillna(0)
        
        # 5. OUTBREAK LABELING (Sustained threshold)
        # Use smoothed incidence to prevent 1-day spikes from triggering it.
        smoothed_inc = pd.Series(daily_incidence).rolling(window=3, min_periods=1).mean()
        outbreak_threshold = 40
        latent_outbreak_active = (smoothed_inc > outbreak_threshold).astype(int)
        
        # Onset: Active today, not active yesterday
        latent_outbreak_onset = (latent_outbreak_active == 1) & (latent_outbreak_active.shift(1, fill_value=0) == 0)
        latent_outbreak_onset = latent_outbreak_onset.astype(int)
        
        # Target: onset_next_7_days
        # For day T, is there an onset in T+1 to T+7?
        target = latent_outbreak_onset.shift(-1).rolling(window=7, min_periods=1).max().fillna(0).astype(int)
        df['outbreak_onset_next_7_days'] = target
        
        # Export Ground Truth
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
        
        # Save raw observable daily
        all_temp_data.append(df.copy())
        
        # Create ml_ready (filter out active outbreaks)
        # A day is valid for ML training if it is not inside an active outbreak
        valid_ml_days = latent_outbreak_active == 0
        df_ml = df[valid_ml_days].copy()
        
        # Also drop first 7 days due to rolling window NaNs
        df_ml = df_ml[df_ml['day_idx'] >= 7]
        
        all_ml_data.append(df_ml)
        
        # Save to disk
        os.makedirs('ai-service/datasets/ml_ready', exist_ok=True)
        os.makedirs('ai-service/datasets/temporal_data', exist_ok=True)
        df_ml.to_csv(f'ai-service/datasets/ml_ready/{z}_features.csv', index=False)
        df.to_csv(f'ai-service/datasets/temporal_data/{z}_observable_daily.csv', index=False)

    # Save ground truth
    pd.concat(all_latent_data).to_csv('ai-service/datasets/latent_ground_truth.csv', index=False)
    print("V2 Dataset generation complete.")

if __name__ == '__main__':
    generate_v2()

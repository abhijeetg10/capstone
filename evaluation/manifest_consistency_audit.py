import pandas as pd
import numpy as np

base_dir = "simulation_replicates"
seeds = range(1000, 1050)
total_onsets = 0
events_completed = []
events_right_censored = []

for seed in seeds:
    gt = pd.read_csv(f"{base_dir}/seed_{seed}/latent_ground_truth.csv")
    
    # Correct duration tracking per zone
    for z in gt['zone_id'].unique():
        zdf = gt[gt['zone_id'] == z]
        onsets = zdf['latent_outbreak_onset'].sum()
        total_onsets += onsets
        
        active = False
        duration = 0
        for _, row in zdf.iterrows():
            if row['latent_outbreak_active'] == 1:
                if not active: active = True; duration = 1
                else: duration += 1
            else:
                if active: 
                    events_completed.append(duration)
                    active = False; duration = 0
        
        if active:
            events_right_censored.append(duration)

events_completed = np.array(events_completed)
events_rc = np.array(events_right_censored)

d1 = np.sum(events_completed == 1) + np.sum(events_rc == 1)
d2 = np.sum(events_completed == 2) + np.sum(events_rc == 2)
d3_6 = np.sum((events_completed >= 3) & (events_completed <= 6)) + np.sum((events_rc >= 3) & (events_rc <= 6))
d7 = np.sum(events_completed >= 7) + np.sum(events_rc >= 7)

total_accounted = d1 + d2 + d3_6 + d7
mismatch = total_onsets - total_accounted

print(f"Total Onsets: {total_onsets}")
print(f"Completed Events: {len(events_completed)}")
print(f"Right-Censored Events: {len(events_rc)}")
print(f"1-day: {d1}, 2-day: {d2}, 3-6 day: {d3_6}, 7+ day: {d7}")
print(f"DURATION_ACCOUNTING_MISMATCH = {mismatch}")

import os
os.makedirs("results_development", exist_ok=True)
with open("results_development/manifest_consistency_audit.csv", "w") as f:
    f.write("Category,Count\n")
    f.write(f"3-6_day_completed,{np.sum((events_completed >= 3) & (events_completed <= 6))}\n")
    f.write(f"7+_day_completed,{np.sum(events_completed >= 7)}\n")
    f.write(f"3-6_day_right_censored,{np.sum((events_rc >= 3) & (events_rc <= 6))}\n")
    f.write(f"7+_day_right_censored,{np.sum(events_rc >= 7)}\n")
    f.write(f"DURATION_ACCOUNTING_MISMATCH,{mismatch}\n")

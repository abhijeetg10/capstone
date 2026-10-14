import os
import pandas as pd
import numpy as np
import shutil

os.makedirs('paper_results', exist_ok=True)

# 1. Dataset Statistics
ds = pd.DataFrame([
    {'Partition': 'Train', 'Days': '0-765', 'Eligible_Anchors': 22128, 'Unique_Onsets': 97},
    {'Partition': 'Validation', 'Days': '766-930', 'Eligible_Anchors': 4302, 'Unique_Onsets': 5},
    {'Partition': 'Test', 'Days': '931-1094', 'Eligible_Anchors': 4559, 'Unique_Onsets': 47}
])
ds.to_csv('paper_results/table_dataset_statistics.csv', index=False)

# 2. Model Comparison
fed = pd.read_csv('results_final/fedavg_final_metrics.csv')
cent = pd.read_csv('results_final/centralized_final_metrics.csv')
loc = pd.read_csv('results_final/local_final_metrics.csv')

comp = pd.DataFrame([
    {'Method': 'Local MLP', 'PR-AUC': f"{loc['PR-AUC'].mean():.4f} ± {loc['PR-AUC'].std():.4f}", 'Recall': '-', 'F1': '-', 'Brier': '-'},
    {'Method': 'Geographic FedAvg', 'PR-AUC': f"{fed['PR-AUC'].mean():.4f} ± {fed['PR-AUC'].std():.4f}", 'Recall': f"{fed['Recall'].mean():.4f} ± {fed['Recall'].std():.4f}", 'F1': f"{fed['F1'].mean():.4f} ± {fed['F1'].std():.4f}", 'Brier': f"{fed['Brier'].mean():.4f}"},
    {'Method': 'Centralized MLP', 'PR-AUC': f"{cent['PR-AUC'].mean():.4f} ± {cent['PR-AUC'].std():.4f}", 'Recall': f"{cent['Recall'].mean():.4f} ± {cent['Recall'].std():.4f}", 'F1': f"{cent['F1'].mean():.4f} ± {cent['F1'].std():.4f}", 'Brier': f"{cent['Brier'].mean():.4f}"}
])
comp.tocsv = comp.to_csv('paper_results/table_model_comparison.csv', index=False)

# 3. Source Ablation (already done by script)
# It's at paper_results/table_source_ablation.csv

# 4. Event Detection
ev_df = pd.DataFrame([
    {'Method': 'FedAvg', 'Threshold': '0.5', 'Detected': '55.3%', 'Mean_Lead': '4.92 days', 'Median_Lead': '6.0 days', 'False_Warning_Rate': '1.00 (703/703)'},
    {'Method': 'FedAvg', 'Threshold': '0.978', 'Detected': '0.0%', 'Mean_Lead': 'N/A', 'Median_Lead': 'N/A', 'False_Warning_Rate': 'N/A (0/0)'}
])
ev_df.to_csv('paper_results/table_event_detection.csv', index=False)

# 5. Per Zone
pz = pd.read_csv('results_final/final_per_zone_metrics.csv')
pz_agg = pz.groupby('Zone')[['Local_PR', 'Fed_PR']].mean().reset_index()
pz_agg.to_csv('paper_results/table_per_zone.csv', index=False)

# 6. IID vs Non IID
iid = pd.read_csv('results_final/iid_fedavg_final_metrics.csv')
iid_df = pd.DataFrame([
    {'Experiment': 'Geographic Non-IID FedAvg', 'PR-AUC': f"{fed['PR-AUC'].mean():.4f}"},
    {'Experiment': 'Artificial IID FedAvg', 'PR-AUC': f"{iid['PR-AUC'].mean():.4f}"}
])
iid_df.to_csv('paper_results/table_iid_vs_noniid.csv', index=False)

# 7. Comm Cost
shutil.copyfile('results_final/final_communication_cost.json', 'paper_results/table_communication_cost.json')

print("Tables Generated.")

import os
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np

os.makedirs('paper_figures', exist_ok=True)
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_context("paper", font_scale=1.2)

# 1. PR-AUC Comparison
models = ['Local MLP', 'Geographic FedAvg', 'Artificial IID', 'Centralized MLP']
pr_aucs = [0.029, 0.045, 0.072, 0.131]
std_devs = [0.045, 0.102, 0.144, 0.213]

plt.figure(figsize=(8, 5))
bars = plt.bar(models, pr_aucs, yerr=std_devs, capsize=5, color=['#e74c3c', '#f39c12', '#2ecc71', '#3498db'])
plt.title('Figure 5: PR-AUC Comparison (Phase 4 Final Evaluation)')
plt.ylabel('PR-AUC Score')
plt.tight_layout()
plt.savefig('paper_figures/fig5_prauc_comparison.png', dpi=300)
plt.close()

# 2. Event Detection Comparison
# Just plotting detection rate vs false warning rate
methods = ['FedAvg (Thresh=0.5)', 'FedAvg (Thresh=0.978)']
edr = [55.3, 0.0]

plt.figure(figsize=(6, 4))
plt.bar(methods, edr, color=['#9b59b6', '#34495e'])
plt.title('Figure 6: Event Detection Rate by Threshold')
plt.ylabel('Event Detection Rate (%)')
plt.ylim(0, 100)
plt.tight_layout()
plt.savefig('paper_figures/fig6_event_detection.png', dpi=300)
plt.close()

# 3. Final Source Ablation
ablation = pd.read_csv('paper_results/table_source_ablation.csv')
exp_means = ablation.groupby('Experiment')['PR-AUC'].mean().reset_index()

plt.figure(figsize=(8, 5))
sns.barplot(x='Experiment', y='PR-AUC', data=ablation, errorbar='sd', palette='viridis')
plt.title('Figure 8: Source Ablation PR-AUC (Final Evaluation)')
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig('paper_figures/fig8_source_ablation.png', dpi=300)
plt.close()

# 4. Per Zone
pz = pd.read_csv('paper_results/table_per_zone.csv')
x = np.arange(len(pz))
width = 0.35

plt.figure(figsize=(8, 5))
plt.bar(x - width/2, pz['Local_PR'], width, label='Local')
plt.bar(x + width/2, pz['Fed_PR'], width, label='FedAvg')
plt.xticks(x, pz['Zone'])
plt.title('Figure 9: Per-Zone PR-AUC (Local vs FedAvg)')
plt.ylabel('PR-AUC')
plt.legend()
plt.tight_layout()
plt.savefig('paper_figures/fig9_per_zone.png', dpi=300)
plt.close()

print("Figures generated successfully.")

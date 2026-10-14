import os
import json
import torch
import numpy as np
import pandas as pd
from development_models import MLP, get_data, evaluate_events, train_nn
from sklearn.preprocessing import StandardScaler

features_all = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
                'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
                'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
                'humidity', 'rainfall']

with open('results_development/frozen_model_config.json', 'r') as f:
    config = json.load(f)

best_c = config['hyperparameters']

all_va_y = []
all_va_p = []

event_res = []

for seed in range(1000, 1010):
    tr, va, te = get_data(seed, features_all, 1)
    tr_x, tr_y, tr_meta = tr
    va_x, va_y, va_meta = va
    te_x, te_y, te_meta = te
    
    sc = StandardScaler().fit(tr_x)
    tr_xs = sc.transform(tr_x)
    va_xs = sc.transform(va_x)
    
    pos_w = np.sum(tr_y == 0) / max(1, np.sum(tr_y == 1))
    
    net = train_nn(MLP, {'input_dim': len(features_all), 'dropout': best_c['drop']}, 
                   tr_xs, tr_y, va_xs, va_y, best_c['lr'], pos_w, 42)
    
    with torch.no_grad():
        vp = torch.sigmoid(net(torch.tensor(va_xs, dtype=torch.float32))).numpy()
        
    all_va_y.extend(va_y)
    all_va_p.extend(vp)
    
    met05 = evaluate_events(va_meta, vp, 0.5)
    met05['Sim_Seed'] = seed
    event_res.append(met05)
    
pd.DataFrame(event_res).to_csv('results_development/event_detection_metrics.csv', index=False)

from sklearn.metrics import precision_recall_curve
prec, rec, thresh = precision_recall_curve(all_va_y, all_va_p)
f1s = 2 * (prec * rec) / (prec + rec + 1e-8)
best_idx = np.argmax(f1s)
best_t = thresh[best_idx] if best_idx < len(thresh) else thresh[-1]

with open('results_development/threshold_policy.json', 'w') as f:
    json.dump({'policy': 'maximize_validation_F1', 'derived_threshold': float(best_t)}, f, indent=4)

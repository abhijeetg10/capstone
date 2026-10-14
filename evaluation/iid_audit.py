import os
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import copy
import warnings
warnings.filterwarnings('ignore')

from canonical_development import get_canonical_data, MLP, fedavg, calc_metrics

DEV_SEEDS = list(range(1000, 1010))
ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']

def main():
    print("Running corrected IID Control...")
    best_e, best_r = 1, 10
    
    iid_pr = []
    
    for seed in DEV_SEEDS:
        tr, va, te, m_va, m_te, pos_w, gt, _ = get_canonical_data(seed, 1)
        
        tr_cx = torch.cat([tr[z][0] for z in ZONES])
        tr_cy = torch.cat([tr[z][1] for z in ZONES])
        te_cx = torch.cat([te[z][0] for z in ZONES])
        te_cy = torch.cat([te[z][1] for z in ZONES])
        
        # CORRECT IID PERMUTATION
        perm = torch.randperm(len(tr_cx))
        tr_cx_iid = tr_cx[perm]
        tr_cy_iid = tr_cy[perm]
        
        tr_iid = {ZONES[i]: (torch.chunk(tr_cx_iid, 5)[i], torch.chunk(tr_cy_iid, 5)[i]) for i in range(5)}
        
        for ms in [42, 43, 44]:
            torch.manual_seed(ms)
            fm_iid, _ = fedavg(tr_iid, va, best_e, best_r, 5e-4, pos_w, ms)
            
            with torch.no_grad():
                fi_vp = torch.sigmoid(fm_iid(te_cx)).numpy()
                
            iid_pr.append(calc_metrics(te_cy.numpy(), fi_vp)['PR-AUC'])
            
    print(f"Corrected IID FedAvg PR-AUC: {np.mean(iid_pr):.4f}")

if __name__ == '__main__':
    main()

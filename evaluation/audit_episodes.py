import os
import torch
import numpy as np
import pandas as pd
import json
import warnings
warnings.filterwarnings('ignore')

from phase4_final import get_canonical_data, MLP, fedavg

ZONES = ['Zone_A', 'Zone_B', 'Zone_C', 'Zone_D', 'Zone_E']
FINAL_SEEDS = list(range(1010, 1050))
MODEL_SEEDS = [42, 43, 44]

def main():
    print("Auditing Episodes...")
    all_episodes = []
    
    for seed in FINAL_SEEDS:
        tr, te, m_te, pos_w, gt = get_canonical_data(seed)
        m_te_all = pd.concat([m_te[z] for z in ZONES]) if len(te[ZONES[0]][0]) > 0 else pd.DataFrame()
        if len(m_te_all) == 0: continue
        
        te_cx = torch.cat([te[z][0] for z in ZONES])
        
        for ms in MODEL_SEEDS:
            fm = fedavg(tr, 1, 10, 5e-4, pos_w, ms)
            with torch.no_grad():
                vp = torch.sigmoid(fm(te_cx)).numpy()
                
            meta = m_te_all.copy()
            meta['prob'] = vp
            
            for thresh in [0.5, 0.978]:
                meta['pred'] = (vp > thresh).astype(int)
                
                eps_count, falses = 0, 0
                for z in meta['zone'].unique():
                    z_meta = meta[meta['zone'] == z].sort_values('day_idx')
                    preds = z_meta['pred'].values
                    if len(preds) == 0: continue
                    diffs = np.diff(np.concatenate([[0], preds]))
                    starts = np.where(diffs == 1)[0]
                    ends = np.where(diffs == -1)[0]
                    if len(ends) < len(starts): ends = np.append(ends, len(preds))
                    
                    eps_count += len(starts)
                    for s, e in zip(starts, ends):
                        ep_days = z_meta['day_idx'].iloc[s:e].values
                        fut_days = set()
                        for d in ep_days:
                            fut_days.update(range(d + 1, d + 8))
                        
                        # True outbreak onset in gt
                        # The prediction is that an onset happens in [d+1, d+7]
                        z_gt = gt[(gt['zone_id'] == z) & (gt['latent_outbreak_onset'] == 1)]
                        found = any(od in fut_days for od in z_gt['day_idx'].values)
                        
                        if not found:
                            falses += 1
                            
                all_episodes.append({'Sim_Seed': seed, 'Model_Seed': ms, 'Thresh': thresh, 'Eps': eps_count, 'Falses': falses})
                
    df = pd.DataFrame(all_episodes)
    df.to_csv('results_final_audited/corrected_episodes.csv', index=False)
    
    for t in [0.5, 0.978]:
        dft = df[df['Thresh'] == t]
        tot = dft['Eps'].sum() // 3
        fal = dft['Falses'].sum() // 3
        print(f"Thresh {t}: Total Eps: {tot}, False: {fal}, Rate: {fal/max(1, tot):.2f}")

if __name__ == '__main__':
    main()

import pandas as pd
import numpy as np
import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DATASETS_DIR = os.path.join(BASE_DIR, "ai-service", "datasets")
HOSPITAL_DATA_DIR = os.path.join(BASE_DIR, "flower-clients", "hospital-client", "data")
MASTER_DATASET_PATH = os.path.join(AI_DATASETS_DIR, "indian_diseases_dataset.csv")

def setup_directories():
    os.makedirs(AI_DATASETS_DIR, exist_ok=True)
    os.makedirs(HOSPITAL_DATA_DIR, exist_ok=True)

def enrich_dataset(df):
    """Enrich dataset with explicit symptom flags, top medicine sold, and lab confirmation status."""
    np.random.seed(42)
    n = len(df)
    
    # Map diseases to typical symptom signatures and top selling medicines
    disease_profiles = {
        'Leptospirosis': {'fever': 0.9, 'joint_pain': 0.8, 'cough': 0.2, 'diarrhea': 0.3, 'rash': 0.4, 'fatigue': 0.9, 'med': 'Doxycycline'},
        'Asthma': {'fever': 0.1, 'joint_pain': 0.1, 'cough': 0.95, 'diarrhea': 0.05, 'rash': 0.05, 'fatigue': 0.7, 'med': 'Salbutamol Inhaler'},
        'Gastroenteritis': {'fever': 0.6, 'joint_pain': 0.2, 'cough': 0.1, 'diarrhea': 0.95, 'rash': 0.1, 'fatigue': 0.8, 'med': 'ORS & Zinc'},
        'Hypertension': {'fever': 0.05, 'joint_pain': 0.1, 'cough': 0.05, 'diarrhea': 0.05, 'rash': 0.05, 'fatigue': 0.5, 'med': 'Amlodipine'},
        'Dengue': {'fever': 0.95, 'joint_pain': 0.9, 'cough': 0.2, 'diarrhea': 0.3, 'rash': 0.7, 'fatigue': 0.9, 'med': 'Paracetamol'},
        'Malaria': {'fever': 0.95, 'joint_pain': 0.7, 'cough': 0.2, 'diarrhea': 0.3, 'rash': 0.2, 'fatigue': 0.9, 'med': 'Chloroquine'},
        'Typhoid': {'fever': 0.9, 'joint_pain': 0.5, 'cough': 0.3, 'diarrhea': 0.6, 'rash': 0.3, 'fatigue': 0.8, 'med': 'Azithromycin'}
    }
    
    fevers, joint_pains, coughs, diarrheas, rashes, fatigues, medicines, lab_confirmations = [], [], [], [], [], [], [], []
    
    for _, row in df.iterrows():
        disease = row.get('disease_name', 'Hypertension')
        profile = disease_profiles.get(disease, {'fever': 0.5, 'joint_pain': 0.3, 'cough': 0.3, 'diarrhea': 0.2, 'rash': 0.2, 'fatigue': 0.5, 'med': 'Paracetamol'})
        
        fevers.append(1 if np.random.rand() < profile['fever'] else 0)
        joint_pains.append(1 if np.random.rand() < profile['joint_pain'] else 0)
        coughs.append(1 if np.random.rand() < profile['cough'] else 0)
        diarrheas.append(1 if np.random.rand() < profile['diarrhea'] else 0)
        rashes.append(1 if np.random.rand() < profile['rash'] else 0)
        fatigued = 1 if np.random.rand() < profile['fatigue'] else 0
        fatigues.append(fatigued)
        medicines.append(profile['med'])
        lab_confirmations.append(1 if np.random.rand() < 0.85 else 0)
        
    df['fever'] = fevers
    df['joint_pain'] = joint_pains
    df['cough'] = coughs
    df['diarrhea'] = diarrheas
    df['rash'] = rashes
    df['fatigue'] = fatigues
    df['top_medicine_sold'] = medicines
    df['lab_confirmed'] = lab_confirmations
    
    return df

def copy_master():
    dest = os.path.join(AI_DATASETS_DIR, "indian_diseases_dataset.csv")
    if os.path.exists(MASTER_DATASET_PATH) and os.path.abspath(MASTER_DATASET_PATH) != os.path.abspath(dest):
        shutil.copy(MASTER_DATASET_PATH, dest)
        print(f"Copied master dataset to {dest}")
    else:
        print(f"Using master dataset at {dest}")
    return dest

def split_non_iid(master_path):
    print("Loading master dataset for partitioning...")
    df = pd.read_csv(master_path)
    
    # Enrich dataset with symptom flags & top medicine
    df = enrich_dataset(df)
    df.to_csv(master_path, index=False)
    print(f"Enriched master dataset saved to {master_path}")
    
    # Get top diseases for biased hospital splits
    top_diseases = df['disease_name'].value_counts().head(4).index.tolist()
    if len(top_diseases) < 4:
        top_diseases = df['disease_name'].unique().tolist()[:4]
    
    print(f"Creating non-IID splits targeting: {top_diseases}")
    
    df_shuffled = df.sample(frac=1, random_state=42).reset_index(drop=True)
    records_per_hospital = 1000
    primary_bias = int(records_per_hospital * 0.6)
    
    for i, primary_disease in enumerate(top_diseases, 1):
        primary_df = df_shuffled[df_shuffled['disease_name'] == primary_disease]
        available_primary = len(primary_df)
        take_primary = min(primary_bias, available_primary)
        split_primary = primary_df.sample(n=take_primary, random_state=42)
        
        df_shuffled = df_shuffled.drop(split_primary.index)
        remaining_needed = records_per_hospital - take_primary
        split_mixed = df_shuffled.sample(n=min(remaining_needed, len(df_shuffled)), random_state=42)
        df_shuffled = df_shuffled.drop(split_mixed.index)
        
        hospital_df = pd.concat([split_primary, split_mixed]).sample(frac=1, random_state=42)
        out_path = os.path.join(HOSPITAL_DATA_DIR, f"hospital_{i}.csv")
        hospital_df.to_csv(out_path, index=False)
        print(f"Generated {out_path} ({len(hospital_df)} records) - Primary Bias: {primary_disease}")

if __name__ == "__main__":
    setup_directories()
    dest_path = copy_master()
    split_non_iid(dest_path)
    print("Dataset Enrichment and Partitioning Complete!")

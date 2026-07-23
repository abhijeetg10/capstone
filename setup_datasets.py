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
    
    # Get the top 4 diseases to create biases
    top_diseases = df['disease_name'].value_counts().head(4).index.tolist()
    if len(top_diseases) < 4:
        # Fallback if there aren't 4 distinct diseases
        top_diseases = df['disease_name'].unique().tolist()[:4]
    
    print(f"Creating non-IID splits targeting: {top_diseases}")
    
    # Shuffle dataset
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # We will give each hospital 1000 records total.
    # 600 records of their "primary" disease, 400 random mixed records.
    records_per_hospital = 1000
    primary_bias = int(records_per_hospital * 0.6)
    
    for i, primary_disease in enumerate(top_diseases, 1):
        # Extract primary disease records
        primary_df = df[df['disease_name'] == primary_disease]
        
        # Take the required amount (or whatever is available)
        available_primary = len(primary_df)
        take_primary = min(primary_bias, available_primary)
        split_primary = primary_df.sample(n=take_primary, random_state=42)
        
        # Remove these from the main pool so they aren't reused
        df = df.drop(split_primary.index)
        
        # Fill the rest with random records from the pool
        remaining_needed = records_per_hospital - take_primary
        split_mixed = df.sample(n=remaining_needed, random_state=42)
        df = df.drop(split_mixed.index)
        
        # Combine and shuffle
        hospital_df = pd.concat([split_primary, split_mixed]).sample(frac=1, random_state=42)
        
        out_path = os.path.join(HOSPITAL_DATA_DIR, f"hospital_{i}.csv")
        hospital_df.to_csv(out_path, index=False)
        print(f"Generated {out_path} ({len(hospital_df)} records) - Primary Bias: {primary_disease}")

if __name__ == "__main__":
    setup_directories()
    dest_path = copy_master()
    split_non_iid(dest_path)
    print("Dataset Migration and Partitioning Complete!")

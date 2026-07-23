import flwr as fl
import pandas as pd
import os
import sys
import argparse

# Add ai-service to path so we can import the model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, "ai-service"))

from models.random_forest import FederatedRandomForest

class HospitalClient(fl.client.NumPyClient):
    def __init__(self, hospital_id):
        self.hospital_id = hospital_id
        self.ml_pipeline = FederatedRandomForest()
        
        dataset_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", f"hospital_{hospital_id}.csv")
        print(f"[Hospital {hospital_id}] Loading REAL dataset: {dataset_path}")
        
        df = pd.read_csv(dataset_path)
        self.X, self.y = self.ml_pipeline.preprocess_data(df)
        self.num_samples = len(self.X)

    def get_parameters(self, config):
        return self.ml_pipeline.get_federated_parameters()

    def fit(self, parameters, config):
        print(f"\n[Hospital {self.hospital_id}] Global Round Started.")
        self.ml_pipeline.set_federated_parameters(parameters)
        
        print(f"[Hospital {self.hospital_id}] Training Local Model on REAL DATA...")
        self.ml_pipeline.train(self.X, self.y)
        print(f"[Hospital {self.hospital_id}] Training Complete.")
        
        return self.get_parameters(config), self.num_samples, {}

    def evaluate(self, parameters, config):
        self.ml_pipeline.set_federated_parameters(parameters)
        acc = self.ml_pipeline.evaluate(self.X, self.y)
        print(f"[Hospital {self.hospital_id}] Updated Global Model Received.")
        print(f"[Hospital {self.hospital_id}] Local Accuracy: {acc:.4f}\n")
        return float(1.0 - acc), self.num_samples, {"accuracy": acc}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--hospital-id", type=int, required=True, help="ID of the hospital (1-4)")
    args = parser.parse_args()
    
    print(f"Starting Hospital {args.hospital_id} Client...")
    fl.client.start_numpy_client(
        server_address="127.0.0.1:8085",
        client=HospitalClient(args.hospital_id)
    )

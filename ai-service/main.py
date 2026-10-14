from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import pickle
import logging
import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Disease Surveillance Inference API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEATURES = ['hospital_cases', 'hosp_cases_7d_mean', 'lab_total', 'lab_positive', 
            'lab_pos_rate', 'lab_pos_rate_7d_mean', 'pharmacy_sales', 
            'pharm_sales_7d_mean', 'pharm_sales_7d_growth', 'temperature', 
            'humidity', 'rainfall']

class MLP(nn.Module):
    def __init__(self, in_features=12, drop=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_features, 64), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(64, 32), nn.ReLU(), nn.Dropout(drop),
            nn.Linear(32, 1)
        )
    def forward(self, x): return self.net(x).squeeze(1)

model = MLP()
scaler = None

@app.on_event("startup")
def load_artifacts():
    global scaler
    try:
        model.load_state_dict(torch.load('models/frozen_mlp.pth', map_location='cpu'))
        model.eval()
        with open('models/scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        logger.info("Frozen MLP and Scaler loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load artifacts: {e}")

class OutbreakPredictionRequest(BaseModel):
    zone_id: str
    hospital_cases: float
    hosp_cases_7d_mean: float
    lab_total: float
    lab_positive: float
    lab_pos_rate: float
    lab_pos_rate_7d_mean: float
    pharmacy_sales: float
    pharm_sales_7d_mean: float
    pharm_sales_7d_growth: float
    temperature: float
    humidity: float
    rainfall: float

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "ai-service"}

@app.post("/predict-outbreak")
def predict_outbreak(request: OutbreakPredictionRequest):
    if scaler is None:
        raise HTTPException(status_code=500, detail="Model artifacts not loaded.")
        
    try:
        data = [getattr(request, f) for f in FEATURES]
        x_val = np.array(data)
        x_scaled = (x_val - scaler['mean']) / scaler['std']
        
        with torch.no_grad():
            x_t = torch.tensor([x_scaled], dtype=torch.float32)
            prob = torch.sigmoid(model(x_t)).item()
            
        # Using operational threshold of 0.5 for risk category visually
        if prob > 0.978:
            risk = "CRITICAL"
        elif prob > 0.5:
            risk = "HIGH"
        elif prob > 0.1:
            risk = "MODERATE"
        else:
            risk = "LOW"
            
        return {
            "status": "success",
            "zone_id": request.zone_id,
            "prediction_timestamp": datetime.datetime.now().isoformat(),
            "outbreak_probability": round(prob, 4),
            "risk_category": risk
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

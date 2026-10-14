# Federated Multi-Source Disease Surveillance

**Disclaimer:** *The research is a simulation-based proof-of-concept and has not been clinically validated on real-world healthcare data.*

## Project Objective
This project demonstrates a multi-source, privacy-preserving federated early warning system for localized epidemic outbreaks. It integrates heterogeneous data sources (hospitals, laboratories, pharmacies, and meteorology) to detect hidden disease outbreaks 5-7 days before peak case incidence, utilizing Federated Averaging (FedAvg) across spatially distributed regional zones.

## Architecture
The system employs a dual-track architecture:
1. **Research Pipeline:** An extensive Python-based data generation and ML modeling pipeline that simulates latent SEIRS dynamics and evaluates Federated vs. Local vs. Centralized early warning models.
2. **Production System:** A full-stack web application featuring:
   - **PostgreSQL / PostGIS:** Geospatial storage for predictions and observables.
   - **Node.js/Express Backend:** Aggregation and synchronization API.
   - **FastAPI / PyTorch AI Service:** Live inference endpoint using the frozen pre-trained model.
   - **React/Leaflet Frontend:** Interactive GIS dashboard for visualization.

## Synthetic Simulation Methodology
Because strictly coupled real-world, localized multi-source syndromic data with perfect latent ground truth is inaccessible, we utilize **Generator V2.1 FINAL**.
- It implements a stochastic network-structured SEIRS model simulating daily latent outbreaks.
- It couples the latent epidemiological reality to 12 realistic observables (hospital admissions, lab testing queues with capacity constraints, pharmacy over-the-counter sales surges, and meteorological drivers like temperature and humidity).
- True early warning is strictly evaluated by forecasting latent outbreaks within a 7-day future horizon.

## Training / Evaluation Procedure
We employ a strictly prospective, chronological evaluation mechanism:
- **Absolute Calendar Splits:** Data for each zone is split chronologically into 70% Train (Days 0-765), 15% Validation (Days 766-930), and 15% Test (Days 931-1094).
- **Target Horizons:** Predictions are considered valid only if their entire 7-day horizon remains inside the chronological partition to prevent data leakage.
- **Seed Split (Final Evaluation Firewall):** 
  - Seeds 1000-1009 were used for model development, threshold selection (0.978), and architecture tuning.
  - Seeds 1010-1049 (40 independent replications) were strictly locked and used exactly once for the final evaluation to prevent post-hoc optimization.

## Final Model Architecture
The frozen prediction engine is a PyTorch Multi-Layer Perceptron (MLP):
- **Inputs:** 12 normalized observational features
- **Architecture:** Linear(12) -> ReLU -> Dropout(0.2) -> Linear(64) -> ReLU -> Dropout(0.2) -> Linear(32) -> ReLU -> Linear(1)
- **Parameters:** 2,945
- **Optimizer:** Adam (LR: 5e-4)

## How to Run the App (Production)
1. **Start Docker Services:**
   ```bash
   docker-compose up --build -d
   ```
2. **Trigger the Prediction Pipeline (Integration Test):**
   ```bash
   curl -X POST http://localhost:5000/api/ai/trigger-pipeline
   ```
3. **View Dashboard:**
   Navigate to `http://localhost:80` and view the Spatial GIS Radar to observe predictions on the Leaflet map.

## How to Reproduce Research Experiments
The archived final results are stored in `results_final/` and `paper_results/`.
To completely reproduce the entire simulation pipeline from scratch:
1. Run `python generate_synthetic_epidemic_v2_1_final.py` to generate the 50 replications.
2. Run `python evaluation/phase4_final.py` to execute the full evaluation matrix.
3. Run `python evaluation/phase4_finalization.py` to run multi-source ablations.
4. Run `python evaluation/audit_episodes.py` to calculate exact warning episodes.
5. Run `python evaluation/generate_tables.py` and `evaluation/generate_figures.py`.

## Limitations
1. **Simulation Bounds:** The model fundamentally learns the causal couplings embedded in the SEIRS equations; translating this directly to real-world deployment requires fine-tuning on actual clinical registries.
2. **False Warning Burden:** Because outbreak onsets are exceptionally rare, optimizing the decision threshold to capture >50% of outbreaks (EDR 55.3%) mathematically enforces a high absolute number of false warning episodes (~1.00 False Warning Rate per episode). A threshold capable of 0 false alarms (0.978) reduces detection to 0%. 
3. **Geographic Heterogeneity Drift:** Due to structural variance across zones (Non-IID), collaborative federated learning only slightly outperformed localized learning, and both were substantially inferior to a fully Centralized repository.

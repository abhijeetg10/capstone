# 🏥 Privacy-Preserving AI & Federated Learning Disease Surveillance System

[![CI Build](https://github.com/abhijeetg10/capstone/actions/workflows/ci.yml/badge.svg)](https://github.com/abhijeetg10/capstone/actions/workflows/ci.yml)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js Express](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Python FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Flower Federated Learning](https://img.shields.io/badge/Federated%20Learning-Flower-FF6F00?logo=python&logoColor=white)](https://flower.ai/)
[![PostGIS Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-4169E1?logo=postgresql&logoColor=white)](https://postgis.net/)

An enterprise-grade, privacy-preserving epidemiological surveillance platform designed for real-time disease outbreak detection, geospatial analytics, AI prediction, and decentralized cross-hospital federated learning.

---

## 🌟 Key Features

- **🌐 Interactive Surveillance Dashboard**: Real-time epidemiological monitoring with Leaflet maps, hotspot clusters, time-series metrics, and analytical breakdown.
- **🔒 Privacy-Preserving Federated Learning**: Decentralized machine learning training via [Flower](https://flower.ai/), enabling multi-hospital collaboration without transferring patient sensitive health records.
- **🤖 Centralized AI Service**: High-performance FastAPI service hosting trained machine learning models (RandomForest, XGBoost) for disease prediction and anomaly detection.
- **🗺️ Geospatial Analytics (PostGIS)**: Spatial indexing and spatial query support for precise disease mapping, regional clustering, and outbreak radius calculation.
- **⚡ HIS / LIMS / PMS Integration**: Pre-built integration schemas for Hospital Information Systems, Laboratory Information Management Systems, and Pharmacy Management Systems.
- **🐳 One-Command Containerization**: Complete multi-container orchestration with Docker & Docker Compose.

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │    React + Vite Web UI    │ (Port 80)
                          └─────────────┬─────────────┘
                                        │ REST / GeoJSON
                                        ▼
                          ┌───────────────────────────┐
                          │   Node.js Express API     │ (Port 5000)
                          └──────┬──────────────┬─────┘
                                 │              │
                    SQL / PostGIS│              │ HTTP Proxy
                                 ▼              ▼
           ┌──────────────────────────┐   ┌──────────────────────────┐
           │ PostgreSQL + PostGIS DB  │   │  FastAPI AI Prediction   │
           └──────────────────────────┘   └──────────────────────────┘
                                                    (Port 8000)

                     ┌──────────────────────────────────┐
                     │     Flower FL Server (Port 8080) │
                     └────────────────┬─────────────────┘
                                      │ gRPC
                  ┌───────────────────┼───────────────────┐
                  ▼                   ▼                   ▼
          ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
          │ Hospital Edge │   │ Laboratory    │   │ Pharmacy Edge │
          │   Client 1    │   │ Edge Client   │   │    Client     │
          └───────────────┘   └───────────────┘   └───────────────┘
```

---

## 📁 Repository Structure

```
disease-surveillance-system/
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD Workflow for linting and build validation
├── ai-service/                   # FastAPI Central AI Prediction Microservice
│   ├── datasets/                 # Master epidemic dataset
│   ├── inference/                # Model inference routines
│   ├── models/                   # Machine learning models (Random Forest, XGBoost)
│   ├── preprocessing/            # Data transformation & encoding
│   ├── training/                 # Model training scripts
│   ├── Dockerfile                # Docker container specification
│   ├── main.py                   # FastAPI service entry point
│   └── requirements.txt          # Python dependencies
├── backend/                      # Node.js Express REST API
│   ├── src/
│   │   ├── config/               # Database connection config
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # Authentication & security
│   │   ├── routes/               # API endpoint definitions
│   │   └── app.js                # Express app entry point
│   ├── Dockerfile                # Docker container specification
│   └── package.json              # Node dependencies & scripts
├── database/                     # PostGIS Schema & Seeding
│   ├── schema/                   # DDL scripts for tables, indexes & functions
│   └── seeds/                    # Initial database seed datasets
├── flower-server/                # Federated Learning Aggregation Server
│   ├── Dockerfile                # Docker container specification
│   ├── requirements.txt          # Python FL dependencies
│   └── server.py                 # Flower server entry point
├── flower-clients/               # Edge Nodes (Local Training)
│   ├── hospital-client/          # Hospital edge training client & partitioned data
│   ├── laboratory-client/        # Lab edge training client
│   └── pharmacy-client/          # Pharmacy edge training client
├── frontend/                     # React 19 + Vite + Tailwind Web Application
│   ├── public/                   # Static web assets
│   ├── src/                      # UI Components, Leaflet Maps & Dashboards
│   ├── Dockerfile                # Multi-stage production Nginx Dockerfile
│   ├── nginx.conf                # Production SPA web server configuration
│   └── package.json              # Web dependencies
├── docker-compose.yml            # Multi-service Docker container orchestration
├── setup_datasets.py             # Dataset generation & Non-IID partitioning tool
├── .env.example                  # Environment variable configuration template
├── .gitignore                    # Git untracked file rules
└── README.md                     # Documentation
```

---

## 🚀 Quickstart with Docker Compose

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- [Git](https://git-scm.com/)

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/abhijeetg10/capstone.git
cd capstone
cp .env.example .env
```

### 2. Launch Containerized Services
```bash
docker-compose up --build -d
```

The services will start automatically on the following ports:

| Service | Protocol / URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | [http://localhost:80](http://localhost:80) | Interactive Dashboard UI |
| **Backend REST API** | [http://localhost:5000](http://localhost:5000) | Express Server API |
| **AI Prediction Service** | [http://localhost:8000/docs](http://localhost:8000/docs) | FastAPI Swagger UI |
| **Flower FL Aggregator** | `localhost:8080` | Federated Learning gRPC Port |
| **PostgreSQL / PostGIS** | `localhost:5432` | Geospatial Spatial Database |

---

## 🔬 Local Development Setup

### 1. Prepare Datasets & Edge Partitions
Run the cross-platform dataset setup script to generate non-IID hospital partitions:
```bash
python setup_datasets.py
```

### 2. Backend API Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Web Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. AI Prediction Service Setup
```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

### 5. Running Federated Learning Training
Start the central server:
```bash
python flower-server/server.py
```
In separate terminal instances, trigger hospital clients:
```bash
python flower-clients/hospital-client/client.py --hospital-id 1
python flower-clients/hospital-client/client.py --hospital-id 2
python flower-clients/hospital-client/client.py --hospital-id 3
```

---

## 📄 License
This project is licensed under the MIT License - see the repository details for more information.

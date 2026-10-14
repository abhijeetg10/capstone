import os
import subprocess

diagrams = {
    "system_architecture": """
graph TD
    subgraph Zone A
        HA[Hospital Data] --> FA[Feature Extractor]
        LA[Lab Data] --> FA
        PA[Pharmacy Data] --> FA
        WA[Weather Data] --> FA
        FA --> MLA[Local PyTorch MLP]
    end
    subgraph Zone B
        HB[Hospital Data] --> FB[Feature Extractor]
        LB[Lab Data] --> FB
        PB[Pharmacy Data] --> FB
        WB[Weather Data] --> FB
        FB --> MLB[Local PyTorch MLP]
    end
    subgraph Zones C, D, E
        ZC[Data Sources] --> FZ[Feature Extractor]
        FZ --> MLZ[Local PyTorch MLP]
    end
    MLA -.->|Model Gradients| Server[Flower FedAvg Server]
    MLB -.->|Model Gradients| Server
    MLZ -.->|Model Gradients| Server
    Server --> |Global Model Update| MLA
    Server --> |Global Model Update| MLB
    Server --> |Global Model Update| MLZ
    Server ==> Frozen[Frozen Global Model]
    Frozen --> FastAPI[FastAPI Inference Service]
    FastAPI <--> Node[Node.js Express Backend]
    Node <--> DB[(PostgreSQL / PostGIS)]
    Node <--> React[React GIS Dashboard]
    """,
    "use_case": """
usecase diagram
actor "Public Health Official" as PHO
actor "System Administrator" as Admin
actor "Flower Server" as FLServer
actor "Geographic Zone (Client)" as ZoneClient

PHO --> (View Geographic Risk Map)
PHO --> (View Surveillance Alerts)
PHO --> (Trigger Simulation Pipeline)

Admin --> (Start FL Rounds)
Admin --> (Monitor Backend Status)

FLServer --> (Aggregate Local Weights)
FLServer --> (Broadcast Global Model)

ZoneClient --> (Generate Feature Vector)
ZoneClient --> (Train Local MLP)
ZoneClient --> (Transmit Weights to FLServer)
    """,
    "class": """
classDiagram
    class ZoneClient {
        +String zone_id
        +MLP model
        +Tensor x_train
        +Tensor y_train
        +get_parameters()
        +set_parameters()
        +fit()
        +evaluate()
    }
    class MLP {
        +Sequential net
        +forward(x)
    }
    class FedAvgServer {
        +aggregate_fit()
        +aggregate_evaluate()
        +start_server()
    }
    class InferenceAPI {
        +load_artifacts()
        +predict_outbreak(OutbreakPredictionRequest)
    }
    class SyntheticGenerator {
        +run_simulation(seed, output_dir)
    }
    ZoneClient --> MLP : trains
    FedAvgServer "1" *-- "5" ZoneClient : orchestrates
    InferenceAPI --> MLP : serves
    SyntheticGenerator ..> ZoneClient : provides data
    """,
    "sequence": """
sequenceDiagram
    participant React Dashboard
    participant Node Backend
    participant FastAPI
    participant Frozen Global Model
    participant PostGIS DB

    React Dashboard->>Node Backend: POST /api/ai/trigger-pipeline
    Node Backend->>FastAPI: POST /predict-outbreak (zone_data)
    FastAPI->>Frozen Global Model: Forward pass (scaled_inputs)
    Frozen Global Model-->>FastAPI: outbreak_probability
    FastAPI-->>Node Backend: JSON (prob, risk_category)
    Node Backend->>PostGIS DB: INSERT INTO predictions
    PostGIS DB-->>Node Backend: Success
    Node Backend-->>React Dashboard: 200 OK (predictions)
    """,
    "activity": """
stateDiagram-v2
    [*] --> GenerateData
    GenerateData --> ChronologicalSplit
    ChronologicalSplit --> FitScalerOnTrain
    FitScalerOnTrain --> ScaleFeatures
    ScaleFeatures --> FLRoundBegin
    FLRoundBegin --> TrainLocalModels
    TrainLocalModels --> AggregateWeightsFedAvg
    AggregateWeightsFedAvg --> UpdateGlobalModel
    UpdateGlobalModel --> CheckRounds
    CheckRounds --> FLRoundBegin : Rounds < 10
    CheckRounds --> SaveFrozenModel : Rounds == 10
    SaveFrozenModel --> RunInference
    RunInference --> [*]
    """,
    "component": """
componentDiagram
    component "React UI Frontend" as UI
    component "Node.js Backend" as Backend
    component "FastAPI AI Service" as AI
    component "Flower FedAvg Server" as Server
    component "Flower Client (x5)" as Clients
    database "PostgreSQL/PostGIS" as DB

    UI <..> Backend : REST / HTTP
    Backend <..> AI : REST / HTTP
    Backend <..> DB : SQL / TCP
    Server <..> Clients : gRPC
    AI <..> Clients : Shares Frozen Model State
    """,
    "deployment": """
graph TD
    subgraph Docker Host
        frontend(disease_surveillance_frontend :80)
        backend(disease_surveillance_backend :5000)
        ai(disease_surveillance_ai :8000)
        flower(disease_surveillance_flower_server :8080)
        clientA(disease_surveillance_flower_client_a)
        db[(disease_surveillance_db :5432)]
    end
    frontend -.-> backend
    backend -.-> ai
    backend -.-> db
    clientA -.-> flower
    """,
    "dfd_level0": """
graph LR
    User([Public Health Authority])
    System[SAMVED HealthGrid System]
    Zone([Geographic Zones A-E])
    
    Zone -- Syndromic Data --> System
    System -- Risk Heatmap & Alerts --> User
    User -- Trigger Pipeline --> System
    """,
    "dfd_level1": """
graph TD
    Z([Zone Data Sources])
    P1((1. Generate Synthetic Data))
    P2((2. Local Feature Extraction))
    P3((3. Federated Training))
    P4((4. Global Inference))
    P5((5. PostGIS Storage))
    D1[(Zone CSV Files)]
    D2[(Global Frozen Model)]
    D3[(Predictions Database)]
    U([Dashboard User])

    Z --> P1
    P1 --> D1
    D1 --> P2
    P2 --> P3
    P3 --> D2
    D2 --> P4
    P4 --> P5
    P5 --> D3
    D3 --> U
    """,
    "er": """
erDiagram
    PREDICTIONS {
        int id PK
        varchar zone_id
        timestamp prediction_date
        float outbreak_probability
        varchar risk_category
        float hospital_cases
        float lab_pos_rate
        float pharm_sales_7d_mean
        float temperature
        timestamp created_at
    }
    HOSPITALS {
        int id PK
        varchar name
        decimal latitude
        decimal longitude
        geometry geom
    }
    HOSPITALS ||--o{ PREDICTIONS : "located in zone"
    """,
    "fl_workflow": """
graph TD
    Start([Initialize Global Model]) --> Bcast[Server Broadcasts Weights]
    Bcast --> C1[Zone A trains locally]
    Bcast --> C2[Zone B trains locally]
    Bcast --> C3[Zone C trains locally]
    C1 --> Send1[Send Gradients to Server]
    C2 --> Send2[Send Gradients to Server]
    C3 --> Send3[Send Gradients to Server]
    Send1 --> Agg[FedAvg Aggregation]
    Send2 --> Agg
    Send3 --> Agg
    Agg --> Check{Rounds > 10?}
    Check -->|No| Bcast
    Check -->|Yes| Freeze([Freeze Model])
    """,
    "seirs_workflow": """
graph TD
    Start([Initialize Population]) --> Weather[Generate Weather & Beta]
    Weather --> S[Susceptible]
    S --> |Infection| E[Exposed]
    E --> |Incubation| I[Infectious]
    I --> |Recovery| R[Recovered]
    R --> |Waning Immunity| S
    I --> Obs[Generate Observables]
    Obs --> H[Hospital Admissions via Multinomial Delay]
    Obs --> L[Laboratory Tests via Binomial Subsampling]
    Obs --> P[Pharmacy Sales via Moving Average Surge]
    I --> Outbreak[Target: Outbreak Onset Next 7 Days]
    """
}

# The component diagram syntax isn't natively supported exactly like that in older mermaid, so let's adjust it to standard graph if it fails, but standard graph is fine.
# We will use flowcharts for components and usecases as mermaid usecase isn't fully robust.
diagrams["use_case"] = """
graph LR
    actorPHO((Public Health Official))
    actorAdmin((System Administrator))
    actorFLServer((Flower Server))
    actorZoneClient((Zone Client))
    
    actorPHO --> UC1([View Geographic Risk Map])
    actorPHO --> UC2([View Surveillance Alerts])
    actorPHO --> UC3([Trigger Simulation Pipeline])
    
    actorAdmin --> UC4([Start FL Rounds])
    actorAdmin --> UC5([Monitor Backend Status])
    
    actorFLServer --> UC6([Aggregate Local Weights])
    actorFLServer --> UC7([Broadcast Global Model])
    
    actorZoneClient --> UC8([Generate Feature Vector])
    actorZoneClient --> UC9([Train Local MLP])
    actorZoneClient --> UC10([Transmit Weights to FLServer])
"""

diagrams["component"] = """
graph TD
    UI[React UI Frontend]
    Backend[Node.js Backend]
    AI[FastAPI AI Service]
    Server[Flower FedAvg Server]
    Clients[Flower Client x5]
    DB[(PostgreSQL / PostGIS)]

    UI <--> Backend
    Backend <--> AI
    Backend <--> DB
    Server <--> Clients
    AI -.-> Clients
"""

def generate_diagrams():
    os.makedirs('diagrams_output', exist_ok=True)
    for name, content in diagrams.items():
        with open(f'diagrams_output/{name}.mmd', 'w') as f:
            f.write(content.strip())
        
        # We will render them later via CLI or ignore if CLI fails.
        print(f"Generated {name}.mmd")

if __name__ == '__main__':
    generate_diagrams()

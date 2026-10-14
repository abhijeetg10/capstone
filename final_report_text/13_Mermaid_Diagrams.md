# MERMAID DIAGRAMS MASTER LIST
*(Note: These diagrams are also embedded within their respective chapters. They are compiled here for easy rendering/copying.)*

## Chapter 2 Diagrams

```mermaid
%% Figure 2.1: Root Cause Analysis
graph TD
    A[Symptom: Delayed Outbreak Response] --> B[Direct Cause: Municipal dashboards reflect lagging historical data]
    B --> C[Sub-cause: Exclusive reliance on confirmed laboratory cases]
    C --> D[Sub-cause: Failure to integrate early syndromic signals]
    D --> E[Root Cause: Strict privacy paradigms enforce data silos, preventing centralized early-warning correlation]
```

```mermaid
%% Figure 2.2: Why-Why Analysis
graph LR
    W1[Why are outbreaks detected late?] --> W2[Why is case reporting delayed?]
    W2 --> W3[Why rely only on lab results?]
    W3 --> W4[Why are early signals not pooled?]
    W4 --> W5[Why is centralization restricted?]
    
    W1 -.-> A1[Because we wait for confirmed case reports]
    W2 -.-> A2[Because lab processing and manual data entry take days]
    W3 -.-> A3[Because syndromic signals are scattered across private pharmacies and hospitals]
    W4 -.-> A4[Because pooling raw patient data violates privacy regulations]
    W5 -.-> A5[Root: Lack of a decentralized, federated machine learning architecture]
```

```mermaid
%% Figure 2.3: Stakeholder Interaction Diagram
graph TD
    Muni[Municipal Authority] -->|Requires Risk Alerts| Sys[SAMVED HealthGrid]
    Sys -->|Sends Global Parameters| Zones[Geographic Zones A-E]
    Zones -->|Returns Parameter Updates| Sys
    
    subgraph Zone Level
        Hosp[Hospitals] -->|Symptom Data| LocalDB[(Local Zone DB)]
        Lab[Laboratories] -->|Test Data| LocalDB
        Pharm[Pharmacies] -->|Sales Data| LocalDB
        LocalDB -->|Trains| LocalMLP[Local PyTorch MLP]
    end
```

```mermaid
%% Figure 2.4: Fishbone-style Cause Analysis
graph LR
    subgraph Technology
        T1[Disconnected EHR silos]
        T2[Lack of real-time APIs]
    end
    subgraph Data
        D1[Fragmented ownership]
        D2[Incompatible schemas]
    end
    subgraph Privacy
        P1[Fear of compliance breach]
        P2[Proprietary business data]
    end
    subgraph Process
        Pr1[Manual data entry]
        Pr2[Wait for clinical confirmation]
    end
    
    Technology --> Main((Delayed Outbreak Detection))
    Data --> Main
    Privacy --> Main
    Process --> Main
```

## Chapter 5 Diagrams

```mermaid
%% Figure 5.1: Overall System Architecture
graph TD
    subgraph Frontend
        Dashboard[React GIS Dashboard]
    end
    subgraph Backend Services
        NodeAPI[Node.js Express API]
        FastAPI[FastAPI Inference Service]
        DB[(PostgreSQL + PostGIS)]
    end
    subgraph Federated Learning Framework
        FlowerServer[Flower Aggregation Server]
    end
    subgraph Zone Clients
        ZoneA[Zone A Client + Local DB]
        ZoneB[Zone B Client + Local DB]
        ZoneC[Zone C Client + Local DB]
        ZoneD[Zone D Client + Local DB]
        ZoneE[Zone E Client + Local DB]
    end

    Dashboard <-->|REST API| NodeAPI
    NodeAPI <-->|Stores/Queries| DB
    NodeAPI -->|Sends Features| FastAPI
    FastAPI -.->|Reads| FrozenModel[(Global .pth Model)]
    FlowerServer -.->|Saves| FrozenModel
    
    ZoneA <-->|gRPC Parameters| FlowerServer
    ZoneB <-->|gRPC Parameters| FlowerServer
    ZoneC <-->|gRPC Parameters| FlowerServer
    ZoneD <-->|gRPC Parameters| FlowerServer
    ZoneE <-->|gRPC Parameters| FlowerServer
```

```mermaid
%% Figure 5.2: End-to-End System Workflow
graph TD
    Start([Start]) --> DataGen[Generate Synthetic SEIRS Data]
    DataGen --> Distribute[Distribute Data to Zones A-E]
    Distribute --> InitServer[Start Flower Server]
    InitServer --> ClientsStart[Start 5 Zone Clients]
    
    ClientsStart --> LocalTrain[Train Local PyTorch MLPs]
    LocalTrain --> SendWeights[Send Parameters to Server]
    SendWeights --> FedAvg[Execute FedAvg Algorithm]
    FedAvg --> Broadcast[Broadcast New Global Model]
    Broadcast --> Check{10 Rounds Complete?}
    
    Check -- No --> LocalTrain
    Check -- Yes --> SaveModel[Save Global .pth Checkpoint]
    
    SaveModel --> StartAPI[Start FastAPI & Node.js]
    StartAPI --> DashRequest[Dashboard Requests Prediction]
    DashRequest --> ServeInference[FastAPI Returns Probability]
    ServeInference --> RenderMap[Dashboard Updates GIS Map]
    RenderMap --> End([End])
```

```mermaid
%% Figure 5.3: Use Case Diagram
flowchart LR
    Admin((Municipal Admin))
    Doctor((Hospital Rep))
    Sys((Federated System))
    
    Admin -->|Views| Map(GIS Dashboard)
    Admin -->|Filters| Dates(Filter by Date)
    Admin -->|Receives| Alert(High Risk Alert)
    
    Doctor -->|Generates| Data(Local Syndromic Data)
    Data -.->|Trains| Local(Local Zone Model)
    Local -.->|Updates| Sys
    
    Sys -->|Aggregates| Global(Global Model)
    Global -->|Inferences| Map
```

```mermaid
%% Figure 5.4: Class Diagram
classDiagram
    class ZoneClient {
        +String zone_id
        +DataLoader train_loader
        +PyTorchMLP model
        +fit()
        +evaluate()
    }
    class PyTorchMLP {
        +Linear fc1
        +Linear fc2
        +Linear output
        +forward(x)
    }
    class FlowerServer {
        +Strategy strategy
        +aggregate_fit()
        +save_model()
    }
    class FastAPI {
        +predict_outbreak(features)
        -load_model()
    }
    class PredictionController {
        +savePrediction()
        +getZoneRisks()
    }
    
    ZoneClient --> PyTorchMLP : trains
    FlowerServer --> ZoneClient : coordinates
    FastAPI --> PyTorchMLP : loads
    PredictionController --> FastAPI : requests
```

```mermaid
%% Figure 5.5: Federated Training Sequence Diagram
sequenceDiagram
    participant S as Flower Server
    participant C1 as Zone A
    participant C2 as Zone B
    
    S->>C1: Initialize & Broadcast Weights
    S->>C2: Initialize & Broadcast Weights
    
    Note over C1,C2: Train locally on Private Data
    
    C1-->>S: Return Gradients/Weights
    C2-->>S: Return Gradients/Weights
    
    Note over S: Execute FedAvg Algorithm
    
    S->>C1: Broadcast Round 2 Weights
    S->>C2: Broadcast Round 2 Weights
```

```mermaid
%% Figure 5.6: Prediction and Alert Activity Diagram
flowchart TD
    Start([User opens Dashboard]) --> Fetch[Fetch latest zone data]
    Fetch --> Req[Send POST to FastAPI]
    Req --> Infer[Execute MLP Forward Pass]
    Infer --> Sigmoid[Apply Sigmoid]
    Sigmoid --> Threshold{Probability > 0.5?}
    
    Threshold -- Yes --> HighRisk[Mark Risk=High, Color=Red]
    Threshold -- No --> LowRisk[Mark Risk=Low, Color=Green]
    
    HighRisk --> DB[Store in PostGIS]
    LowRisk --> DB
    
    DB --> Map[Render on Leaflet]
    HighRisk --> Alert((Trigger Alert))
```

```mermaid
%% Figure 5.7: Component Diagram
flowchart TD
    subgraph Presentation Layer
        React[React Dashboard]
        Leaflet[Leaflet GIS Maps]
    end
    subgraph Business Logic Layer
        Express[Node.js Express API]
        FastAPI[FastAPI ML Service]
    end
    subgraph Data & AI Layer
        Flower[Flower Server]
        Clients[Zone Clients]
        PG[(PostGIS Database)]
    end
    
    React --> Express
    Express --> FastAPI
    Express --> PG
    Flower <--> Clients
    Flower -.->|Checkpoints| FastAPI
```

```mermaid
%% Figure 5.8: Deployment Diagram
flowchart TD
    node1[User Browser]
    node2[Docker Host]
    
    subgraph Docker Host
        C1[Container: Frontend UI]
        C2[Container: Node Backend]
        C3[Container: FastAPI]
        C4[Container: PostGIS DB]
        C5[Container: Flower Server]
        C6[Container: Zone Clients 1-5]
    end
    
    node1 -->|HTTP/80| C1
    C1 -->|REST/5000| C2
    C2 -->|REST/8000| C3
    C2 -->|TCP/5432| C4
    C6 -->|gRPC/8080| C5
```

```mermaid
%% Figure 5.9: Context-Level DFD
flowchart TD
    Admin[Municipal Admin] -->|Risk Query| Sys(SAMVED HealthGrid)
    Hosp[Zone Data Sources] -->|Syndromic Features| Sys
    Sys -->|GIS Heatmap & Alerts| Admin
```

```mermaid
%% Figure 5.10: Level 1 DFD
flowchart LR
    Source[Raw Zone Observables] --> P1(Feature Preprocessing)
    P1 -->|12 Features| P2(Local MLP Training)
    P2 -->|Parameters| P3(Federated Aggregation)
    P3 -->|Global Model| DB1[(Model Checkpoint)]
    
    DB1 --> P4(FastAPI Inference)
    Query[Dashboard Request] --> P5(Node.js API)
    P5 --> P4
    P4 -->|Probability| P5
    P5 -->|Insert GeoJSON| DB2[(PostGIS DB)]
    DB2 -->|Heatmap Data| Dashboard[React UI]
```

```mermaid
%% Figure 5.11: Federated Training Level 2 DFD
flowchart TD
    D1[(Local Zone A Data)] --> TrainA(Train PyTorch Model)
    D2[(Local Zone B Data)] --> TrainB(Train PyTorch Model)
    
    TrainA -->|Weight Matrix A| Fed(FedAvg Aggregator)
    TrainB -->|Weight Matrix B| Fed
    
    Fed -->|Weighted Average| Global[(Global Weights)]
    Global -->|Broadcast| TrainA
    Global -->|Broadcast| TrainB
```

```mermaid
%% Figure 5.12: Entity Relationship Diagram
erDiagram
    PREDICTIONS {
        uuid id PK
        varchar zone
        date prediction_date
        float probability
        varchar risk_level
        geometry geom
    }
    HOSPITAL_STATS {
        uuid id PK
        varchar zone
        date report_date
        int severe_symptoms
        int admissions
    }
    LABORATORY_STATS {
        uuid id PK
        varchar zone
        date report_date
        int total_tests
        int positive_cases
        float positivity_rate
    }
    PREDICTIONS ||--o{ HOSPITAL_STATS : correlates
```

## Chapter 6 Diagrams

```mermaid
%% Figure 6.1: SEIRS State-Transition Diagram
stateDiagram-v2
    [*] --> Susceptible
    Susceptible --> Exposed : Transmission (Beta)
    Exposed --> Infectious : Incubation (Sigma)
    Infectious --> Recovered : Recovery (Gamma)
    Recovered --> Susceptible : Waning Immunity
```

```mermaid
%% Figure 6.2: Synthetic Observable Generation Flow
flowchart LR
    Latent[Latent Infections] --> Hosp(Hospital Admission Delay)
    Latent --> Pharm(Pharmacy Immediate Spike)
    Latent --> Lab(Lab Processing Delay)
    Weather(Temperature/Humidity) --> Latent
    
    Hosp --> Features[12-Feature Tensor]
    Pharm --> Features
    Lab --> Features
    Weather --> Features
```

```mermaid
%% Figure 6.3: Federated Training Algorithm
flowchart TD
    S(Server: Broadcast Weights w_t) --> C1(Client 1: Local SGD)
    S --> C2(Client 2: Local SGD)
    
    C1 --> W1[Generate w^1_t+1]
    C2 --> W2[Generate w^2_t+1]
    
    W1 --> Fed(FedAvg Aggregation)
    W2 --> Fed
    Fed --> NewW[New Global w_t+1]
```

```mermaid
%% Figure 6.4: Prediction and Alert Logic
flowchart TD
    Input[12 Features] --> Scale[StandardScaler]
    Scale --> MLP[PyTorch Forward Pass]
    MLP --> Logit[Raw Logit Output]
    Logit --> Sig[Sigmoid Activation]
    Sig --> Prob[Probability 0 to 1]
    
    Prob --> Cond{> Threshold?}
    Cond -- Yes --> Alert[Trigger High Risk Red Polygon]
    Cond -- No --> Pass[Maintain Green Polygon]
```

## Chapter 8 Diagrams

```mermaid
%% Figure 8.1: Docker Deployment Architecture
flowchart TD
    subgraph Host Machine Environment
        subgraph Docker Network [Internal Bridge Network]
            DB[(PostgreSQL\nPostGIS)]
            Node[Node.js\nExpress API]
            FastAPI[FastAPI\nML Service]
            Flower[Flower\nFedAvg Server]
            Z1[Zone A\nClient]
            Z2[Zone B\nClient]
            Z3[Zone C\nClient]
            Z4[Zone D\nClient]
            Z5[Zone E\nClient]
            React[React\nDashboard]
        end
        
        Admin[Municipal Administrator]
        Admin <-->|HTTP Port 80| React
        React <-->|REST Port 5000| Node
        Node <-->|REST Port 8000| FastAPI
        Node <-->|TCP Port 5432| DB
        
        Z1 <-->|gRPC Port 8080| Flower
        Z2 <-->|gRPC Port 8080| Flower
        Z3 <-->|gRPC Port 8080| Flower
        Z4 <-->|gRPC Port 8080| Flower
        Z5 <-->|gRPC Port 8080| Flower
    end
```

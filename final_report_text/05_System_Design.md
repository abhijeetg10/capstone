# CHAPTER 5: SYSTEM DESIGN

## 5.1 System Architecture
The SAMVED HealthGrid architecture is intrinsically decentralized, designed specifically to address the privacy and scalability bottlenecks of traditional centralized surveillance. The system enforces strict data locality by operating across distinct layers:

1. **Data-Source Layer**: The generation layer where hospital, laboratory, pharmacy, and weather observables are instantiated.
2. **Zone-Client Layer**: The five non-IID geographic zones (Zones A to E) act as the primary compute nodes. Raw data remains perpetually isolated within this layer.
3. **Local Preprocessing and Training**: Each zone extracts the 12-dimensional feature vector, handles missing values, and trains a PyTorch Multi-Layer Perceptron (MLP) over local epochs using `BCEWithLogitsLoss`.
4. **Flower Communication**: The clients establish gRPC connections to the central Flower server to transmit the mathematical parameter updates (gradients/weights) of the neural network.
5. **FedAvg Server**: The Flower server executes the Federated Averaging algorithm, creating a new global model without ever inspecting the raw zone data, and broadcasts the updated model back to the clients.
6. **Global-Model Storage**: Post-training, the final `.pth` checkpoint is saved to disk for inference.
7. **FastAPI Inference**: A dedicated Python microservice exposes an endpoint that loads the frozen global model, standardizes incoming JSON payloads, and returns a Sigmoid probability.
8. **Express Backend**: A Node.js API acts as a gateway, intercepting predictions and executing geospatial queries.
9. **PostGIS Storage**: The PostgreSQL database stores the predictions alongside PostGIS `POINT` geometries corresponding to zone centroids.
10. **React & Leaflet GIS Dashboard**: The frontend queries the backend and visually renders color-coded polygons based on the risk category.
11. **Alert Flow**: If a zone crosses the critical risk threshold, the dashboard triggers a visual "High Risk" alert for immediate municipal intervention.

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
*(Figure 5.1: Overall System Architecture)*

## 5.2 Module-Level Design

Table 5.1: Module-Level Design
| Module | Input | Processing | Output |
| :--- | :--- | :--- | :--- |
| **SEIRS Generator** | Seed, Population, Days | Applies stochastic ODE transitions and observational delay matrices. | 5 Zone CSV files |
| **Zone FL Client** | Zone CSV, Global Weights | Partitions chronologically, scales features, executes PyTorch SGD. | Updated Local Weights |
| **Flower Server** | Local Weights from 5 Zones | Averages weights based on sample proportion (FedAvg). | Global Weights (.pth) |
| **FastAPI Inference** | 12-Feature JSON | Applies Standard Scaler, executes MLP forward pass, applies Sigmoid. | Outbreak Probability |
| **Node.js Gateway** | Client Requests | Validates payloads, executes PostGIS intersection/insertion queries. | JSON / GeoJSON |
| **React Dashboard** | GeoJSON Risk Data | Maps probabilities to colors, overlays on Leaflet maps. | Visual GIS Heatmap |

## 5.3 System Workflow

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
*(Figure 5.2: End-to-End System Workflow)*

## 5.4 UML Diagrams

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
*(Figure 5.3: Use Case Diagram)*

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
*(Figure 5.4: Class Diagram)*

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
*(Figure 5.5: Federated Training Sequence Diagram)*

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
*(Figure 5.6: Prediction and Alert Activity Diagram)*

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
*(Figure 5.7: Component Diagram)*

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
*(Figure 5.8: Deployment Diagram)*

## 5.5 Data Flow Diagrams

```mermaid
%% Figure 5.9: Context-Level DFD
flowchart TD
    Admin[Municipal Admin] -->|Risk Query| Sys(SAMVED HealthGrid)
    Hosp[Zone Data Sources] -->|Syndromic Features| Sys
    Sys -->|GIS Heatmap & Alerts| Admin
```
*(Figure 5.9: Context-Level DFD)*

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
*(Figure 5.10: Level 1 DFD)*

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
*(Figure 5.11: Federated Training Level 2 DFD)*

## 5.6 Database Design
The system utilizes PostgreSQL heavily extended with PostGIS to execute spatial queries mapping probabilities to precise geographic areas. The design employs a standard relational structure.

**Key Entities:**
- **predictions**: Stores the primary AI inference results including the probability, computed risk level, and PostGIS geometry.
- **hospital_stats / laboratory_stats / pharmacy_stats**: Store the raw generated observables before they are aggregated into the 12-feature tensor.
- **weather_data**: Stores regional meteorological signals.

**PostGIS Geometry:** The `predictions` table contains a `geom` column using `geometry(Point, 4326)`. This allows the React dashboard to request risk levels by spatial bounding box rather than just text identifiers.

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
*(Figure 5.12: Entity Relationship Diagram)*

Table 5.2: Database Data Dictionary (Excerpt - predictions table)
| Field | Data Type | Key | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique prediction record identifier. |
| `zone` | VARCHAR(50) | Indexed | The municipal zone identifier (e.g., 'Zone A'). |
| `prediction_date` | DATE | Indexed | The chronological date of the prediction. |
| `probability` | FLOAT | None | The Sigmoid output (0.0 to 1.0) from the PyTorch MLP. |
| `risk_level` | VARCHAR(20) | None | Mapped category ('Low', 'Medium', 'High'). |
| `geom` | GEOMETRY(Point, 4326) | Spatial Index | PostGIS spatial coordinates for Leaflet rendering. |

### Chapter Summary
This chapter laid out the foundational architecture of the SAMVED HealthGrid, demonstrating how decentralized computing interfaces with modern web standards. Detailed UML models (Use Case, Sequence, Class, Component) explicitly documented the data separation enforced between the Zone Clients and the Flower Server. Data Flow Diagrams mapped the transformation of raw SEIRS data into geospatial heatmaps, and the PostGIS schema solidified the system's ability to render predictive alerts geographically.

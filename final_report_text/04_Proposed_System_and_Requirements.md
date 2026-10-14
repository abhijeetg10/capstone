# CHAPTER 4: PROPOSED SYSTEM AND REQUIREMENTS

## 4.1 Proposed Solution
SAMVED HealthGrid is a simulation-based proof of concept that uses data-local geographic Federated Learning for multi-source syndromic surveillance and early outbreak-risk prediction. The proposed solution decentralizes the computational workload and entirely bypasses the need for municipal authorities to centrally pool raw, identifiable, or proprietary institutional data. By processing simulated real-time data ingestion streams (hospital symptoms, laboratory tests, pharmacy sales, and local weather) locally within five distinct geographic zones, the system extracts critical predictive features. Only the mathematical parameters of the locally trained PyTorch neural networks are transmitted to a central aggregator. This architecture yields a global predictive model capable of rendering a zone-level GIS risk heatmap, empowering proactive municipal responses without compromising institutional data sovereignty.

## 4.2 Proposed Methodology
The implementation follows a rigorous, sequential methodology designed to ensure strict scientific evaluation of the federated architecture:
1. **Generate Synthetic Timelines**: Utilize a stochastic SEIRS generator to create epidemiologically consistent transmission curves over a 1,095-day horizon.
2. **Create Observables**: Apply statistical delay mechanisms (e.g., multinomial distributions for hospital admissions, moving averages for pharmacy spikes) to generate noisy, realistic observables.
3. **Zone Partitioning**: Assign the generated data non-uniformly across five geographic zones (Zones A to E) to purposefully simulate non-IID (non-independent and identically distributed) municipal reporting structures.
4. **Feature Construction**: Generate 12 time-aware rolling features at the zone level.
5. **Chronological Splitting**: Strictly partition the timelines into Train, Validation, and Test datasets chronologically to absolutely prevent temporal data leakage.
6. **Local Training**: Train PyTorch Multi-Layer Perceptrons (MLPs) locally at each zone using `BCEWithLogitsLoss`.
7. **Federated Aggregation**: Utilize the Flower framework to aggregate the locally updated model parameters via the FedAvg algorithm over multiple communication rounds.
8. **Global Evaluation**: Evaluate the frozen global model on the locked testing split to extract PR-AUC, Event Detection Rate, and False Warning metrics.
9. **Inference Serving**: Deploy the frozen global model inside a FastAPI service to handle real-time prediction requests.
10. **Storage**: Intercept the predictions via a Node.js/Express backend and store them in a PostGIS-enabled PostgreSQL database with spatial geometries.
11. **Visualization**: Query the backend via a React dashboard to display zone-level risk polygons over a Leaflet GIS map.
12. **Alert Generation**: Generate visual early-warning alerts for zones crossing the designated high-risk threshold.

## 4.3 Functional Requirements
The system must satisfy the following verifiable functional requirements:
- **FR-01 (Data Generation)**: The system shall programmatically generate stochastic SEIRS timelines mapping to hospital, laboratory, pharmacy, and weather schemas.
- **FR-02 (Feature Preprocessing)**: The system shall convert raw observables into 12 normalized, rolling-window features locally within the zone.
- **FR-03 (Zone Partitioning)**: The system shall partition data uniquely into five geographic FL clients.
- **FR-04 (Local Training)**: The zone client shall perform local neural network training over specified local epochs and batch sizes.
- **FR-05 (Federated Aggregation)**: The central server shall orchestrate minimum 10 rounds of Federated Averaging (FedAvg).
- **FR-06 (Global-Model Storage)**: The server shall serialize and save the final aggregated model parameters as a `.pth` checkpoint.
- **FR-07 (Inference)**: The AI service shall load the frozen model and perform forward-pass inference on incoming vectors.
- **FR-08 (API Validation)**: The backend shall validate the structural integrity of incoming JSON inference payloads.
- **FR-09 (Risk Categorization)**: The system shall map probability logits into discrete risk categories using a predefined threshold (e.g., Low, Medium, High).
- **FR-10 (Alert Generation)**: The frontend shall visually flag zones that cross the critical threshold as requiring immediate intervention.
- **FR-11 (PostGIS Storage)**: The database shall store predictions mapped to accurate geospatial polygon coordinates.
- **FR-12 (GIS Visualization)**: The dashboard shall render a choropleth map coloring zones dynamically based on recent risk predictions.
- **FR-13 (Filters)**: The dashboard shall allow users to filter historical risks by date ranges.
- **FR-14 (Metrics Display)**: The dashboard shall display zone-specific syndromic trends alongside the risk probability.
- **FR-15 (Docker Startup)**: The entire microservice architecture shall bootstrap automatically via a single `docker-compose` command.

## 4.4 Non-Functional Requirements
- **NFR-01 (Reproducibility)**: The data generation and evaluation pipelines must enforce locked random seeds to ensure experimental results are scientifically verifiable.
- **NFR-02 (Data Locality)**: Raw hospital, lab, and pharmacy data MUST remain completely isolated within the zone client container; only model parameters are permitted to traverse the network.
- **NFR-03 (Reliability)**: The Flower server must gracefully handle connection timeouts and wait for the requisite minimum number of clients before initiating an aggregation round.
- **NFR-04 (Maintainability)**: The codebase must separate the research evaluation track from the production inference track to ensure modular updates.
- **NFR-05 (Scalability)**: The Node.js backend must utilize asynchronous non-blocking I/O to handle concurrent requests from multiple municipal viewers.
- **NFR-06 (Performance)**: The API prediction service must return inference results in under 500 milliseconds to guarantee a responsive dashboard experience.
- **NFR-07 (Usability)**: The React GIS dashboard must be intuitive for non-technical public health administrators, using clear color-coding (Green/Yellow/Red).
- **NFR-08 (Portability)**: The system must execute seamlessly on any host operating system supporting Docker Engine.
- **NFR-09 (Observability)**: All microservices must output standard-out logs for debugging orchestration failures.
- **NFR-10 (Security)**: The database must be isolated within the internal Docker network and inaccessible directly from the host machine except via authorized exposed ports.
- **NFR-11 (Documentation)**: The repository must contain comprehensive README instructions for environment setup and simulation execution.

## 4.5 System Modules
1. **Synthetic-Data Module**: A Python-based simulation engine that executes mathematical SEIRS state-transitions to generate statistically sound multi-source epidemiological data.
2. **Federated Node Module**: The Flower client script that loads zone-specific subsets, executes the local PyTorch training loop, and manages gRPC communication with the server.
3. **Aggregation Server Module**: The Flower server script that awaits client connections, broadcasts weights, executes the FedAvg algorithm, and saves the final global state.
4. **AI Inference Module**: A FastAPI web service that wraps the frozen PyTorch model, accepts HTTP POST requests containing 12-feature arrays, applies the standard scaler, and returns Sigmoid probabilities.
5. **Node.js Integration Module**: An Express.js backend that acts as the primary gateway, orchestrating data between the frontend dashboard, the PostGIS database, and the AI Inference module.
6. **Spatial Database Module**: A PostgreSQL instance enhanced with PostGIS, responsible for securely persisting time-series predictions and executing geometric intersection queries.
7. **GIS Frontend Module**: A React Single Page Application utilizing Leaflet to visually overlay prediction metrics onto an interactive municipal map.

## 4.6 Significance
1. **Technical Significance**: Demonstrates the integration of gRPC-based federated frameworks with standard RESTful web architectures and spatial databases.
2. **Social Significance**: Provides a theoretical blueprint for predicting outbreaks early enough to implement community-saving interventions without infringing on citizen privacy.
3. **Industrial Significance**: Showcases how municipal governments could leverage existing disconnected healthcare IT infrastructure without requiring expensive centralized data lakes.
4. **Educational Significance**: Acts as a comprehensive final-year showcase merging data science, backend engineering, DevOps, and frontend design into a singular cohesive repository.
5. **Economic Significance**: Early outbreak detection drastically reduces the ultimate cost of pandemic response by preventing the necessity for widespread economic lockdowns.

## 4.7 Deployment Requirements

Table 4.1: Minimum Hardware Requirements
| Component | Requirement | Justification |
| :--- | :--- | :--- |
| Processor | 4 Cores (x86_64 or ARM) | Required to run 5 local training clients concurrently. |
| RAM | 8 GB Minimum | Docker overhead for PostgreSQL, Node, FastAPI, and Flower. |
| Storage | 10 GB Free Space | Container image layers and generated synthetic CSV datasets. |

Table 4.2: Software Requirements
| Component | Version | Purpose |
| :--- | :--- | :--- |
| Operating System | Windows 11 / Linux / macOS | Host OS. |
| Containerization | Docker Engine 24+ | Microservice orchestration and isolation. |
| Backend Runtime | Node.js 20 LTS | Execution environment for the Express gateway. |
| Data Science Runtime | Python 3.10 | Execution environment for PyTorch and Flower. |

## 4.9 Cost Estimation
The system is constructed entirely on open-source frameworks.

1. **Current proof-of-concept cost**: ₹0. Development, testing, and containerized deployment were executed on existing academic hardware. No paid APIs or proprietary software licenses were utilized.
2. **Existing hardware cost**: N/A (Leveraged student-owned laptops).
3. **Electricity and internet assumptions**: Negligible academic usage.
4. **Optional cloud cost**: If deployed for a live demonstration via AWS (e.g., an EC2 t3.medium instance and RDS PostgreSQL), estimated operational costs would be roughly ₹3,000 per month.
5. **Potential municipal pilot cost categories**: A future live implementation by a municipality would incur costs for:
   - HIPAA-compliant cloud hosting.
   - Integration engineers to build extraction scripts from hospital EHR systems.
   - Routine data audits and server maintenance.

## 4.10 Project Deliverables
The verified deliverables for this project include:
1. The complete, version-controlled GitHub repository containing all source code for the data generators, ML clients, server, backend, and frontend.
2. A unified `docker-compose.yml` defining the multi-container architecture.
3. Locked, verifiable CSV metrics files (`results_final`) documenting the evaluation outputs.
4. The trained frozen PyTorch model checkpoint.
5. This comprehensive final academic project report.

### Chapter Summary
This chapter defined the proposed solution as a fully decentralized, simulation-based Federated Learning prototype. It outlined rigorous functional requirements spanning data generation to GIS visualization, ensuring that data locality (privacy) and chronological reproducibility form the core non-functional constraints. The chapter detailed the distinct modules, highlighted the project's multifaceted significance, and established the open-source software and hardware prerequisites necessary to deploy the proof of concept.

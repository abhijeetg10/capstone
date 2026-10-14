# CHAPTER 7: TESTING AND VALIDATION

## 7.1 Testing Strategy
The testing methodology for SAMVED HealthGrid is fundamentally bifurcated into two tracks: Machine Learning (ML) validation and Software Integration testing. The ML validation strictly focuses on ensuring the mathematical integrity of the neural network and preventing temporal data leakage, which is fatal in time-series forecasting. The Software Integration testing focuses on ensuring the Dockerized microservices (Node, FastAPI, Flower, PostGIS) communicate flawlessly and fail gracefully.

## 7.2 Testing Techniques
1. **Unit Testing**: Isolated testing of core functions, particularly the SEIRS generation mathematical bounds and the PyTorch MLP dimensional outputs.
2. **Integration Testing**: Verifying the gRPC handshake between the Zone Clients and the Flower Server, as well as the REST handshake between Node.js and FastAPI.
3. **System Testing**: Executing the `docker-compose up` flow to verify the entire system bootstraps from zero state.
4. **API Testing**: Stress-testing the inference endpoint with varied JSON payloads to ensure the StandardScaler does not crash on edge cases.
5. **Temporal-Leakage Testing**: Auditing the array-splitting logic to guarantee the test set strictly contains future dates inaccessible during training.
6. **Performance Testing**: Measuring execution times for federated rounds and API responses.
7. **Security Testing**: Enforcing the architectural boundary that prevents raw CSV data from leaving the Zone Client container.
8. **Reproducibility Testing**: Executing the evaluation script repeatedly with locked seeds (e.g., Seed 1010) to ensure the PR-AUC metric remains identical to the decimal across runs.

## 7.3 Test Environment

Table 7.1: Test Environment
| Parameter | Specification |
| :--- | :--- |
| **Operating System** | Windows 11 / WSL2 |
| **Container Engine** | Docker Engine 24+ |
| **Hardware** | 16GB RAM, 8-Core CPU (Simulating 5 Clients) |
| **ML Framework** | PyTorch 2.0+ (CPU Mode) |
| **Federated Framework**| Flower 1.5.0 |
| **Backend Runtime** | Node.js 20 LTS |

## 7.4 Test Cases

Table 7.2: System Test Cases
| Test Case ID | Module | Input | Precondition | Expected Output | Actual Output | Status | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Data Gen | `N=100000`, `days=1095` | Valid arguments | S+E+I+R == N exactly | Conservation holds | Passed | Validates SEIRS math |
| TC-02 | Data Gen | Edge probabilities | Extreme parameters | No negative state values | All states >= 0 | Passed | Prevents logic crashes |
| TC-03 | Data Gen | `seed=42` | Run twice | Identical generated CSVs | CSVs match | Passed | Reproducibility confirmed |
| TC-04 | Data Gen | `seed=43` | Run alongside `seed=42` | Different epidemic waves | Curves differ | Passed | Stochasticity confirmed |
| TC-05 | Preprocess | `null` temp value | Raw data contains gaps | Imputation applies mean | Handled | Passed | Feature scaling safe |
| TC-06 | Preprocess | Empty Zone CSV | Simulate missing zone | Graceful exception | Threw exception | Passed | Prevents NaN weights |
| TC-07 | Splitting | 1095 days array | Train/Val/Test logic | Train: 0-765, Test: 931-1094 | Strict chronological slice | Passed | Essential ML integrity |
| TC-08 | Leakage | Target horizon | 7-day future target | Target built only from future | Confirmed | Passed | Prevents temporal cheat |
| TC-09 | Scaling | Fit logic | Train set only | Scaler fits only Train set | Confirmed | Passed | Prevents look-ahead bias |
| TC-10 | Features | Schema order | 12 features | Output tensor exactly 12 dim | Shape `[N, 12]` | Passed | Matches model `fc1` |
| TC-11 | Local MLP | Tensor `[32, 12]` | Forward pass | Output tensor `[32, 1]` | `[32, 1]` logit | Passed | Correct architecture |
| TC-12 | Local MLP | `loss.backward()` | Single local epoch | Parameters change value | Gradients updated | Passed | Confirms learning |
| TC-13 | Flower | `docker-compose up`| 5 clients run | Server logs 5 connections | 5 clients registered | Passed | gRPC network valid |
| TC-14 | Flower | 10 rounds config | All clients active | 10 rounds complete successfully| Finished 10 rounds | Passed | Federated loop valid |
| TC-15 | Flower | 4 clients active | Server requires 5 | Server waits for 5th client | Waited indefinitely | Passed | Configuration holds |
| TC-16 | Flower | End of Round 10 | Training finishes | `.pth` file written to disk | Checkpoint saved | Passed | Essential for API |
| TC-17 | FastAPI | App startup | `.pth` exists | Model loads without errors | Loaded successfully | Passed | Weights deserialized |
| TC-18 | FastAPI | Valid 12-feature JSON | Valid request | Returns float `[0, 1]` | Returns `0.85` | Passed | End-to-end inference |
| TC-19 | FastAPI | 11-feature JSON | Invalid request | HTTP 422 Unprocessable | HTTP 422 | Passed | FastAPI validation |
| TC-20 | Express | `POST /predict` | DB accessible | Request succeeds | Success | Passed | Backend routing |
| TC-21 | PostGIS | GeoJSON data | DB up | Record inserted with GEOM | Inserted | Passed | Spatial storage |
| TC-22 | React UI | `GET /zones` | Data exists | JSON payload received | Received | Passed | Dashboard integration |
| TC-23 | Alerting | Probability > 0.5 | Mapped threshold | UI element turns Red | Flagged Red | Passed | Visual early warning |
| TC-24 | Docker | Initial build | Clean environment | All containers healthy | Healthy state | Passed | Orchestration |
| TC-25 | Privacy | Network tap | During FedAvg round | No CSV data transmitted | Only tensors sent | Passed | Core NFR validated |

## 7.5 Unit Testing
Unit testing primarily validated the complex stochastic transition matrices inside the SEIRS generator to ensure that individuals logically moved from Susceptible to Exposed without violating population conservation rules. 

## 7.6 Integration Testing
Integration testing verified the API boundaries, particularly ensuring that the `StandardScaler` applied by the FastAPI inference service correctly normalized the incoming React JSON payload to exactly match the scale of the original PyTorch training data. 

## 7.7 System Testing
System testing involved standing up the entire infrastructure using `docker-compose`. This successfully validated that the Node.js API could insert PostGIS records while the Flower server concurrently executed FedAvg rounds with the background zone clients.

## 7.8 User Acceptance Testing
Formal User Acceptance Testing (UAT) with active municipal health officers was not completed, as this is a simulation-based proof of concept utilizing synthetic data. However, a proposed UAT plan requires municipal administrators to navigate the GIS dashboard and successfully identify "High Risk" zones based on the color-coded Leaflet polygons without requiring deep technical knowledge.

## 7.9 Performance Testing
Federated training across 5 simulated zones (10 rounds, 1 local epoch per round) completes locally in under three minutes. This is primarily due to the highly efficient PyTorch MLP architecture containing only 2,945 trainable parameters, ensuring rapid gradient calculation. The FastAPI inference endpoint evaluates incoming JSON payloads strictly under 200 milliseconds, easily satisfying the requirements for a real-time visualization dashboard.

## 7.10 Security Testing
Security testing verified the application of standard web safeguards:
1. **Input Validation**: FastAPI automatically rejects malformed schemas (TC-19) preventing backend crashes.
2. **SQL Injection Checks**: The Express API utilizes parameterized database queries (`$1, $2`) to prevent injection.
3. **CORS**: Cross-Origin Resource Sharing is strictly configured to only allow frontend dashboard requests.
4. **Raw-Data Boundary**: Manual inspection of network payloads confirms that Zone Clients transfer only NumPy ndarrays (model weights) over gRPC, ensuring no raw CSV hospital data leaves the container.
5. **Remaining Risk**: The system acknowledges that without Secure Aggregation or Differential Privacy, advanced model inversion attacks on the transmitted gradients remain a theoretical vulnerability.

### Chapter Summary
This chapter detailed a rigorous, 25-point test matrix covering mathematical model integrity, temporal data leakage prevention, API error handling, and Docker orchestration. The testing confirmed that the system functions flawlessly across all integration points and successfully upholds the primary non-functional privacy constraint: keeping raw data local.

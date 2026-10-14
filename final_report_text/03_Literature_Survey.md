# CHAPTER 3: LITERATURE SURVEY AND EXISTING SYSTEMS

The development of SAMVED HealthGrid requires a synthesis of multiple advanced domains: distributed machine learning, epidemiological modelling, syndromic surveillance, and geospatial visualization. This chapter critically evaluates 24 foundational and recent research works that form the theoretical and technological backbone of this project.

## 3.1 Literature Survey

### 3.1.1 Federated Learning and Distributed Machine Learning
**[1] H. B. McMahan, E. Moore, D. Ramage, S. Hampson, and B. A. y Arcas, "Communication-Efficient Learning of Deep Networks from Decentralized Data," in Proceedings of the 20th International Conference on Artificial Intelligence and Statistics, 2017.**
- **Objective:** To introduce a decentralized machine learning approach that protects raw data privacy.
- **Dataset/Source:** Image classification (MNIST/CIFAR) and text prediction datasets.
- **Method:** Introduced the Federated Averaging (FedAvg) algorithm, which aggregates locally computed model parameter updates rather than centralizing data.
- **Model:** Deep neural networks and Convolutional Neural Networks.
- **Main Result:** FedAvg converges efficiently with significantly reduced communication overhead compared to synchronized gradient descent.
- **Advantages:** Protects raw data on client devices; robust to unbalanced data sizes.
- **Limitations:** Struggles severely when the data distribution across clients is highly non-IID (non-independent and identically distributed).
- **Relevance to Project:** This is the foundational paper for the SAMVED HealthGrid architecture. The project explicitly uses FedAvg to aggregate Zone MLP parameters without transferring hospital data.

**[2] Q. Yang, Y. Liu, T. Chen, and Y. Tong, "Federated Machine Learning: Concept and Applications," ACM Transactions on Intelligent Systems and Technology, vol. 10, no. 2, pp. 1-19, 2019.**
- **Objective:** To define a comprehensive taxonomy of Federated Learning (Horizontal, Vertical, and Federated Transfer Learning).
- **Dataset/Source:** Theoretical overview across enterprise and mobile domains.
- **Method:** Architectural classification.
- **Main Result:** Established the industry-standard definitions of horizontal and vertical data partitioning.
- **Advantages:** Provides a clear legal and architectural framework for federated systems.
- **Limitations:** Purely theoretical; does not provide optimization algorithms.
- **Relevance to Project:** Validates the project’s design as a "Horizontal Federated Learning" system, where multiple geographic zones share the same feature schema (12 syndromic signals) but possess entirely different sample spaces.

**[3] P. Kairouz et al., "Advances and Open Problems in Federated Learning," Foundations and Trends® in Machine Learning, vol. 14, no. 1–2, pp. 1-210, 2021.**
- **Objective:** To exhaustively map the open research challenges in Federated Learning.
- **Dataset/Source:** Broad literature review.
- **Method:** Systematic review of systems, privacy, robustness, and fairness in FL.
- **Main Result:** Identified statistical heterogeneity (non-IID data) and system heterogeneity as the primary blockers for production FL.
- **Advantages:** The most comprehensive FL guide available.
- **Limitations:** Focuses heavily on massive cross-device networks rather than small cross-silo networks.
- **Relevance to Project:** Justifies why SAMVED HealthGrid experiences performance degradation (low PR-AUC) when zones are strictly non-IID compared to centralized training.

**[4] T. Li, A. K. Sahu, A. Talwalkar, and V. Smith, "Federated Optimization in Heterogeneous Networks," Proceedings of Machine Learning and Systems, vol. 2, pp. 429-450, 2020.**
- **Objective:** To solve the convergence issues of FedAvg on highly heterogeneous networks.
- **Method:** Proposed the FedProx algorithm, which adds a proximal term to the local objective function to restrict local updates from drifting too far from the global model.
- **Main Result:** FedProx guarantees more stable convergence under non-IID conditions than FedAvg.
- **Advantages:** Directly addresses statistical heterogeneity.
- **Limitations:** The proximal term requires careful hyperparameter tuning.
- **Relevance to Project:** While SAMVED HealthGrid implements FedAvg for the baseline proof of concept, FedProx is identified in the Future Scope (Chapter 10) as the necessary next step to handle non-IID municipal zones.

**[5] Y. Zhao, M. Li, L. Lai, N. Suda, D. Civin, and V. Chandra, "Federated Learning with Non-IID Data," arXiv preprint arXiv:1806.00582, 2018.**
- **Objective:** To quantify the accuracy drop of FedAvg on non-IID data.
- **Method:** Mathematical proof bounding the weight divergence. Proposed sharing a small global subset of data to bridge the gap.
- **Main Result:** Accuracy drops by up to 11% on non-IID neural networks.
- **Relevance to Project:** Directly explains the performance gap observed in SAMVED HealthGrid between the centralized evaluation baseline and the federated evaluation metrics.

### 3.1.2 Federated Learning in Healthcare and Privacy Risks
**[6] N. Rieke et al., "The future of digital health with Federated Learning," npj Digital Medicine, vol. 3, no. 119, 2020.**
- **Objective:** To explore how FL can overcome healthcare data silos.
- **Main Result:** Concluded that cross-silo FL is essential for training robust medical models without violating privacy regulations like HIPAA and GDPR.
- **Relevance to Project:** Validates the core motivation of SAMVED HealthGrid: replacing data-sharing with model-sharing among municipal hospitals.

**[7] K. A. Bonawitz et al., "Practical Secure Aggregation for Privacy-Preserving Machine Learning," in Proceedings of the 2017 ACM SIGSAC Conference, 2017.**
- **Objective:** To prevent the server from inspecting individual client updates.
- **Method:** Cryptographic secure multi-party computation (MPC).
- **Relevance to Project:** Secure Aggregation is explicitly marked as "Excluded Scope" in this prototype. This paper is cited to accurately define what the project lacks regarding formal cryptographic privacy guarantees.

**[8] R. Shokri and V. Shmatikov, "Privacy-Preserving Deep Learning," in Proceedings of the 22nd ACM SIGSAC Conference, 2015.**
- **Objective:** To evaluate if parameter sharing leaks information.
- **Main Result:** Proved that sharing gradients can inadvertently memorize and leak training data.
- **Relevance to Project:** Reminds the administration that data-locality does not guarantee absolute privacy, hence the limitation section in Chapter 9.

**[9] C. Dwork, "Differential Privacy," in Automata, Languages and Programming, 2006.**
- **Objective:** To provide a mathematical definition for privacy loss.
- **Method:** Adding calibrated noise to statistical queries.
- **Relevance to Project:** Differential Privacy is excluded from this simulation but remains a critical future requirement for production deployment.

**[10] B. Hitaj, G. Ateniese, and F. Perez-Cruz, "Deep Models Under the GAN: Information Leakage from Collaborative Deep Learning," in Proceedings of the 2017 ACM SIGSAC Conference, 2017.**
- **Objective:** To demonstrate privacy attacks on distributed learning.
- **Method:** Using Generative Adversarial Networks to recreate private client data from shared gradients.
- **Relevance to Project:** Justifies the strict scientific positioning that SAMVED HealthGrid is a "proof of concept" and does not claim "guaranteed privacy."

### 3.1.3 Syndromic Surveillance and Early Warning Systems
**[11] M. M. Wagner et al., "The emerging science of very early detection of disease outbreaks," Journal of Public Health Management and Practice, vol. 7, no. 6, pp. 51-59, 2001.**
- **Objective:** To define syndromic surveillance as a distinct scientific discipline.
- **Main Result:** Established that non-clinical data (OTC sales, absenteeism) precedes clinical diagnosis by significant margins.
- **Relevance to Project:** Provides the fundamental epidemiological justification for combining hospital admissions with pharmacy sales and weather data.

**[12] K. D. Mandl et al., "Implementing syndromic surveillance: a practical guide informed by the early experience," Journal of the American Medical Informatics Association, vol. 11, no. 2, pp. 141-150, 2004.**
- **Objective:** To provide a framework for designing surveillance systems.
- **Main Result:** Highlighted the massive operational burden of "false alarms" when optimizing for high sensitivity.
- **Relevance to Project:** This paper is crucial. It validates the findings in Chapter 9, explaining why SAMVED HealthGrid suffers from a 98% False Warning Rate when thresholds are aggressively lowered.

**[13] J. S. Brownstein, C. C. Freifeld, and L. C. Madoff, "Digital disease detection — harnessing the Web for public health surveillance," New England Journal of Medicine, vol. 360, no. 21, pp. 2153-2157, 2009.**
- **Objective:** To evaluate non-traditional digital signals for surveillance.
- **Relevance to Project:** Justifies the use of multi-source signals outside of the strict laboratory confirmation loop.

**[14] D. L. Buckeridge, "Outbreak detection through automated surveillance: A review of the determinants of detection," Journal of Biomedical Informatics, vol. 40, no. 4, pp. 370-379, 2007.**
- **Objective:** To evaluate the mathematical determinants of outbreak detection.
- **Method:** Simulation environments and baseline thresholding.
- **Relevance to Project:** Validates the use of synthetic simulation and chronological horizon splitting for rigorously evaluating detection lead time.

### 3.1.4 Epidemiological Modeling (SEIRS)
**[15] R. M. Anderson and R. M. May, "Infectious Diseases of Humans: Dynamics and Control," Oxford University Press, 1991.**
- **Objective:** To define the foundational mathematics of infectious disease transmission.
- **Method:** Ordinary Differential Equations (ODEs) for SIR and SEIR models.
- **Relevance to Project:** The underlying logic of the `generate_synthetic_epidemic.py` script relies heavily on these foundational deterministic models.

**[16] M. J. Keeling and P. Rohani, "Modeling Infectious Diseases in Humans and Animals," Princeton University Press, 2008.**
- **Objective:** To expand deterministic models into stochastic and spatial networks.
- **Method:** Stochastic continuous-time models.
- **Relevance to Project:** The data generator for SAMVED HealthGrid utilizes stochastic transitions (Binomial/Poisson processes) to simulate noisy, realistic epidemic waves rather than smooth ODE curves.

### 3.1.5 Official Public Health Frameworks
**[17] T. R. Frieden, "Evidence for Health Decision Making — Beyond Randomized, Controlled Trials," New England Journal of Medicine, vol. 377, no. 5, pp. 465-475, 2017.**
- **Relevance:** Validates the need for real-time observational surveillance data to guide municipal health policies.

**[18] WHO, "Early warning surveillance and response in emergencies," World Health Organization, 2014.**
- **Relevance:** Establishes the global standard for early warning, noting that geographical tracking and multi-source inputs are critical for immediate response.

**[19] R. Phalkey et al., "Challenges with the implementation of an Integrated Disease Surveillance Programme (IDSP) in Maharashtra state, India," BMC Public Health, 2013.**
- **Relevance:** Provides hyper-local context (Maharashtra/Solapur) explaining how manual reporting delays paralyze existing IDSP pipelines.

**[20] NCDC India, "Integrated Disease Surveillance Programme (IDSP) guidelines," National Centre for Disease Control.**
- **Relevance:** Contextualizes the Indian public health framework that SAMVED HealthGrid aims to modernize through Federated Learning.

**[21] IMD, "Meteorological Data for Public Health," Indian Meteorological Department.**
- **Relevance:** Validates the incorporation of temperature, humidity, and rainfall as core predictive vectors for syndromic modeling.

### 3.1.6 Software Frameworks and Tooling
**[22] D. J. Beutel et al., "Flower: A Friendly Federated Learning Research Framework," arXiv preprint arXiv:2007.14390, 2020.**
- **Relevance:** The primary orchestrator used in SAMVED HealthGrid to implement FedAvg over gRPC.

**[23] A. Paszke et al., "PyTorch: An Imperative Style, High-Performance Deep Learning Library," in Advances in Neural Information Processing Systems 32, 2019.**
- **Relevance:** The framework utilized to build the Multi-Layer Perceptron (MLP) evaluated in the project.

**[24] R. Obe and L. Hsu, "PostGIS in Action," Manning Publications, 2015.**
- **Relevance:** Provides the architectural justification for using PostgreSQL with spatial geometry extensions to serve the React/Leaflet dashboard.

---

## 3.2 Comparison of Existing Systems

Table 3.2: Comparison of Existing Systems with SAMVED HealthGrid
| Feature | Traditional Surveillance (e.g., IDSP) | Centralized Deep Learning Systems | SAMVED HealthGrid (Proposed) |
| :--- | :--- | :--- | :--- |
| **Data Architecture** | Highly fragmented, manual entry | Centralized data lakes | Decentralized, Federated |
| **Data Privacy** | High exposure during transfer | High exposure during pooling | High privacy (Data-local) |
| **Indicator Breadth** | Usually restricted to Lab Confirmed | Multi-source possible | Multi-source (Hosp, Lab, Pharm, Weather) |
| **Reporting Latency** | 7 to 14 days (Reactive) | Near real-time (Proactive) | Simulated Real-time (Proactive) |
| **Geographic Insight** | Broad district level | High precision | Precise Zone-Level Visualization |
| **Operational Overhead** | Extremely high manual effort | High legal/administrative friction | High false-warning management needed |

## 3.3 Research and Technology Gap
The literature survey identifies a distinct convergence gap. While significant advances exist in **multi-source syndromic surveillance** (Wagner, Mandl) and **Federated Learning for healthcare** (Rieke, McMahan), these fields have rarely been integrated at the municipal zone level using reproducible simulation environments.

Specifically, the gaps are:
1. **Isolated Signals:** Multi-source signals (pharmacy + weather + hospital) are rarely unified into a single predictive feature vector under privacy-preserving conditions.
2. **Clinical Bias in FL:** The vast majority of Federated Learning healthcare studies focus exclusively on static medical imaging (e.g., MRI tumor classification) or electronic health record diagnoses for individual patients. There is a profound lack of research applying FL to **spatiotemporal epidemiological surveillance** across decentralized municipal zones.
3. **Reproducibility:** Many surveillance prototypes test against private, inaccessible datasets, rendering their accuracy claims unverifiable. There is a gap in creating a robust, open SEIRS-based synthetic pipeline that allows public validation of rare-event outbreak prediction.
4. **The False-Warning Gap:** Academic papers frequently report high theoretical accuracy (AUROC) without documenting the crippling operational burden of "false warning episodes" generated when the model threshold is lowered to achieve meaningful lead times.

SAMVED HealthGrid directly addresses these gaps by building a reproducible, simulation-based proof of concept that merges stochastic SEIRS generation, geographic non-IID Federated Learning, and transparent evaluation of the false-warning burden via a GIS-enabled municipal dashboard.

### Chapter Summary
This chapter critically analyzed 24 fundamental research papers covering Federated Learning, syndromic surveillance, SEIRS epidemiology, and Indian public health frameworks. The literature solidifies that while syndromic signals dramatically improve early detection, aggregating them violates privacy constraints. Federated Learning elegantly resolves this paradox. However, the literature also warns that non-IID data distributions degrade FedAvg performance, and that high-sensitivity outbreak detection mathematically guarantees a high volume of false warnings—two critical constraints that shape the evaluation methodology of this project.

# CHAPTER 1: INTRODUCTION

## 1.1 Background and Context
Disease surveillance is a critical public health function aimed at monitoring, detecting, and mitigating infectious disease outbreaks before they escalate into widespread epidemics. The cornerstone of traditional disease surveillance relies almost entirely on confirmed-case reporting. When a patient exhibits severe symptoms, they visit a hospital, samples are extracted, and a laboratory subsequently confirms the pathogen. This confirmed diagnosis is then transmitted to municipal or state public-health authorities for tabulation and response [1]. 

While highly accurate in identifying specific diseases, this traditional paradigm suffers from severe, inherent reporting delays. The temporal gap between a patient’s initial infection, the onset of symptoms, seeking medical care, laboratory processing, and final administrative reporting often spans weeks. Consequently, municipal authorities find themselves continuously reacting to past data rather than preventing future spread [2].

To counter these delays, syndromic surveillance has emerged as a vital complementary approach. Syndromic surveillance tracks early, nonspecific indicators of disease prior to clinical confirmation. These signals are inherently multi-source. For example, sudden surges in over-the-counter fever medication at local pharmacies frequently precede hospital admissions by several days. Concurrently, weather signals such as abnormal temperature, humidity, and rainfall significantly influence the propagation of vector-borne and respiratory diseases [3].

However, the geographic surveillance of these disparate syndromic signals introduces massive healthcare-data fragmentation. Hospitals, independent laboratories, and pharmacy chains maintain isolated, proprietary databases. Integrating these fragmented data sources into a centralized municipal repository poses extreme administrative, legal, and privacy risks. Sharing raw, identifiable patient records centrally exposes individuals to privacy breaches and institutions to legal liabilities [4]. Consequently, there is an urgent need for data-local collaborative learning architectures that allow geographic zones to collaboratively train early-warning predictive models without ever centralizing raw institutional data.

## 1.2 Motivation
The primary motivation for this project stems from the critical necessity of early outbreak detection. Identifying an outbreak trajectory days before a surge in hospitalizations allows municipal bodies to proactively deploy resources, issue targeted public warnings, and mobilize localized testing centers. 

Relying on one source alone—such as hospital admissions—is insufficient because it represents a lagging indicator. Patients typically delay hospital visits until symptoms become severe. Conversely, pharmacy-demand signals and weather signals provide an immediate, leading context to the latent spread of disease. Integrating these multi-source signals presents a clear opportunity to pull the detection horizon forward.

However, attempting to centralize these multi-source signals creates insurmountable administrative and privacy hurdles. Institutions aggressively guard their proprietary and sensitive health data. Federated Learning was explicitly selected as the architectural solution to this problem because it mathematically enables collaborative machine learning without data sharing. In a Federated Learning paradigm, raw zone-level records remain local during training; only model parameters or parameter updates are aggregated centrally. 

This problem is exceptionally suitable for a final-year engineering project because it forces the integration of multiple complex domains: advanced machine learning (PyTorch), distributed systems orchestration (Flower framework), spatial databases (PostgreSQL/PostGIS), and full-stack web development (React/Node.js). It represents a socially impactful, technically rigorous challenge that perfectly encapsulates modern software architecture.

## 1.3 Problem Statement
Public health authorities face critical delays in early outbreak detection due to the fragmentation of multi-source syndromic data and strict privacy constraints that prohibit centralizing institutional records.

SAMVED HealthGrid aims to design, implement, and evaluate a simulation-based proof of concept that uses data-local geographic Federated Learning to securely aggregate multi-source syndromic signals and predict localized outbreak onset within a seven-day future horizon.

## 1.4 Objectives
1. **To design** a multi-source data ingestion pipeline integrating simulated hospital, laboratory, pharmacy, and weather signals across geographic zones.
2. **To develop** a PyTorch Multi-Layer Perceptron (MLP) capable of capturing nonlinear correlations in syndromic data to predict outbreak onset within a seven-day horizon.
3. **To implement** data-local geographic Federated Learning using the Flower framework and the FedAvg algorithm across five distinct zone clients.
4. **To evaluate** model performance objectively by comparing local, federated, and centralized paradigms using a rigorously partitioned, stochastic SEIRS-based synthetic dataset.
5. **To compare** the predictive contribution of distinct data sources through comprehensive multi-source ablation experiments.
6. **To visualize** zone-level outbreak risk and probability using an interactive, GIS-based spatial dashboard.
7. **To validate** the system architecture through end-to-end integration testing orchestrated via Docker Compose.
8. **To document** the operational trade-offs between the Event Detection Rate and the False Warning Rate inherent in early outbreak prediction systems.

## 1.5 Scope

### 1.5.1 Included Scope
The implemented scope encompasses a comprehensive, end-to-end simulation pipeline. It includes the generation and ingestion of hospital symptom and admission signals, laboratory positivity rates, pharmacy medicine-demand signals, and weather indicators (temperature, humidity, rainfall). The scope includes the orchestration of five geographic zones acting as distinct Federated Learning clients, local zone-level feature generation, and the training of a PyTorch Multi-Layer Perceptron. The system orchestrates Federated Learning using the Flower framework and FedAvg aggregation. The scope includes daily and weekly disease surveillance tracking, GIS-based zone-level visualization, and the issuance of early-warning alerts for outbreak onset within a seven-day horizon.

### 1.5.2 Excluded Scope
SAMVED HealthGrid is scoped explicitly as a syndromic surveillance prototype. It strictly excludes individual disease diagnosis, individual treatment recommendation, telemedicine, and appointment booking. The system does not perform general-bed forecasting, ICU-bed prediction, oxygen-bed prediction, or ventilator prediction. The system excludes vaccination management, real hospital integration, and direct clinical deployment.

### 1.5.3 Research Scope
The research scope involves evaluating Federated Learning over non-IID (non-independent and identically distributed) geographic data using synthetic SEIRS-based epidemic generation. It encompasses local versus federated versus centralized model comparisons and multi-source ablation experiments to quantify the contribution of pharmacy and weather signals. It evaluates the impact of privacy constraints on predictive accuracy. It does not implement formal Differential Privacy, Secure Aggregation, or Homomorphic Encryption.

### 1.5.4 Demonstration Scope
The demonstration scope is limited to a "simulation-based proof of concept". It showcases a FastAPI inference service, a Node.js/Express backend, PostGIS storage, and a React/Leaflet dashboard orchestrated via Docker Compose. It does not claim HIPAA certification, GDPR certification, or readiness for production municipal deployment.

## 1.6 Users and Stakeholders
The primary beneficiaries and stakeholders of SAMVED HealthGrid include:
1. **Municipal Public-Health Authorities**: The core users who utilize the GIS dashboard to monitor zone-level risks and deploy preventative municipal interventions.
2. **Hospitals and Laboratories**: Institutional stakeholders who contribute local parameter updates without sacrificing raw, identifiable patient data, thereby maintaining regulatory compliance.
3. **Pharmacies**: Retail entities whose aggregate sales trends contribute to the early-warning syndromic network without exposing proprietary business data.
4. **Researchers**: Data scientists utilizing the synthetic SEIRS framework to study the effects of non-IID data distributions on FedAvg convergence.
5. **System Administrators**: Technical personnel managing the Docker-based deployment, FastAPI microservices, and database availability.
6. **Citizens**: The indirect beneficiaries who experience a lower disease burden due to accelerated, proactive municipal healthcare responses.

## 1.7 Project Contributions
SAMVED HealthGrid successfully delivers a verified, reproducible research prototype encompassing a custom SEIRS data generator, a fully functional geographic Federated Learning pipeline (Flower/PyTorch), and an integrated full-stack surveillance dashboard. It contributes a rigorous, chronological evaluation framework highlighting the mathematical trade-offs between early-warning sensitivity and operational false-warning burdens in federated environments.

## 1.8 Organization of the Report
The report is structured systematically across ten chapters. **Chapter 1** introduces the background, motivation, objectives, and scope of the project. **Chapter 2** analyzes the root causes of surveillance delays and formally defines the problem. **Chapter 3** surveys existing literature and establishes the technology gap. **Chapter 4** outlines the proposed solution and defines functional requirements. **Chapter 5** details the system architecture, UML models, and database design. **Chapter 6** explains the algorithms, ML implementation, and microservice orchestration. **Chapter 7** validates the software through structured test cases and performance metrics. **Chapter 8** provides deployment and user documentation. **Chapter 9** presents the empirical results, including ablation studies and the false-warning evaluation. Finally, **Chapter 10** concludes the report and discusses future avenues for research.

### Chapter Summary
This chapter established the fundamental need for early disease outbreak detection via multi-source syndromic surveillance. It explained how data-local geographic Federated Learning provides a novel solution to the privacy and administrative barriers of data centralization. The objectives, included scope, excluded scope, and project contributions were clearly defined, setting a rigorous foundation for the simulation-based proof of concept.

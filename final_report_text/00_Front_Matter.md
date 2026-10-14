# FRONT MATTER

## COVER PAGE CONTENT

**FINAL YEAR PROJECT REPORT**
**ON**

**SAMVED HealthGrid: Privacy-Preserving Federated Disease Surveillance and Early Outbreak Detection System**

**SUBMITTED BY:**
1. Abhijeet Ravindra Gaikwad, PRN 2310053
2. Shubham Sanjay Shewalkar, PRN 2310033
3. Aditya Jagtap, PRN 2306123
4. Abhishek Waghmare, PRN 2310067

**UNDER THE GUIDANCE OF:**
Prof. P. T. Sawant

[Insert institute logo]

**Department of Information Technology**
**Rajarambapu Institute of Technology, Rajaramnagar**
**Academic Year: [Insert Academic Year]**

---

## TITLE PAGE CONTENT
*(Identical to Cover Page)*

---

## CERTIFICATE
This is to certify that the project entitled **"SAMVED HealthGrid: Privacy-Preserving Federated Disease Surveillance and Early Outbreak Detection System"** has been successfully completed by:
- Abhijeet Ravindra Gaikwad, PRN 2310053
- Shubham Sanjay Shewalkar, PRN 2310033
- Aditya Jagtap, PRN 2306123
- Abhishek Waghmare, PRN 2310067

under the guidance of Prof. P. T. Sawant in partial fulfillment of the requirements for the Degree of Bachelor of Technology in Information Technology.

[Signature Placeholder]
**Prof. P. T. Sawant**
(Project Guide)

[Signature Placeholder]
**[Insert HOD name]**
(Head, Department of Information Technology)

[Signature Placeholder]
**[Insert Director name]**
(Director)

---

## DECLARATION
We, the undersigned, declare that the project entitled **"SAMVED HealthGrid: Privacy-Preserving Federated Disease Surveillance and Early Outbreak Detection System"** is a record of our original work carried out under the supervision of Prof. P. T. Sawant. SAMVED HealthGrid is a simulation-based proof of concept that uses data-local geographic Federated Learning for multi-source syndromic surveillance and early outbreak-risk prediction. It has not been submitted elsewhere for the award of any degree or diploma.

1. Abhijeet Ravindra Gaikwad (PRN 2310053) [Signature]
2. Shubham Sanjay Shewalkar (PRN 2310033) [Signature]
3. Aditya Jagtap (PRN 2306123) [Signature]
4. Abhishek Waghmare (PRN 2310067) [Signature]

**Date:** [Insert Submission Date]

---

## SMC HACKATHON 2025–26 PARTICIPATION
The initial concept for this project originated from the "Smart Public Health Management System" problem statement presented by the Solapur Municipal Corporation during the SMC Hackathon 2025–26. Our team participated in the prototype round and subsequently expanded the concept into this comprehensive final-year project.

[Insert Exact Hackathon Certificate / Proof of Participation]

---

## ACKNOWLEDGEMENT
We express our profound gratitude to our project guide, Prof. P. T. Sawant, for providing steadfast technical direction and continuous encouragement throughout this endeavor. We also thank the Solapur Municipal Corporation for providing the inspiring problem statement during the SMC Hackathon 2025–26. Finally, we acknowledge the support of the Department of Information Technology at Rajarambapu Institute of Technology, Rajaramnagar, for providing the necessary resources to complete this project.

---

## ABSTRACT
Traditional public-health surveillance systems rely predominantly on delayed, fragmented case reporting from isolated hospitals and laboratories, resulting in reporting delays that inhibit proactive outbreak management. This project proposes SAMVED HealthGrid, a simulation-based proof of concept that uses data-local geographic Federated Learning for multi-source syndromic surveillance and early outbreak-risk prediction. The system ingests simulated real-time data from hospitals, laboratories, pharmacies, and weather conditions (temperature, humidity, rainfall) across five geographic zones. Rather than pooling sensitive institutional records centrally, raw zone-level records remain local during Federated Learning. A PyTorch Multi-Layer Perceptron (MLP) is trained locally at each zone, and the model parameters are aggregated centrally using the Federated Averaging (FedAvg) algorithm. The evaluation relies on a stochastic network SEIRS generator capable of simulating latent epidemic waves and discrete observational delays. The system successfully predicts outbreak onset within a verified seven-day horizon and visualizes zone-level risk using an interactive Geographic Information System (GIS) dashboard. While the system demonstrates the feasibility of decentralized surveillance, a major operational limitation observed is the absolute burden of false warnings inherently tied to high-sensitivity early detection thresholds for rare outbreak events. 

---

## TABLE OF CONTENTS
*(Structure Outline)*
1. INTRODUCTION
2. PROBLEM IDENTIFICATION AND ANALYSIS
3. LITERATURE SURVEY AND EXISTING SYSTEMS
4. PROPOSED SYSTEM AND REQUIREMENTS
5. SYSTEM DESIGN
6. DEVELOPMENT AND IMPLEMENTATION
7. TESTING AND VALIDATION
8. DEPLOYMENT AND USER DOCUMENTATION
9. RESULTS AND DISCUSSION
10. PROJECT OUTCOME, CONCLUSION AND FUTURE WORK
REFERENCES
APPENDIX

---

## LIST OF FIGURES
[To be populated by Word's Auto Table feature based on Table 14_Tables_and_Captions]

---

## LIST OF TABLES
[To be populated by Word's Auto Table feature based on Table 14_Tables_and_Captions]

---

## LIST OF ABBREVIATIONS AND ACRONYMS
- API: Application Programming Interface
- DFD: Data Flow Diagram
- ER: Entity Relationship
- FedAvg: Federated Averaging
- FL: Federated Learning
- GIS: Geographic Information System
- IID: Independent and Identically Distributed
- MLP: Multi-Layer Perceptron
- PR-AUC: Precision-Recall Area Under the Curve
- SEIRS: Susceptible-Exposed-Infectious-Recovered-Susceptible
- UAT: User Acceptance Testing

from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

def build_chapter3(doc):
    doc.add_page_break()
    doc.add_paragraph("CHAPTER 3: LITERATURE SURVEY AND EXISTING SYSTEMS", style='Heading 1')
    doc.add_paragraph("3.1 Literature Survey", style='Heading 2')
    doc.add_paragraph("The integration of multi-source syndromic data, such as pharmacy sales and meteorological conditions, provides robust early-warning signals prior to laboratory confirmation [1]. Concurrently, Federated Learning (FL), pioneered by McMahan et al., allows predictive model training on decentralized nodes without the transmission of sensitive raw data [2]. SEIRS models have been universally adopted to generate epidemiological parameters under controlled latent environments [3]. Recent literature on FL applied to healthcare highlights severe limitations when processing non-IID (non-independent and identically distributed) datasets [4]. Table 3.1 summarizes the key research utilized to establish the foundation of SAMVED HealthGrid.")
    
    # Add Table 3.1
    p = doc.add_paragraph("Table 3.1: Summary of selected literature")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Reference'
    hdr_cells[1].text = 'Objective'
    hdr_cells[2].text = 'Methodology / Tool'
    hdr_cells[3].text = 'Relevance to Project'
    
    row_data = [
        ("[2] McMahan et al. (2017)", "Decentralized deep network training.", "Parameter averaging (FedAvg).", "Establishes FL aggregation mechanism."),
        ("[3] Yang et al. (2019)", "Federated Machine Learning theory.", "Comprehensive FL taxonomy.", "Provides baseline geographic FL design."),
        ("[4] Kairouz et al. (2021)", "Advances and open problems in FL.", "Non-IID challenges analysis.", "Justifies expected low FedAvg PR-AUC."),
        ("[5] Li et al. (2020)", "Federated Optimization in Heterogeneous Networks.", "FedProx algorithm.", "Contextualizes future work scope."),
        ("[6] Wagner et al. (2001)", "Syndromic surveillance early detection.", "OTC pharmacy sales modeling.", "Validates pharmacy feature selection."),
        ("[7] R. B. Institute (2025)", "SAMVED HealthGrid Documentation.", "SEIRS Python generation v2.1.", "Primary synthetic validation environment.")
    ]
    for rd in row_data:
        row_cells = table.add_row().cells
        for i in range(4):
            row_cells[i].text = rd[i]
            
    doc.add_paragraph("\n3.2 Research and Technology Gap", style='Heading 2')
    doc.add_paragraph("While extensive literature exists on applying FL to clinical medical imaging (e.g., MRI classification), there is a significant research gap in utilizing FL for real-time geographic syndromic surveillance across distributed municipal zones. Existing systems rely on centralized aggregation of confirmed lab reports. SAMVED HealthGrid bridges this gap by demonstrating that a distributed PyTorch MLP trained via FedAvg across five heterogeneous zones can predict onset risk securely without pooling institutional databases.")
    doc.add_paragraph("Summary: This chapter reviewed critical literature, confirming the scientific necessity of decentralized early-warning structures.")

def build_chapter4(doc):
    doc.add_page_break()
    doc.add_paragraph("CHAPTER 4: PROPOSED SYSTEM AND REQUIREMENTS", style='Heading 1')
    doc.add_paragraph("4.1 Proposed Solution", style='Heading 2')
    doc.add_paragraph("The proposed solution is a simulation-based proof of concept that uses data-local geographic Federated Learning for multi-source syndromic surveillance and early outbreak-risk prediction. By retaining raw data at the zone level, the system bypasses standard privacy impediments.")
    
    doc.add_paragraph("4.2 Proposed Methodology", style='Heading 2')
    doc.add_paragraph("The methodology relies on producing realistic synthetic data through a stochastic SEIRS generator capable of outputting a 12-feature vector (hospital, lab, pharmacy, weather). These vectors are chronologically split (Train, Validation, Test) at each zone client. PyTorch MLPs are trained locally using BCEWithLogitsLoss. A Flower server coordinates FedAvg, and a FastAPI service serves inferences.")
    
    doc.add_paragraph("4.3 Functional Requirements", style='Heading 2')
    doc.add_paragraph("FR-01: The system shall run federated training across five zone clients using FedAvg.\nFR-02: The inference service shall accept 12 features and return an outbreak probability.\nFR-03: The GIS dashboard shall map zone-level risk categories based on API output.")
    
    doc.add_paragraph("4.4 Non-Functional Requirements", style='Heading 2')
    doc.add_paragraph("NFR-01: Privacy: Raw data MUST remain at the zone client.\nNFR-02: Reproducibility: Data generation and evaluation must use locked random seeds.\nNFR-03: Deployability: Services must be orchestrated seamlessly via Docker Compose.")
    
    doc.add_paragraph("4.5 System Modules", style='Heading 2')
    doc.add_paragraph("The system comprises: \n1. Synthetic-Data Generation (SEIRS V2.1)\n2. Federated Aggregation (Flower)\n3. Central Inference Service (FastAPI)\n4. Backend API (Node.js/Express)\n5. PostGIS Storage (PostgreSQL)\n6. GIS Dashboard (React/Leaflet)")
    
    doc.add_paragraph("4.6 Significance of the Project", style='Heading 2')
    doc.add_paragraph("This project proves the technical viability of municipal federated networks, highlighting how decentralized computation protects proprietary healthcare data while still empowering public health decisions.")
    
    doc.add_paragraph("4.7 Deployment Requirements", style='Heading 2')
    doc.add_paragraph("Software dependencies include Python 3.10, Node.js 20, Docker Desktop, and PostgreSQL with PostGIS extension. Hardware requires a standard desktop with at least 8GB RAM to simulate 5 concurrent clients.")
    
    doc.add_paragraph("4.9 Cost Estimation", style='Heading 2')
    doc.add_paragraph("The proof-of-concept cost is ₹0, as all underlying frameworks (PyTorch, Flower, React, Express, PostgreSQL) are strictly open-source.")
    
    doc.add_paragraph("4.10 Project Deliverables", style='Heading 2')
    doc.add_paragraph("Deliverables include the source code repository, Docker Compose configurations, verifiable evaluation CSV metrics, and this final academic report.")
    doc.add_paragraph("Summary: This chapter specified the exact functional requirements and deployment constraints of the SAMVED HealthGrid.")

def build_chapter5(doc):
    doc.add_page_break()
    doc.add_paragraph("CHAPTER 5: SYSTEM DESIGN", style='Heading 1')
    doc.add_paragraph("5.1 System Architecture", style='Heading 2')
    doc.add_paragraph("The architecture enforces strict data locality. Each of the five geographic zones processes its hospital, laboratory, pharmacy, and weather data into a combined 12-dimensional vector. Local PyTorch MLP models extract features, and only the updated parameters are transmitted to the Flower FedAvg server. A centralized FastAPI instance then executes inference using the globally frozen model.")
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("diagrams_output/system_architecture.png"):
        p.add_run().add_picture("diagrams_output/system_architecture.png", width=Inches(6.0))
    doc.add_paragraph("Figure 5.1: Overall system architecture", style='Caption').alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("5.2 Module-Level Design", style='Heading 2')
    doc.add_paragraph("The system separates the research evaluation track from the production API track. The research track (Phase 4) conducts rigorous chronological splitting to measure PR-AUC, while the production track loads the optimized `.pth` weights for API ingestion.")
    
    doc.add_paragraph("5.3 System Workflow", style='Heading 2')
    doc.add_paragraph("The federated workflow requires the server to broadcast initial random weights. Zone clients then independently minimize the BCEWithLogitsLoss over local epochs. The Flower server receives the updated gradients, executes FedAvg, and re-broadcasts. This loop executes for 10 rounds.")

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("diagrams_output/fl_workflow.png"):
        p2.add_run().add_picture("diagrams_output/fl_workflow.png", width=Inches(5.0))
    doc.add_paragraph("Figure 5.2: Federated Learning Workflow", style='Caption').alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("5.4 UML Diagrams", style='Heading 2')
    
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("diagrams_output/use_case.png"):
        p3.add_run().add_picture("diagrams_output/use_case.png", width=Inches(5.5))
    doc.add_paragraph("Figure 5.3: Use Case Diagram", style='Caption').alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("5.5 Data Flow Diagram", style='Heading 2')
    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("diagrams_output/dfd_level1.png"):
        p4.add_run().add_picture("diagrams_output/dfd_level1.png", width=Inches(5.5))
    doc.add_paragraph("Figure 5.4: Level 1 DFD", style='Caption').alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("5.6 Database Design", style='Heading 2')
    doc.add_paragraph("The database utilizes PostgreSQL extended with PostGIS. The `predictions` table natively handles geographic queries by inserting point geometries derived from coordinate projections. This enables rapid filtering when the React GIS dashboard requests regional risk heatmaps.")
    doc.add_paragraph("Summary: This chapter provided comprehensive architectural blueprints, solidifying the data isolation boundary required for privacy.")

def build_chapter6(doc):
    doc.add_page_break()
    doc.add_paragraph("CHAPTER 6: DEVELOPMENT AND IMPLEMENTATION", style='Heading 1')
    doc.add_paragraph("6.1 Development Environment", style='Heading 2')
    doc.add_paragraph("The project was developed in Visual Studio Code on Windows 11. Environment parity was strictly maintained through containerization via Docker Desktop.")
    
    doc.add_paragraph("6.2 Technologies and Tools", style='Heading 2')
    doc.add_paragraph("Python and PyTorch were selected for deep learning and feature engineering flexibility. Flower was selected as the Federated Learning orchestrator due to its robust gRPC communication protocol. Node.js with Express handles high-throughput API routing, while React with Leaflet powers the spatial GIS rendering.")
    
    doc.add_paragraph("6.4 Algorithms and Business Logic", style='Heading 2')
    doc.add_paragraph("The Stochastic SEIRS Generation (V2.1) explicitly models latent epidemic waves, seasonality, and discrete observational delays (e.g., pharmacy spikes precede hospital admissions).")
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if os.path.exists("diagrams_output/seirs_workflow.png"):
        p.add_run().add_picture("diagrams_output/seirs_workflow.png", width=Inches(5.5))
    doc.add_paragraph("Figure 6.1: SEIRS Data Generation Workflow", style='Caption').alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("The underlying model is a Multi-Layer Perceptron (Input: 12 -> Dense: 64 -> Dense: 32 -> Output: 1). It utilizes BCEWithLogitsLoss. A crucial business logic component is target definition: 'outbreak onset' is defined as sustained latent incidence > 40 crossing within the next 7-day chronological horizon.")
    
    doc.add_paragraph("6.6 System Integration", style='Heading 2')
    doc.add_paragraph("System integration relies heavily on the `docker-compose.yml` script, which automates network routing between the PostGIS backend, Node API, FastAPI server, Flower Server, and five distinct Zone Clients.")
    doc.add_paragraph("Summary: This chapter detailed the implementation specifics, algorithms, and orchestration required to bridge data science with web architecture.")

def main():
    doc = Document('temp_report_1.docx')
    build_chapter3(doc)
    build_chapter4(doc)
    build_chapter5(doc)
    build_chapter6(doc)
    doc.save('temp_report_2.docx')

if __name__ == '__main__':
    main()

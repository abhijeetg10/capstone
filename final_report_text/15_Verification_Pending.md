# VERIFICATION PENDING CHECKLIST

Before submitting the final black book to the university, the project team must manually execute the following checklist. The report text generated is mathematically accurate to the repository, but certain institutional physical assets cannot be synthetically generated.

## Institutional Assets
- [ ] **Institute Logo**: Insert the official Rajarambapu Institute of Technology logo on the Cover Page and Title Page.
- [ ] **Signatures**: Obtain physical or digital signatures from Prof. P. T. Sawant, the HOD, and the Director on the Certificate page.
- [ ] **Student Signatures**: All four team members must sign the Declaration page.
- [ ] **Hackathon Certificate**: Scan and insert the physical/digital SMC Hackathon participation certificate.
- [ ] **Plagiarism Report**: Run the final assembled Word document through Turnitin/URKUND and append the summary page showing < 10% similarity.

## Chart Generation
The report text contains the structure and captions for Chapter 9's charts, but standard charts cannot be created in Mermaid. You must:
- [ ] Open `fedavg_final_metrics.csv` in Microsoft Excel.
- [ ] Generate the **Precision-Recall Curve** (Line Chart).
- [ ] Generate the **Model Paradigm Comparison** (Bar Chart).
- [ ] Insert these Excel charts physically into Chapter 9 under their designated captions.

## Code vs Documentation Verification
- [ ] **Exact Result Metrics**: Confirm that the PR-AUC limits mentioned (~0.03 to 0.15) remain accurate if you re-run `evaluation/phase4_final.py` before submission.
- [ ] **Unverified Runtime Values**: Run the FastAPI inference endpoint locally and confirm response time is indeed < 200ms on your presentation machine.
- [ ] **Dashboard Screenshots**: Capture 2-3 high-resolution screenshots of the React Dashboard showing the Leaflet map and the "High Risk" alert banner, and insert them into Chapter 8.
- [ ] **Guide Approval**: Have Prof. P. T. Sawant review the "False Warning" conclusion in Chapter 9 and 10 to ensure the college accepts the negative results narrative.
- [ ] **Formatting Approval**: Apply 1.5 line spacing, 12pt Times New Roman, and Justified alignment exactly as mandated by the IT Department's report formatting guidelines.

## Completeness Matrix
| Report Section | Status | Action Required |
| :--- | :--- | :--- |
| **Front Matter** | Pending | Needs signatures & logos. |
| **Chapter 1: Intro** | Complete | None. |
| **Chapter 2: Problem ID** | Complete | None. |
| **Chapter 3: Lit Survey** | Complete | None. |
| **Chapter 4: Requirements**| Complete | None. |
| **Chapter 5: Design** | Complete | Render Mermaid diagrams into MS Word. |
| **Chapter 6: Implementation**| Complete | Render Mermaid diagrams into MS Word. |
| **Chapter 7: Testing** | Complete | None. |
| **Chapter 8: Deployment** | Pending | Needs 2 dashboard screenshots inserted. |
| **Chapter 9: Results** | Pending | Needs Excel graphs built from CSV. |
| **Chapter 10: Conclusion** | Complete | None. |
| **References** | Complete | None. |

import sys
try:
    from docx2pdf import convert
    print("Converting DOCX to PDF...")
    convert("SAMVED_HealthGrid_Final_Project_Report.docx", "SAMVED_HealthGrid_Final_Project_Report.pdf")
    print("Successfully created PDF.")
except Exception as e:
    print(f"PDF Conversion Failed: {e}")

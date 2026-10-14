import pypandoc
import os

def main():
    md_file = 'SAMVED_HealthGrid_Report_Source.md'
    docx_file = 'SAMVED_HealthGrid_Final_Project_Report.docx'
    
    try:
        print("Ensuring pandoc is available...")
        try:
            pypandoc.get_pandoc_version()
        except OSError:
            print("Downloading pandoc...")
            pypandoc.download_pandoc()
            
        print(f"Converting {md_file} to {docx_file}...")
        
        # Configure pandoc arguments to approximate the requested margins and fonts
        # We'll rely primarily on Pandoc's default Word reference.docx which is usually fine,
        # but we can pass variables if needed.
        extra_args = [
            '-V', 'geometry:a4paper',
            '-V', 'geometry:left=0.75in,right=0.5in,top=0.5in,bottom=0.5in',
            '-V', 'mainfont:Times New Roman',
            '-V', 'fontsize:12pt'
        ]
        
        pypandoc.convert_file(md_file, 'docx', outputfile=docx_file, extra_args=extra_args)
        print(f"Successfully generated {docx_file}")
        
    except Exception as e:
        print(f"Failed to generate docx: {e}")

if __name__ == '__main__':
    main()

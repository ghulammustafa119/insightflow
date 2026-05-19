import fitz
import os

def generate_pdf():
    txt_path = os.path.join(os.path.dirname(__file__), "warehouse_report.txt")
    pdf_path = os.path.join(os.path.dirname(__file__), "warehouse_report.pdf")

    with open(txt_path, "r") as f:
        content = f.read()

    doc = fitz.open()
    page = doc.new_page()

    page.insert_text(
        point=(50, 50),
        text=content,
        fontsize=11,
        fontname="helv",
    )

    doc.save(pdf_path)
    doc.close()
    print(f"PDF created: {pdf_path}")

if __name__ == "__main__":
    generate_pdf()

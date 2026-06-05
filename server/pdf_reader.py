import sys
import fitz  # PyMuPDF

file_path = sys.argv[1]
doc = fitz.open(file_path)
text = ''
for page in doc:
    text += page.get_text()
print(text)
import sys
import easyocr

reader = easyocr.Reader(['en'], gpu=False)
file_path = sys.argv[1]
result = reader.readtext(file_path, detail=0)
print(' '.join(result))

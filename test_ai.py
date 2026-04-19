import io
from PIL import Image
from backend.model.model import analyze_image
import os
import sys

# Create a dummy image
img = Image.new('RGB', (100, 100), color = 'red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
res = analyze_image(img_bytes.getvalue())
print("RESULT:", res)

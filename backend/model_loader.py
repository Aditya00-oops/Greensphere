import torch
from model.model1 import analyze_waste  # your function

def predict(image_bytes):
    result = analyze_waste(image_bytes)
    return result


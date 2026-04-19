from typing import Dict, Any
import random
from PIL import Image
import io
import numpy as np
from model.model import analyze_image  # Gemini 2.5 Flash powered


def _is_invalid_image(image_bytes: bytes, brightness_threshold: int = 15) -> bool:
    """
    Pre-AI validation: detect black, blank, or corrupted images.
    Returns True if the image is invalid (too dark / too uniform).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        pixels = np.array(img)
        avg_brightness = pixels.mean()
        print(f"🔍 Image brightness check: avg={avg_brightness:.1f} (threshold={brightness_threshold})")
        
        # Check 1: Image is mostly black
        if avg_brightness < brightness_threshold:
            return True
        
        # Check 2: Image is a single solid color (std dev near 0)
        if pixels.std() < 5:
            return True
            
        return False
    except Exception as e:
        print(f"⚠️ Image validation error: {e}")
        return True  # If we can't even open it, it's invalid


def analyze_waste_detection(image_bytes: bytes) -> Dict[str, Any]:
    """
    Primary waste detection using Gemini 2.5 Flash AI.
    Step 1: Pre-validate image (reject black/blank/corrupt images).
    Step 2: Send valid images to Gemini for classification.
    """
    
    # ── STEP 1: Pre-AI Image Validation ──────────────────────────────
    if _is_invalid_image(image_bytes):
        print("🚫 REJECTED: Black/blank/invalid image detected before AI call.")
        return {
            "is_garbage": False,
            "garbage_type": "INVALID_PHOTO",
            "confidence": 0.0,
            "accuracy": 0.0,
            "message": "INVALID PHOTO: Image is black, blank, or corrupted. Please upload a real photo."
        }
    
    # ── STEP 2: Real Gemini AI Analysis ──────────────────────────────
    try:
        result = analyze_image(image_bytes)

        # If Gemini returned an error dict, raise to trigger fallback
        if "error" in result:
            raise RuntimeError(result["error"])

        # Normalize Gemini response to match our Pydantic schema
        return {
            "is_garbage": result.get("is_garbage", False),
            "garbage_type": result.get("garbage_type", None),
            "confidence": float(result.get("confidence", 0.0)),
            "accuracy": float(result.get("accuracy", 0.0)),
            "message": result.get("message", "Analysis complete"),
        }
    except Exception as e:
        print(f"⚠️  Gemini model error: {e}")
        return {
            "is_garbage": False,
            "garbage_type": "INVALID_PHOTO",
            "confidence": 0.0,
            "accuracy": 0.0,
            "message": "FALSE SOURCE: AI analysis failed. Check API key or try another image."
        }

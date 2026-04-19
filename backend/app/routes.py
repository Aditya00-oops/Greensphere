from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.service import analyze_waste_detection
from app.schemas import WasteDetectionResponse

router = APIRouter()

@router.post("/detect", response_model=WasteDetectionResponse)
async def detect_waste(file: UploadFile = File(...)):
    """Detect garbage in uploaded image"""
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No file uploaded"
        )
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    try:
        contents = await file.read()
        result = analyze_waste_detection(contents)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model analysis failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    return {"status": "healthy", "model": "WasteVision ready"}

@router.get("/hotspots")
async def get_hotspots():
    """Returns geospatial hotspots for the map"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": { "type": "Point", "coordinates": [75.7873, 26.9124] },
                "properties": { "id": 1, "status": "pending", "waste_type": "Plastic (HDPE)", "confidence": 92, "inventory": "Awaiting Pickup" }
            },
            {
                "type": "Feature",
                "geometry": { "type": "Point", "coordinates": [75.8123, 26.9224] },
                "properties": { "id": 2, "status": "verified", "waste_type": "Metal (Can)", "confidence": 98, "inventory": "Verified" }
            },
            {
                "type": "Feature",
                "geometry": { "type": "Point", "coordinates": [75.7673, 26.8924] },
                "properties": { "id": 3, "status": "pending", "waste_type": "Organic", "confidence": 85, "inventory": "Processing" }
            }
        ]
    }

from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
from app.services.gee import init_gee, get_satellite_data, is_gee_ready
from app.routes import router as waste_router

app = FastAPI(title="GreenSphere Integrated API", version="1.0.0")

# Include the WasteVision API routes
app.include_router(waste_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "GreenSphere API is Live!",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "detect": "/api/detect",
            "hotspots": "/api/hotspots",
            "satellite": "/satellite"
        }
    }

# CORS for React localhost:3003
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static data for demo
app.mount("/data", StaticFiles(directory="data"), name="data")


@app.on_event("startup")
def startup():
    """Attempt GEE authentication on server start."""
    init_gee()


@app.get("/satellite")
def satellite(
    lng: float = Query(default=75.7873, description="Center longitude"),
    lat: float = Query(default=26.9124, description="Center latitude"),
    radius: int = Query(default=5000, ge=500, le=50000, description="Scan radius in meters"),
    days: int = Query(default=90, ge=7, le=365, description="Days back to search"),
):
    """
    Get real-time GEE Sentinel-2 waste detection GeoJSON.
    Falls back to demo data if GEE is not configured.
    """
    if not is_gee_ready():
        # GEE not configured — serve demo data with a note
        with open("data/demo_satellite.json", "r") as f:
            demo = json.load(f)
        demo["properties"] = {
            "source": "demo",
            "note": "GEE not configured — showing demo data. See server logs for setup instructions.",
        }
        return demo

    try:
        data = get_satellite_data(
            center=[lng, lat],
            radius_m=radius,
            days_back=days,
        )
        return data
    except Exception as e:
        # Fallback to demo data on any GEE runtime error
        print(f"⚠️  GEE query failed: {e} — returning demo data")
        with open("data/demo_satellite.json", "r") as f:
            demo = json.load(f)
        demo["properties"] = {
            "source": "demo_fallback",
            "error": str(e),
        }
        return demo


@app.get("/satellite/status")
def satellite_status():
    """Check if GEE is authenticated and ready."""
    return {
        "gee_ready": is_gee_ready(),
        "message": "GEE is live — satellite data is real-time"
        if is_gee_ready()
        else "GEE not configured — using demo data. Run `earthengine authenticate` or set GEE_SERVICE_ACCOUNT_KEY in .env",
    }

if __name__ == "__main__":
    import uvicorn
    # Use standard host and port, reload disabled by default to avoid multiprocessing issues on Windows
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

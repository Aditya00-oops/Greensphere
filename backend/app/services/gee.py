"""
Google Earth Engine (GEE) Service
=================================
Connects to GEE for real-time Sentinel-2 satellite imagery analysis.
Detects potential waste/landfill sites via NDVI thresholding.

Authentication priority:
  1. Service Account JSON (GEE_SERVICE_ACCOUNT_KEY env var)
  2. Application Default Credentials (run `earthengine authenticate` first)
  3. Graceful fallback — init_gee() returns False, endpoints use demo data
"""

import ee
import os
import json
from datetime import datetime, timedelta

# ─── Module-level state ─────────────────────────────────────────────────────
_gee_initialized = False

# Jaipur city center
JAIPUR_CENTER = [75.7873, 26.9124]
AOI_RADIUS_METERS = 5000  # 5 km scan radius


def init_gee() -> bool:
    """
    Initialize Google Earth Engine.
    Returns True if successfully authenticated, False otherwise.
    """
    global _gee_initialized

    # ── Strategy 1: Service Account JSON key file ────────────────────────
    key_path = os.getenv("GEE_SERVICE_ACCOUNT_KEY", "")
    if key_path and os.path.isfile(key_path):
        try:
            with open(key_path, "r") as f:
                key_data = json.load(f)
            service_account = key_data.get("client_email", "")
            credentials = ee.ServiceAccountCredentials(service_account, key_path)
            ee.Initialize(credentials)
            _gee_initialized = True
            print(f"GEE initialized with Service Account: {service_account}")
            return True
        except Exception as e:
            print(f"GEE Service Account auth failed: {e}")

    # ── Strategy 2: GCP Project ID (needs prior `earthengine authenticate`) ─
    gee_project = os.getenv("GEE_PROJECT_ID", "")
    if gee_project:
        try:
            ee.Initialize(project=gee_project)
            _gee_initialized = True
            print(f"GEE initialized with project: {gee_project}")
            return True
        except Exception as e:
            print(f"GEE project-based auth failed: {e}")

    # ── Strategy 3: Application Default Credentials ──────────────────────
    try:
        ee.Initialize()
        _gee_initialized = True
        print("GEE initialized with Application Default Credentials")
        return True
    except Exception as e:
        print(f"GEE default credentials auth failed: {e}")

    # ── All strategies failed ────────────────────────────────────────────
    print("GEE initialization failed - satellite endpoint will use demo data.")
    print("   To fix, do ONE of these:")
    print("   1. Set GEE_SERVICE_ACCOUNT_KEY=path/to/key.json in .env")
    print("   2. Set GEE_PROJECT_ID=your-gcp-project in .env")
    print("   3. Run `earthengine authenticate` in your terminal")
    _gee_initialized = False
    return False


def is_gee_ready() -> bool:
    """Check if GEE is authenticated and ready."""
    return _gee_initialized


def get_satellite_data(
    center: list = None,
    radius_m: int = None,
    days_back: int = 90,
    ndvi_threshold: float = 0.2,
    cloud_max: int = 30,
) -> dict:
    """
    Fetch real-time waste detection data from Sentinel-2 via NDVI analysis.

    Args:
        center: [lng, lat] coordinate pair (default: Jaipur)
        radius_m: Scan radius in meters (default: 5000)
        days_back: How many days back to search for imagery
        ndvi_threshold: NDVI below this → flagged as potential waste/barren
        cloud_max: Max cloud cover percentage for image selection

    Returns:
        GeoJSON FeatureCollection with detected waste anomaly centroids.

    Raises:
        RuntimeError: If GEE is not initialized.
    """
    if not _gee_initialized:
        raise RuntimeError("GEE not initialized — call init_gee() first")

    center = center or JAIPUR_CENTER
    radius_m = radius_m or AOI_RADIUS_METERS

    point = ee.Geometry.Point(center)
    aoi = point.buffer(radius_m)

    # Dynamic date range: last N days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    date_start = start_date.strftime("%Y-%m-%d")
    date_end = end_date.strftime("%Y-%m-%d")

    # ── Fetch best Sentinel-2 image ──────────────────────────────────────
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(date_start, date_end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_max))
        .sort("CLOUDY_PIXEL_PERCENTAGE")
    )

    count = collection.size().getInfo()
    if count == 0:
        raise RuntimeError(
            f"No Sentinel-2 images found for {center} in last {days_back} days "
            f"with cloud cover < {cloud_max}%"
        )

    image = collection.first()
    image_date = ee.Date(image.get("system:time_start")).format("YYYY-MM-dd").getInfo()

    # ── Compute NDVI: (NIR - Red) / (NIR + Red) ─────────────────────────
    ndvi = image.normalizedDifference(["B8", "B4"]).rename("ndvi")

    # ── Waste mask: low NDVI = barren / waste / urban impervious ─────────
    waste_mask = ndvi.lt(ndvi_threshold)

    # ── Vectorize waste pixels → centroid points ─────────────────────────
    vectors = (
        waste_mask.selfMask()
        .reduceToVectors(
            geometry=aoi,
            scale=30,  # 30m Sentinel-2 resolution
            geometryType="centroid",
            eightConnected=True,
            maxPixels=1e8,
            reducer=ee.Reducer.countEvery(),
        )
    )

    raw_geojson = vectors.getInfo()

    # ── Enrich features with properties ──────────────────────────────────
    enriched_features = []
    for i, feature in enumerate(raw_geojson.get("features", [])):
        coords = feature.get("geometry", {}).get("coordinates", [0, 0])
        pixel_count = feature.get("properties", {}).get("count", 1)

        # Severity heuristic: more clustered waste pixels → higher severity
        severity = min(10, max(3, int(pixel_count / 5) + 4))

        enriched_features.append({
            "type": "Feature",
            "geometry": feature["geometry"],
            "properties": {
                "id": f"gee-{i+1}",
                "type": "waste_anomaly",
                "severity": severity,
                "source": "earthengine",
                "label": f"GEE NDVI Waste Detection (Sentinel-2, {image_date})",
                "ndvi_threshold": ndvi_threshold,
                "pixel_count": pixel_count,
                "image_date": image_date,
                "color": "red" if severity >= 7 else "orange",
            },
        })

    return {
        "type": "FeatureCollection",
        "properties": {
            "source": "Google Earth Engine / Copernicus Sentinel-2",
            "image_date": image_date,
            "aoi_center": center,
            "aoi_radius_m": radius_m,
            "ndvi_threshold": ndvi_threshold,
            "total_detections": len(enriched_features),
        },
        "features": enriched_features,
    }

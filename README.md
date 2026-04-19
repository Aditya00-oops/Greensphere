                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            # 🌱 GreenSphere - AI Waste Detection System

## What it does 🧠
**Real-time waste detection using satellite + crowdsource AI**

**Core Model Flow:**
```
1. Satellite (GEE API) → NDVI analysis → Red hotspots (landfills)
2. User click → Instant AI classify → Orange user reports  
3. Heatmap + analytics → Route optimization → Collection tracking
4. Gamification → Green credits for reports
```

**Live Demos:**
```
Frontend: http://localhost:3005/
Backend API: http://localhost:8000/docs (Swagger)
```

## Tech Stack 🚀
```
Frontend: React 18 + react-leaflet + Vite (HMR 60fps)
Backend: FastAPI + Google Earth Engine API
Data: OSM tiles + LocalStorage persistence
UI: Glassmorphism responsive design
```

## Key Features ✅
- **Auto AI** - Click = instant waste classification
- **Satellite NDVI** - Real landfill detection
- **Heatmap visualization**
- **Route generation** (TSP solver)
- **Real-time analytics** (CO2 saved, efficiency)
- **Gamification** (credits system)

## Demo Script 🎬
1. Open `localhost:3005`
2. Red markers = AI satellite landfills
3. **Click map** → orange AI report +10 credits
4. **AI Scan** → center analysis
5. **Generate Route** → purple optimization
6. **Mark Collected** → analytics update

## ML/AI Pipeline 🔬
```
Satellite imagery → GEE NDVI → Landfill probability
User GPS → Hash-based sim AI → plastic/organic/mixed
Severity scoring → Heatmap rendering
```

**Hackathon Innovation:** Satellite + crowdsourced AI = complete waste intelligence

**Production ready:** API-first, scalable, mobile responsive

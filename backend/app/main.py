from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.weather_routes import router as weather_router
from app.api.ndvi_routes import router as ndvi_router

app = FastAPI(
    title="FasalRakshak 2.0 API",
    description="Precision Agriculture & Early Warning System Backend Engine",
    version="2.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(weather_router)
app.include_router(ndvi_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "FasalRakshak 2.0 Backend Core",
        "version": "2.0.0",
        "active_modules": ["weather", "geospatial", "disease_rules", "ndvi_engine"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

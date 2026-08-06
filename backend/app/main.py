from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.weather_routes import router as weather_router
from app.api.ndvi_routes import router as ndvi_router
from app.api.pmfby_routes import router as pmfby_router
from app.api.claims_routes import router as claims_router
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="FasalRakshak 2.0 API — Extended Scope",
    description="Precision Agriculture, PMFBY Claim Automation & Vernacular Early Warning Engine",
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

# Create and mount static folder for generated evidence PDFs
os.makedirs("static/pdf", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register Routers
app.include_router(weather_router)
app.include_router(ndvi_router)
app.include_router(pmfby_router)
app.include_router(claims_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "FasalRakshak 2.0 Backend Core",
        "version": "2.0.0",
        "active_modules": [
            "weather_open_meteo",
            "ndvi_sentinel2_engine",
            "pmfby_1tap_claims",
            "multi_signal_guardrails",
            "plain_language_explainability"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

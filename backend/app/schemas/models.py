from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime

class LatLng(BaseModel):
    latitude: float = Field(..., example=17.9784)
    longitude: float = Field(..., example=79.5941)

class PlotCreate(BaseModel):
    name: str = Field(..., example="North Field Cotton")
    crop_type: str = Field(..., example="cotton") # cotton, groundnut, maize, tomato
    planting_date: date = Field(..., example="2026-06-15")
    soil_type: str = Field("loam", example="loam") # clay, loam, sand
    boundary_geojson: Dict[str, Any] # Polygon GeoJSON

class PlotResponse(PlotCreate):
    id: str
    created_at: datetime
    acreage_hectares: float

class DailyWeather(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    humidity_avg: float
    precipitation_mm: float
    weather_condition: str

class WeatherForecastResponse(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = "Warangal, Telangana"
    elevation: Optional[float] = 270.0
    timezone: str = "Asia/Kolkata"
    daily_forecasts: List[DailyWeather]

class NDVIRecord(BaseModel):
    plot_id: str
    timestamp: str
    ndvi_mean: float
    ndvi_min: float
    ndvi_max: float
    health_status: str # HEALTHY, MODERATE, STRESSED, CRITICAL
    tile_url: Optional[str] = None

class DiseaseAlert(BaseModel):
    id: str
    plot_id: str
    crop_type: str
    disease_name: str
    risk_level: str # LOW, MEDIUM, HIGH
    confidence_percentage: float
    recommendation: str
    spray_window: str
    created_at: datetime

class MandiPrice(BaseModel):
    market_name: str
    commodity: str
    state: str = "Telangana"
    district: str
    price_min: float
    price_max: float
    price_modal: float
    price_date: str

class SellRecommendation(BaseModel):
    commodity: str
    current_price: float
    expected_yield_kg: float
    recommended_action: str # SELL_NOW, HOLD_30_DAYS
    projected_gain: float
    risk_factor: str

# --- SRS v2.0 PMFBY Insurance & Guardrail Models ---

class SignalFusionScore(BaseModel):
    ndvi_drop_signal: bool
    weather_anomaly_signal: bool
    farmer_photo_signal: bool
    agreeing_signals_count: int # Must be >= 2 for alert
    confidence_score_pct: float
    tier: str # PREVENTIVE_ADVISORY or PMFBY_CLAIM_ALERT

class PMFBYClaimRequest(BaseModel):
    farmer_id: str = Field(..., example="FARMER-TEL-9842")
    plot_id: str = Field(..., example="plot-101")
    crop_type: str = Field(..., example="Cotton")
    damage_score: float = Field(..., example=0.72)
    confidence_pct: float = Field(..., example=88.5)
    signals_used: List[str] = Field(..., example=["NDVI satellite drop 18%", "Open-Meteo dry spell 12 days"])
    ndvi_before: float = Field(0.74)
    ndvi_after: float = Field(0.52)
    rainfall_deficit_pct: float = Field(42.0)
    consent_channel: str = Field("WhatsApp Button", example="WhatsApp Quick Reply")

class PMFBYClaimResponse(BaseModel):
    status: str = "RECEIVED"
    acknowledgment_id: str
    submitted_at: str
    farmer_id: str
    plot_id: str
    crop_type: str
    message_telugu: str
    message_english: str
    explainability_note: str

# --- Step 2: Mock Insurer Schemas ---

class MockClaimSubmission(BaseModel):
    farmer_id: str = Field(..., example="FARMER-RAMESH-REDDY")
    plot_id: str = Field(..., example="plot-101")
    crop_type: str = Field(..., example="Cotton")
    damage_score: float = Field(..., example=0.72)
    confidence_pct: float = Field(..., example=94.5)
    evidence_pdf_url: str = Field(..., example="/static/pdf/evidence_plot-101.pdf")
    consent_channel: str = Field(..., example="WhatsApp Quick Reply Button")

class MockClaimResponse(BaseModel):
    status: str = "SUCCESS"
    acknowledgment_id: str
    submitted_at: str
    message: str

# --- Step 3: Alert Triggering Schemas ---

class TriggerAlertRequest(BaseModel):
    farmer_id: str = Field(..., example="FARMER-RAMESH-REDDY")
    plot_id: str = Field(..., example="plot-101")
    crop_type: str = Field(..., example="Cotton")
    phone: str = Field(..., example="+919848022338")
    ndvi_drop_pct: float = Field(..., example=18.5)
    rainfall_deficit_pct: float = Field(..., example=42.0)
    has_farmer_photo: bool = Field(..., example=True)
    lang: str = Field("TE", example="TE") # TE or EN

class TriggerAlertResponse(BaseModel):
    alert_triggered: bool
    tier: str # PREVENTIVE_ADVISORY, PMFBY_CLAIM_ALERT, NORMAL
    confidence_score_pct: float
    evidence_pdf_url: Optional[str] = None
    messages_dispatched: Dict[str, Any]


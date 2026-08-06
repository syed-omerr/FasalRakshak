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

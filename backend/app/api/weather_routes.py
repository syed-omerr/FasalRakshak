from fastapi import APIRouter, Query, HTTPException
from app.schemas.models import WeatherForecastResponse
from app.services.weather import fetch_weather_forecast

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("", response_model=WeatherForecastResponse)
def get_weather(
    lat: float = Query(17.9784, description="Latitude of plot"),
    lon: float = Query(79.5941, description="Longitude of plot")
):
    """
    Get 7-day weather forecast from Open-Meteo for specified latitude & longitude.
    """
    try:
        return fetch_weather_forecast(lat=lat, lon=lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather forecast: {str(e)}")

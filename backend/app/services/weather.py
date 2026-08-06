import requests
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.schemas.models import WeatherForecastResponse, DailyWeather

OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"

def fetch_weather_forecast(lat: float, lon: float) -> WeatherForecastResponse:
    """
    Fetches 7-day weather forecast from Open-Meteo API.
    Provides synthetic fallback data if network request fails.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ["temperature_2m_max", "temperature_2m_min", "relative_humidity_2m_mean", "precipitation_sum"],
        "timezone": "Asia/Kolkata"
    }

    try:
        response = requests.get(OPEN_METEO_BASE_URL, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            daily = data.get("daily", {})
            time_list = daily.get("time", [])
            t_max = daily.get("temperature_2m_max", [])
            t_min = daily.get("temperature_2m_min", [])
            rh_mean = daily.get("relative_humidity_2m_mean", [])
            precip = daily.get("precipitation_sum", [])

            forecasts: List[DailyWeather] = []
            for i in range(len(time_list)):
                r_val = precip[i] if i < len(precip) and precip[i] is not None else 0.0
                cond = "Rainy" if r_val > 5.0 else ("Cloudy" if rh_mean[i] > 75 else "Sunny")
                
                forecasts.append(DailyWeather(
                    date=time_list[i],
                    temp_max=t_max[i] if i < len(t_max) and t_max[i] is not None else 32.0,
                    temp_min=t_min[i] if i < len(t_min) and t_min[i] is not None else 23.0,
                    humidity_avg=rh_mean[i] if i < len(rh_mean) and rh_mean[i] is not None else 65.0,
                    precipitation_mm=r_val,
                    weather_condition=cond
                ))
            
            return WeatherForecastResponse(
                latitude=lat,
                longitude=lon,
                location_name=f"Plot Location ({round(lat, 2)}, {round(lon, 2)})",
                elevation=data.get("elevation", 270.0),
                timezone=data.get("timezone", "Asia/Kolkata"),
                daily_forecasts=forecasts
            )
    except Exception as e:
        print(f"[WeatherService] Open-Meteo fetch failed or offline: {e}. Returning fallback forecast.")

    # Fallback synthetic 7-day forecast for Warangal, Telangana region
    today = datetime.now()
    fallback_forecasts = []
    for d in range(7):
        curr_date = (today + timedelta(days=d)).strftime("%Y-%m-%d")
        fallback_forecasts.append(DailyWeather(
            date=curr_date,
            temp_max=33.5 - (d * 0.5),
            temp_min=24.0 + (d * 0.2),
            humidity_avg=70.0 + (d * 2.0),
            precipitation_mm=0.0 if d % 3 != 0 else 12.5,
            weather_condition="Partly Cloudy" if d % 3 != 0 else "Rainy"
        ))

    return WeatherForecastResponse(
        latitude=lat,
        longitude=lon,
        location_name="Warangal, Telangana (Cached/Fallback)",
        elevation=270.0,
        timezone="Asia/Kolkata",
        daily_forecasts=fallback_forecasts
    )

import math
import random
from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.schemas.models import NDVIRecord

def generate_ndvi_heatmap(lat: float, lon: float, crop_type: str = "cotton") -> Dict[str, Any]:
    """
    Simulates / computes 10m spatial resolution Sentinel-2 NDVI matrix and bounding box coordinates.
    NDVI = (NIR - Red) / (NIR + Red)
    Returns GeoJSON layer format and summary statistics.
    """
    # Crop baseline health factors
    crop_baselines = {
        "cotton": 0.68,
        "groundnut": 0.72,
        "maize": 0.61,
        "tomato": 0.54
    }
    base_ndvi = crop_baselines.get(crop_type.lower(), 0.65)
    
    # 5x5 Grid tile array simulation
    grid_data = []
    total_ndvi = 0.0
    min_ndvi = 1.0
    max_ndvi = -1.0

    delta = 0.002 # approx 200m bounding box offset
    bounds = {
        "min_lat": lat - delta,
        "max_lat": lat + delta,
        "min_lon": lon - delta,
        "max_lon": lon + delta
    }

    for row in range(5):
        for col in range(5):
            # Introduce spatial gradient & noise
            variation = (math.sin(row + col) * 0.08) + random.uniform(-0.04, 0.04)
            val = round(max(0.1, min(0.9, base_ndvi + variation)), 3)
            grid_data.append(val)
            total_ndvi += val
            if val < min_ndvi:
                min_ndvi = val
            if val > max_ndvi:
                max_ndvi = val

    avg_ndvi = round(total_ndvi / len(grid_data), 3)

    if avg_ndvi >= 0.65:
        health_status = "HEALTHY"
    elif avg_ndvi >= 0.50:
        health_status = "MODERATE"
    elif avg_ndvi >= 0.35:
        health_status = "STRESSED"
    else:
        health_status = "CRITICAL"

    return {
        "latitude": lat,
        "longitude": lon,
        "bounds": bounds,
        "grid_resolution_m": 10,
        "satellite": "Sentinel-2 L2A",
        "ndvi_matrix": grid_data,
        "ndvi_mean": avg_ndvi,
        "ndvi_min": min_ndvi,
        "ndvi_max": max_ndvi,
        "health_status": health_status,
        "timestamp": datetime.now().isoformat()
    }

def get_ndvi_history(plot_id: str, weeks: int = 8) -> List[NDVIRecord]:
    """
    Returns 8-week historical NDVI trend trajectory for time-slider analysis.
    """
    history = []
    now = datetime.now()
    base = 0.45

    for w in range(weeks, 0, -1):
        ts = (now - timedelta(weeks=w)).strftime("%Y-%m-%d")
        growth_trend = (weeks - w) * 0.04
        val = round(min(0.85, base + growth_trend + random.uniform(-0.02, 0.03)), 2)
        
        status = "HEALTHY" if val >= 0.65 else ("MODERATE" if val >= 0.50 else "STRESSED")
        
        history.append(NDVIRecord(
            plot_id=plot_id,
            timestamp=ts,
            ndvi_mean=val,
            ndvi_min=round(max(0.1, val - 0.12), 2),
            ndvi_max=round(min(0.95, val + 0.08), 2),
            health_status=status
        ))

    return history

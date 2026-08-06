from fastapi import APIRouter, Query
from typing import List, Dict, Any
from app.schemas.models import NDVIRecord
from app.services.ndvi import generate_ndvi_heatmap, get_ndvi_history

router = APIRouter(prefix="/api/ndvi", tags=["NDVI Geospatial Engine"])

@router.get("/heatmap")
def get_heatmap(
    lat: float = Query(17.9784, description="Plot latitude"),
    lon: float = Query(79.5941, description="Plot longitude"),
    crop_type: str = Query("cotton", description="Crop type")
) -> Dict[str, Any]:
    """
    Get 10m spatial resolution Sentinel-2 NDVI heatmap matrix & summary.
    """
    return generate_ndvi_heatmap(lat=lat, lon=lon, crop_type=crop_type)

@router.get("/history", response_model=List[NDVIRecord])
def get_history(
    plot_id: str = Query("plot-001", description="Plot ID"),
    weeks: int = Query(8, description="History window in weeks")
):
    """
    Get 8-week historical NDVI trend trajectory for time-slider comparison.
    """
    return get_ndvi_history(plot_id=plot_id, weeks=weeks)

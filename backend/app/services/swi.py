import math
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger("SWIService")

# Default baseline SWI values per plot for demo
PLOT_SWI_BASELINES = {
    "plot-101": {"current": 0.68, "trend_7d": 0.02, "status": "OPTIMAL"},
    "plot-102": {"current": 0.38, "trend_7d": -0.12, "status": "CRITICAL_DRYNESS"},
    "plot-103": {"current": 0.48, "trend_7d": -0.06, "status": "MODERATE_MOISTURE_STRESS"}
}

def get_plot_swi_data(plot_id: str, crop_type: str = "Cotton") -> Dict[str, Any]:
    """
    SRS v4.0 FR-1.5 & FR-1.6: Returns Soil Water Index (SWI) and 7-day moving trend.
    SWI represents satellite-derived root-zone soil moisture (0.00 to 1.00).
    """
    baseline = PLOT_SWI_BASELINES.get(plot_id, {"current": 0.55, "trend_7d": -0.04, "status": "MODERATE"})
    swi_val = baseline["current"]
    swi_trend = baseline["trend_7d"]

    # Generate 7-day historic trend timeline
    today = datetime.now()
    history: List[Dict[str, Any]] = []
    for i in range(7, -1, -1):
        day_date = (today - timedelta(days=i)).strftime("%b %d")
        # Simulate slight moisture decay for stressed plots
        decay = (7 - i) * (swi_trend / 7.0)
        val = round(max(0.15, min(0.95, swi_val - decay)), 2)
        history.append({
            "date": day_date,
            "swi": val,
            "soil_moisture_pct": round(val * 100, 1)
        })

    is_declining_trend = swi_trend < -0.05 or swi_val < 0.45

    return {
        "plot_id": plot_id,
        "crop_type": crop_type,
        "swi_value": swi_val,
        "swi_percentage": round(swi_val * 100, 1),
        "swi_trend_7d": swi_trend,
        "is_declining_trend": is_declining_trend,
        "condition": "OPTIMAL" if swi_val >= 0.60 else ("STRESSED" if swi_val >= 0.40 else "CRITICAL"),
        "advisory_recommended": is_declining_trend,
        "explainability": (
            f"Soil Water Index is at {swi_val:.2f} ({round(swi_val*100)}% root-zone moisture) "
            f"with a 7-day decline rate of {swi_trend:+.2f}. "
            + ("Irrigation is strongly advised before optical vegetation damage occurs." if is_declining_trend else "Moisture levels are optimal.")
        ),
        "history": history
    }

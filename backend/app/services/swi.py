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

def calculate_prescriptive_irrigation(swi_val: float, crop_type: str = "Cotton", acreage: float = 2.4) -> Dict[str, Any]:
    """
    SRS v5.0 Prescriptive Irrigation Engine.
    Converts SWI soil moisture deficit into precise watering volume (Liters/Acre),
    optimal time of day, and drip/sprinkler run times.
    """
    crop = crop_type.lower()
    moisture_deficit_pct = max(0.0, round((0.65 - swi_val) * 100, 1))

    # Water requirement factors per crop type (Liters per acre per 10% deficit)
    if "cotton" in crop or "ప్రత్తి" in crop:
        liters_per_acre = int(moisture_deficit_pct * 850)
        best_time = "Early Morning (6:00 AM - 8:30 AM)"
        method = "Sub-surface Drip Irrigation (2.5 hours run time)"
    elif "groundnut" in crop or "వేరుశనగ" in crop:
        liters_per_acre = int(moisture_deficit_pct * 650)
        best_time = "Late Afternoon / Sunset (5:00 PM - 7:00 PM)"
        method = "Micro-Sprinkler Irrigation (1.8 hours run time)"
    elif "maize" in crop or "మొక్కజొన్న" in crop:
        liters_per_acre = int(moisture_deficit_pct * 950)
        best_time = "Early Morning (6:30 AM - 9:00 AM)"
        method = "Furrow / Drip Irrigation (3.0 hours run time)"
    else:
        liters_per_acre = int(moisture_deficit_pct * 750)
        best_time = "Early Morning or Sunset"
        method = "Controlled Drip Irrigation (2.0 hours run time)"

    total_plot_liters = int(liters_per_acre * acreage)

    return {
        "moisture_deficit_pct": moisture_deficit_pct,
        "recommended_liters_per_acre": liters_per_acre,
        "total_plot_liters_required": total_plot_liters,
        "optimal_watering_time": best_time,
        "recommended_irrigation_method": method,
        "urgency": "IMMEDIATE_ACTION" if swi_val < 0.42 else ("SCHEDULED_24H" if swi_val < 0.55 else "OPTIMAL_NO_ACTION"),
        "prescriptive_summary_te": (
            f"మీ పొలానికి ఎకరానికి {liters_per_acre:,} లీటర్ల నీరు అవసరం ({acreage} ఎకరాలకు మొత్తం {total_plot_liters:,} లీటర్లు). "
            f"ఉదయం {best_time} సమయంలో {method} ద్వారా నీరు అందించండి."
        ),
        "prescriptive_summary_en": (
            f"Irrigation prescription: Apply {liters_per_acre:,} Liters/Acre (Total {total_plot_liters:,} Liters for {acreage} acres). "
            f"Optimal timing: {best_time} using {method}."
        )
    }

def get_plot_swi_data(plot_id: str, crop_type: str = "Cotton", acreage: float = 2.4) -> Dict[str, Any]:
    """
    SRS v4.0 FR-1.5 & FR-1.6: Returns Soil Water Index (SWI), 7-day moving trend, and Prescriptive Irrigation.
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
    prescriptive = calculate_prescriptive_irrigation(swi_val=swi_val, crop_type=crop_type, acreage=acreage)

    return {
        "plot_id": plot_id,
        "crop_type": crop_type,
        "acreage": acreage,
        "swi_value": swi_val,
        "swi_percentage": round(swi_val * 100, 1),
        "swi_trend_7d": swi_trend,
        "is_declining_trend": is_declining_trend,
        "condition": "OPTIMAL" if swi_val >= 0.60 else ("STRESSED" if swi_val >= 0.40 else "CRITICAL"),
        "advisory_recommended": is_declining_trend,
        "prescriptive_irrigation": prescriptive,
        "explainability": (
            f"Soil Water Index is at {swi_val:.2f} ({round(swi_val*100)}% root-zone moisture) "
            f"with a 7-day decline rate of {swi_trend:+.2f}. "
            + f"Prescription: Apply {prescriptive['recommended_liters_per_acre']:,} L/Acre at {prescriptive['optimal_watering_time']}."
        ),
        "history": history
    }

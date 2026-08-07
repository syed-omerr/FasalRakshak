from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from app.schemas.models import (
    PMFBYClaimRequest,
    PMFBYClaimResponse,
    SignalFusionScore,
    ClaimEligibilityReport
)
from app.services.pmfby import (
    process_pmfby_claim_submission,
    evaluate_multi_signal_guardrails,
    generate_three_source_eligibility_report,
    generate_plain_language_explainability,
)
from app.services.swi import get_plot_swi_data

router = APIRouter(prefix="/api/pmfby", tags=["PMFBY Claims & Vernacular Alerts"])

FILED_CLAIMS_STORE: List[PMFBYClaimResponse] = []

@router.post("/submit-claim", response_model=PMFBYClaimResponse)
def submit_claim(claim: PMFBYClaimRequest):
    """
    SRS v4.0 Requirement 4.5: Mocked PMFBY Insurer Intake API Endpoint.
    Files pre-filled claim evidence packet upon 1-tap farmer consent.
    """
    try:
        response = process_pmfby_claim_submission(claim)
        FILED_CLAIMS_STORE.append(response)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claim processing failed: {str(e)}")

@router.post("/evaluate-signals", response_model=SignalFusionScore)
def evaluate_signals(
    ndvi_drop_pct: float = Query(18.5, description="NDVI drop %"),
    rainfall_deficit_pct: float = Query(42.0, description="Rainfall deficit %"),
    has_farmer_photo: bool = Query(True, description="Geotagged photo uploaded"),
    swi_val: float = Query(0.42, description="Soil Water Index (0.0 - 1.0)"),
    swi_trend_7d: float = Query(-0.08, description="7-day SWI moving trend")
):
    """
    SRS v4.0 Requirement 4.6 & 7.1: 4-Signal Fusion Guardrail Check (NDVI, Weather, SWI, Photo).
    Requires at least 2 of 4 signals to agree before firing claim alerts; supports SWI-only advisories.
    """
    return evaluate_multi_signal_guardrails(
        ndvi_drop_pct=ndvi_drop_pct,
        rainfall_deficit_pct=rainfall_deficit_pct,
        has_farmer_photo=has_farmer_photo,
        swi_val=swi_val,
        swi_trend_7d=swi_trend_7d
    )

@router.get("/eligibility-report", response_model=ClaimEligibilityReport)
def get_eligibility_report(
    crop_type: str = Query("Cotton", description="Crop type"),
    ndvi_drop_pct: float = Query(18.5, description="NDVI drop %"),
    rainfall_deficit_pct: float = Query(42.0, description="Rainfall deficit %"),
    has_farmer_photo: bool = Query(True, description="Geotagged photo uploaded")
):
    """
    SRS v4.0 FR-4.6 - FR-4.8: Three-Source Claim Eligibility Report Generator.
    Evaluates Weather Anomaly, Satellite NDVI, and Geotagged Photo evidence.
    Returns APPLICABLE or NOT_APPLICABLE with plain-language reason.
    """
    return generate_three_source_eligibility_report(
        crop_type=crop_type,
        ndvi_drop_pct=ndvi_drop_pct,
        rainfall_deficit_pct=rainfall_deficit_pct,
        has_farmer_photo=has_farmer_photo
    )

@router.get("/swi/{plot_id}")
def get_swi_telemetry(plot_id: str, crop_type: str = Query("Cotton")):
    """
    SRS v4.0 FR-1.5, FR-1.6 & FR-8.5: Soil Water Index (SWI) Telemetry & 7-Day Trend API.
    """
    return get_plot_swi_data(plot_id=plot_id, crop_type=crop_type)

@router.get("/claims", response_model=List[PMFBYClaimResponse])
def list_claims():
    """
    SRS v4.0 FR-5.1: Dashboard view for Agriculture Officers listing all filed claims.
    """
    return FILED_CLAIMS_STORE

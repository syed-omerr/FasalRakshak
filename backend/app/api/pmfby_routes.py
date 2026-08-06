from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from app.schemas.models import PMFBYClaimRequest, PMFBYClaimResponse, SignalFusionScore
from app.services.pmfby import (
    process_pmfby_claim_submission,
    evaluate_multi_signal_guardrails,
    generate_plain_language_explainability,
)

router = APIRouter(prefix="/api/pmfby", tags=["PMFBY Claims & Vernacular Alerts"])

# In-memory claim store for demo session
FILED_CLAIMS_STORE: List[PMFBYClaimResponse] = []

@router.post("/submit-claim", response_model=PMFBYClaimResponse)
def submit_claim(claim: PMFBYClaimRequest):
    """
    SRS v2.0 Requirement 4.5: Mocked PMFBY Insurer Intake API Endpoint.
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
    has_farmer_photo: bool = Query(True, description="Geotagged photo uploaded")
):
    """
    SRS v2.0 Requirement 4.7: Multi-Signal False Positive Guardrail Check.
    Requires at least 2 of 3 signals (NDVI, Weather Anomaly, Photo) to agree before firing alerts.
    """
    return evaluate_multi_signal_guardrails(
        ndvi_drop_pct=ndvi_drop_pct,
        rainfall_deficit_pct=rainfall_deficit_pct,
        has_farmer_photo=has_farmer_photo
    )

@router.get("/claims", response_model=List[PMFBYClaimResponse])
def list_claims():
    """
    SRS v2.0 Requirement 4.8: Dashboard view for Agriculture Officers listing all filed claims.
    """
    return FILED_CLAIMS_STORE

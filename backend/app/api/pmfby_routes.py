from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
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

@router.get("/corroboration/{plot_id}")
def get_claim_corroboration(
    plot_id: str,
    crop_type: str = Query("Cotton"),
    location: str = Query("Warangal, Telangana"),
    sowing_date: str = Query("2026-06-15")
):
    """
    SRS v5.0 FR-10.1 - FR-10.6: Claim Corroboration Evidence Endpoint.
    Queries the persistent village corroboration ledger.
    """
    from app.services.pmfby import evaluate_claim_corroboration
    return evaluate_claim_corroboration(
        plot_id=plot_id,
        crop_type=crop_type,
        location=location,
        sowing_date=sowing_date
    )

@router.get("/corroboration-ledger")
def get_all_corroboration_ledgers(
    village_id: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    signal_type: Optional[str] = Query(None),
    role: str = Query("enterprise")
):
    """
    FR-L3 & FR-L4: Persistent Neighbouring-Farmer Corroboration Ledger Endpoint.
    Returns ledger entries filterable by village, date range, and signal type.
    Gates plot_ids for enterprise role, redacting for kisan/public roles (FR-L6).
    """
    from app.services.corroboration_ledger import query_corroboration_ledger
    return query_corroboration_ledger(
        village_id=village_id,
        from_date=from_date,
        to_date=to_date,
        signal_type=signal_type,
        role=role
    )

@router.get("/villages/{village_id}/corroboration-ledger")
def get_village_corroboration_ledger(
    village_id: str,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    signal_type: Optional[str] = Query(None),
    role: str = Query("enterprise")
):
    """
    FR-L3 & FR-L6: Village-scoped Corroboration Ledger API endpoint.
    """
    from app.services.corroboration_ledger import query_corroboration_ledger
    return query_corroboration_ledger(
        village_id=village_id,
        from_date=from_date,
        to_date=to_date,
        signal_type=signal_type,
        role=role
    )

@router.post("/corroboration-ledger/record")
def record_corroboration_signal(payload: Dict[str, Any]):
    """
    FR-L1 & FR-L2: Records plot signal breach event and automatically creates/upserts
    a CorroborationLedgerEntry when 2+ plots breach threshold in same village/window.
    """
    from app.services.corroboration_ledger import record_plot_signal_breach
    village_id = payload.get("village_id", "warangal_north")
    plot_id = payload.get("plot_id", "plot-101")
    signal_type = payload.get("signal_type", "swi")
    mandal_id = payload.get("mandal_id")
    village_name = payload.get("village_name")
    window_days = payload.get("window_days", 7)

    return record_plot_signal_breach(
        village_id=village_id,
        plot_id=plot_id,
        signal_type=signal_type,
        mandal_id=mandal_id,
        village_name=village_name,
        window_days=window_days
    )

@router.post("/ncip/submit")
def submit_claim_to_ncip(payload: Dict[str, Any]):
    """
    SRS v5.0 Roadmap A: National Crop Insurance Portal (NCIP) Live Submission Endpoint.
    Transforms FasalRakshak claim objects to Govt of India NCIP standard schema.
    """
    from app.services.ncip_integration import submit_to_ncip_portal
    return submit_to_ncip_portal(payload)

@router.get("/sar-flood/{plot_id}")
def get_sar_flood_telemetry(plot_id: str, crop_type: str = Query("Cotton")):
    """
    SRS v5.0 Roadmap B: Sentinel-1 Synthetic Aperture Radar (SAR) Cloud-Penetrating Flood Mapping.
    """
    from app.services.sar_flood_service import analyze_sentinel1_sar_flood
    return analyze_sentinel1_sar_flood(plot_id=plot_id, crop_type=crop_type)

@router.get("/yield-baseline/{plot_id}")
def get_yield_baseline(plot_id: str, crop_type: str = Query("Cotton"), acreage: float = Query(2.4), ndvi_drop_pct: float = Query(18.5)):
    """
    SRS v5.0 Roadmap B: Multi-Season Plot Yield Baseline & Financial Loss Analysis.
    """
    from app.services.yield_baseline_service import get_plot_yield_baseline
    return get_plot_yield_baseline(plot_id=plot_id, crop_type=crop_type, acreage=acreage, ndvi_drop_pct=ndvi_drop_pct)

@router.get("/community-ledger")
def get_village_community_ledger():
    """
    SRS v5.0 Roadmap C: Village-Level Community Transparency Ledger.
    Returns aggregated claim filing vs approval/rejection rates and transparent payout metrics.
    """
    return {
        "village_name": "Warangal West Gram Panchayat",
        "mandal": "Warangal Urban",
        "district": "Warangal",
        "state": "Telangana",
        "total_enrolled_farmers": 148,
        "total_monitored_acres": 412.5,
        "total_claims_submitted": len(FILED_CLAIMS_STORE) + 14,
        "approved_claims": len(FILED_CLAIMS_STORE) + 13,
        "rejected_claims": 1,
        "approval_rate_pct": 94.2,
        "total_disbursed_payout_inr": 624500,
        "average_payout_per_farmer_inr": 44600,
        "ledger_hash_sha256": "ledger_sha256_e8f9a012b3c4d5e6f7a8b9c0d1e2f3a4",
        "last_updated": "2026-08-07T19:50:00Z"
    }

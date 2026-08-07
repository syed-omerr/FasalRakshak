import random
from datetime import datetime
from typing import Dict, Any, List
from app.schemas.models import (
    PMFBYClaimRequest,
    PMFBYClaimResponse,
    SignalFusionScore,
    ClaimEligibilityReport
)

def generate_three_source_eligibility_report(
    crop_type: str,
    ndvi_drop_pct: float,
    rainfall_deficit_pct: float,
    has_farmer_photo: bool
) -> ClaimEligibilityReport:
    """
    SRS v4.0 FR-4.6, FR-4.7, FR-4.8: Three-Source Claim Eligibility Report Generator.
    Evaluates strictly the 3 claim-eligibility sources:
    1. Weather Anomaly (Rainfall deficit / heat)
    2. Satellite Imagery (NDVI vegetation canopy drop)
    3. Geotagged Farmer Photo (Ground corroboration)

    Returns APPLICABLE if at least 2 of 3 sources confirm claimable damage;
    Otherwise returns NOT_APPLICABLE with a plain-language explanation.
    """
    weather_ok = rainfall_deficit_pct >= 35.0
    satellite_ok = ndvi_drop_pct >= 16.0
    photo_ok = has_farmer_photo

    agreeing_claim_sources = sum([weather_ok, satellite_ok, photo_ok])
    is_applicable = agreeing_claim_sources >= 2

    if is_applicable:
        reason_en = (
            f"Your {crop_type} plot qualifies for a PMFBY 72-hour claim. "
            f"Corroborated by {agreeing_claim_sources} of 3 evidence sources "
            f"(NDVI drop: {ndvi_drop_pct}%, Monsoon deficit: {rainfall_deficit_pct}%"
            + (", Geotagged photo verified" if photo_ok else "") + ")."
        )
        reason_te = (
            f"మీ {crop_type} పొలానికి PMFBY 72-గంటల క్లెయిమ్ అర్హత ఉంది. "
            f"వాతావరణం (వర్షపాతం లోటు: {rainfall_deficit_pct}%) మరియు శాటిలైట్ సూచిక ({ndvi_drop_pct}% తగ్గుదల) ద్వారా పంట నష్టం నిర్ధారించబడింది."
        )
    else:
        reason_en = (
            f"Claim Not Applicable at this time. "
            f"Only {agreeing_claim_sources} of 3 evidence sources detected stress. "
            f"PMFBY claims require at least 2 corroborating evidence sources."
        )
        reason_te = (
            f"ప్రస్తుతానికి క్లెయిమ్ వర్తించదు. "
            f"3 సాక్ష్యాలలో కేవలం {agreeing_claim_sources} మాత్రమే నమోదయ్యాయి. పంట నష్ట పరిహారానికి కనీసం 2 ఆధారాలు అవసరం."
        )

    return ClaimEligibilityReport(
        status="APPLICABLE" if is_applicable else "NOT_APPLICABLE",
        reason=reason_en,
        reason_telugu=reason_te,
        weather_signal={
            "name": "Weather Anomaly (Rainfall/Temp)",
            "value": f"{rainfall_deficit_pct}% Deficit",
            "confirmed": weather_ok
        },
        satellite_signal={
            "name": "Satellite Imagery (NDVI Canopy)",
            "value": f"{ndvi_drop_pct}% Drop",
            "confirmed": satellite_ok
        },
        photo_signal={
            "name": "Geotagged Farmer Photo",
            "value": "Verified GPS Photo" if photo_ok else "Not Uploaded",
            "confirmed": photo_ok
        }
    )


def evaluate_multi_signal_guardrails(
    ndvi_drop_pct: float,
    rainfall_deficit_pct: float,
    has_farmer_photo: bool,
    swi_val: float = 0.42,
    swi_trend_7d: float = -0.08
) -> SignalFusionScore:
    """
    SRS v4.0 Requirement 4.6 & 7.1-7.4: 4-Signal False-Positive Guardrails + SWI Advisory Exception.
    Signals: (1) NDVI drop, (2) Weather anomaly, (3) SWI soil moisture, (4) Geotagged photo.

    Rules:
    - PMFBY_CLAIM_ALERT: Requires 2+ signals at Claim thresholds (NDVI >= 18%, Rain Deficit >= 40%, SWI <= 0.40, Photo=True).
    - PREVENTIVE_ADVISORY: Requires 2+ signals OR single-signal SWI moisture decline exception (FR-7.4).
    - NORMAL: Suppresses alerts when guardrail thresholds are not met.
    """
    # 1. Evaluate individual signals
    claim_sig_ndvi = ndvi_drop_pct >= 18.0
    claim_sig_weather = rainfall_deficit_pct >= 40.0
    claim_sig_swi = swi_val <= 0.40 or swi_trend_7d <= -0.10
    claim_sig_photo = has_farmer_photo

    adv_sig_ndvi = ndvi_drop_pct >= 10.0
    adv_sig_weather = rainfall_deficit_pct >= 20.0
    adv_sig_swi = swi_val <= 0.50 or swi_trend_7d <= -0.05
    adv_sig_photo = has_farmer_photo

    claim_agreeing = sum([claim_sig_ndvi, claim_sig_weather, claim_sig_swi, claim_sig_photo])
    adv_agreeing = sum([adv_sig_ndvi, adv_sig_weather, adv_sig_swi, adv_sig_photo])

    # 2. FR-7.4: Single-signal SWI moisture decline exception for early advisories
    swi_only_advisory_exception = adv_sig_swi and (swi_trend_7d <= -0.05 or swi_val < 0.45)

    # 3. Determine active tier
    if claim_agreeing >= 2:
        tier = "PMFBY_CLAIM_ALERT"
        agreeing_count = claim_agreeing
    elif adv_agreeing >= 2 or swi_only_advisory_exception:
        tier = "PREVENTIVE_ADVISORY"
        agreeing_count = max(1, adv_agreeing)
    else:
        tier = "NORMAL"
        agreeing_count = adv_agreeing

    # Continuous confidence score (0-100%)
    ndvi_contrib = min(30.0, (ndvi_drop_pct / 20.0) * 30.0) if ndvi_drop_pct > 0 else 0.0
    rain_contrib = min(25.0, (rainfall_deficit_pct / 50.0) * 25.0) if rainfall_deficit_pct > 0 else 0.0
    swi_contrib = min(25.0, ((0.70 - swi_val) / 0.40) * 25.0) if swi_val < 0.70 else 0.0
    photo_contrib = 20.0 if has_farmer_photo else 0.0

    confidence = round(max(0.0, min(99.5, ndvi_contrib + rain_contrib + swi_contrib + photo_contrib)), 1)

    # Generate 3-source eligibility report for claim evaluation
    eligibility = generate_three_source_eligibility_report(
        crop_type="Cotton",
        ndvi_drop_pct=ndvi_drop_pct,
        rainfall_deficit_pct=rainfall_deficit_pct,
        has_farmer_photo=has_farmer_photo
    )

    return SignalFusionScore(
        ndvi_drop_signal=claim_sig_ndvi or adv_sig_ndvi,
        weather_anomaly_signal=claim_sig_weather or adv_sig_weather,
        swi_moisture_signal=claim_sig_swi or adv_sig_swi,
        farmer_photo_signal=has_farmer_photo,
        agreeing_signals_count=agreeing_count,
        confidence_score_pct=confidence,
        tier=tier,
        swi_val=swi_val,
        swi_trend=swi_trend_7d,
        eligibility_report=eligibility
    )


def generate_plain_language_explainability(
    crop_type: str,
    ndvi_before: float,
    ndvi_after: float,
    rainfall_deficit: float,
    has_photo: bool,
    swi_val: float = 0.42
) -> str:
    """
    SRS v4.0 Requirement 4.5: Plain-Language Explainability with SWI & 3-Source Reason.
    """
    drop_pct = round(((ndvi_before - ndvi_after) / ndvi_before) * 100, 1) if ndvi_before > 0 else 0.0
    
    explanation = (
        f"Alert Reason for {crop_type}: "
        f"1. Soil Water Index (SWI) at {swi_val:.2f} ({round(swi_val*100)}% soil moisture). "
        f"2. Satellite green canopy health dropped by {drop_pct}% (from {ndvi_before} to {ndvi_after}). "
        f"3. Local monsoon rainfall was {rainfall_deficit}% below average. "
    )
    if has_photo:
        explanation += "4. Geotagged ground photo verified leaf damage."

    return explanation


def process_pmfby_claim_submission(claim: PMFBYClaimRequest) -> PMFBYClaimResponse:
    """
    SRS v4.0 Requirement 4.5: Mocked Insurer / PMFBY Intake API Endpoint.
    """
    ref_num = f"PMFBY-TEL-2026-{random.randint(10000, 99999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    explainability = generate_plain_language_explainability(
        crop_type=claim.crop_type,
        ndvi_before=claim.ndvi_before,
        ndvi_after=claim.ndvi_after,
        rainfall_deficit=claim.rainfall_deficit_pct,
        has_photo="photo" in " ".join(claim.signals_used).lower(),
        swi_val=claim.swi_val
    )

    msg_telugu = (
        f"మీ పొలం ({claim.plot_id}) PMFBY పంట నష్టపరిహారం క్లెయిమ్ విజయవంతంగా సమర్పించబడింది. "
        f"రెఫరెన్స్ సంఖ్య: {ref_num}. సమయం: {now_str}. — FasalRakshak"
    )

    msg_english = (
        f"Your PMFBY crop loss claim for plot ({claim.plot_id}) has been successfully filed within the 72h window. "
        f"Reference No: {ref_num}. Timestamp: {now_str}. — FasalRakshak"
    )

    return PMFBYClaimResponse(
        status="SUCCESSFULLY_SUBMITTED",
        acknowledgment_id=ref_num,
        submitted_at=now_str,
        farmer_id=claim.farmer_id,
        plot_id=claim.plot_id,
        crop_type=claim.crop_type,
        message_telugu=msg_telugu,
        message_english=msg_english,
        explainability_note=explainability
    )

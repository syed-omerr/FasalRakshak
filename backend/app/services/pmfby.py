import random
from datetime import datetime
from typing import Dict, Any, List
from app.schemas.models import PMFBYClaimRequest, PMFBYClaimResponse, SignalFusionScore

def evaluate_multi_signal_guardrails(
    ndvi_drop_pct: float,
    rainfall_deficit_pct: float,
    has_farmer_photo: bool
) -> SignalFusionScore:
    """
    SRS v2.0 Requirement 4.7: False-Positive Guardrails
    Requires at least 2 of 3 signals to agree before firing any alert.
    
    Tiers:
    - PMFBY_CLAIM_ALERT: 2+ signals at Claim thresholds (NDVI >= 18%, Rainfall Deficit >= 40%, Photo=True)
    - PREVENTIVE_ADVISORY: 2+ signals at Advisory thresholds (NDVI >= 10%, Rainfall Deficit >= 20%, Photo=True)
    - NORMAL: Less than 2 signals agreeing (False-positive guardrail block).
    """
    # 1. Evaluate Advisory signals
    adv_sig1 = ndvi_drop_pct >= 10.0
    adv_sig2 = rainfall_deficit_pct >= 20.0
    adv_sig3 = has_farmer_photo
    adv_agreeing = sum([adv_sig1, adv_sig2, adv_sig3])

    # 2. Evaluate Claim signals
    claim_sig1 = ndvi_drop_pct >= 18.0
    claim_sig2 = rainfall_deficit_pct >= 40.0
    claim_sig3 = has_farmer_photo
    claim_agreeing = sum([claim_sig1, claim_sig2, claim_sig3])

    # 3. Determine active signals for the highest triggered tier
    if claim_agreeing >= 2:
        tier = "PMFBY_CLAIM_ALERT"
        active_sig1 = claim_sig1
        active_sig2 = claim_sig2
        active_sig3 = claim_sig3
        agreeing_count = claim_agreeing
    elif adv_agreeing >= 2:
        tier = "PREVENTIVE_ADVISORY"
        active_sig1 = adv_sig1
        active_sig2 = adv_sig2
        active_sig3 = adv_sig3
        agreeing_count = adv_agreeing
    else:
        tier = "NORMAL"
        active_sig1 = adv_sig1
        active_sig2 = adv_sig2
        active_sig3 = adv_sig3
        agreeing_count = adv_agreeing

    # Compute continuous confidence score (0-100%) based on telemetry strength
    ndvi_contrib = min(40.0, (ndvi_drop_pct / 20.0) * 40.0) if ndvi_drop_pct > 0 else 0.0
    rain_contrib = min(35.0, (rainfall_deficit_pct / 50.0) * 35.0) if rainfall_deficit_pct > 0 else 0.0
    photo_contrib = 25.0 if has_farmer_photo else 0.0
    
    confidence = round(ndvi_contrib + rain_contrib + photo_contrib, 1)
    
    # Cap confidence score between 0 and 99.5%
    confidence = max(0.0, min(99.5, confidence))

    return SignalFusionScore(
        ndvi_drop_signal=active_sig1,
        weather_anomaly_signal=active_sig2,
        farmer_photo_signal=active_sig3,
        agreeing_signals_count=agreeing_count,
        confidence_score_pct=confidence,
        tier=tier
    )


def generate_plain_language_explainability(
    crop_type: str,
    ndvi_before: float,
    ndvi_after: float,
    rainfall_deficit: float,
    has_photo: bool
) -> str:
    """
    SRS v2.0 Requirement 4.6: Plain-Language Explainability
    Translates technical jargon ("NDVI") into farmer-understandable crop health explanations.
    """
    drop_pct = round(((ndvi_before - ndvi_after) / ndvi_before) * 100, 1)
    
    explanation = (
        f"Alert Trigger Reason for {crop_type}: "
        f"1. Satellite green canopy health dropped by {drop_pct}% over the last 14 days (from {ndvi_before} to {ndvi_after}). "
        f"2. Local rainfall was {rainfall_deficit}% below historical average for this growth stage. "
    )
    if has_photo:
        explanation += "3. Geotagged ground photo confirmed leaf yellowing and moisture stress."
    else:
        explanation += "3. Satellite & weather signals fused together to confirm damage threshold breach."

    return explanation

def process_pmfby_claim_submission(claim: PMFBYClaimRequest) -> PMFBYClaimResponse:
    """
    SRS v2.0 Requirement 4.5: Mocked Insurer / PMFBY Intake API Endpoint
    Processes farmer 1-tap claim approval and returns an official reference ID.
    """
    ref_num = f"PMFBY-TEL-2026-{random.randint(10000, 99999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    explainability = generate_plain_language_explainability(
        crop_type=claim.crop_type,
        ndvi_before=claim.ndvi_before,
        ndvi_after=claim.ndvi_after,
        rainfall_deficit=claim.rainfall_deficit_pct,
        has_photo="photo" in " ".join(claim.signals_used).lower()
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

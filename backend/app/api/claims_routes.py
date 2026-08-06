from fastapi import APIRouter, HTTPException, Form, Request
from datetime import datetime
import uuid
import random
from typing import List, Dict, Any, Optional

from app.schemas.models import (
    MockClaimSubmission,
    MockClaimResponse,
    TriggerAlertRequest,
    TriggerAlertResponse
)
from app.services.pmfby import (
    evaluate_multi_signal_guardrails,
    generate_plain_language_explainability
)
from app.services.pdf_generator import generate_evidence_pdf
from app.services.notifications import (
    dispatch_multi_channel_alert,
    send_whatsapp,
    send_sms
)

router = APIRouter(tags=["Claims & Webhooks Engine"])

# In-memory database stores for demo lifecycle
PENDING_CLAIMS_DB: Dict[str, Dict[str, Any]] = {
    "+919848022339": {
        "farmer_id": "FARMER-KAVITHA-RAO",
        "plot_id": "plot-102",
        "crop_type": "Groundnut",
        "damage_score": 0.22,
        "confidence_pct": 94.5,
        "evidence_pdf_url": "/static/pdf/evidence_plot-102.pdf",
        "consent_channel": "WhatsApp Quick Reply Button",
        "lang": "TE"
    }
}
DISPATCHED_ALERTS_FEED: List[Dict[str, Any]] = [
    {
        "id": "alert-901",
        "plot_id": "plot-103",
        "farmer_name": "Suresh Kumar",
        "crop_type": "Maize",
        "tier": "PREVENTIVE_ADVISORY",
        "confidence_score_pct": 82.0,
        "created_at": "2026-08-06 18:30:15",
        "explainability_note": "Warning: Dry spells detected for 12 consecutive days and NDVI vegetation density dropped by 14%. Immediate irrigation recommended.",
        "status": "ADVISORY_SENT"
    },
    {
        "id": "alert-902",
        "plot_id": "plot-102",
        "farmer_name": "Kavitha Rao",
        "crop_type": "Groundnut",
        "tier": "PMFBY_CLAIM_ALERT",
        "confidence_score_pct": 94.5,
        "created_at": "2026-08-06 19:15:30",
        "explainability_note": "Critical damage detected: Satellite greenness dropped by 22% and local weather stations report a 45% cumulative monsoon deficit.",
        "status": "AWAITING_CONSENT"
    }
]
FILED_CLAIMS_DB: List[Dict[str, Any]] = []

# --- Step 2: Mock Insurer API Endpoint ---

@router.post("/mock/pmfby/submit-claim", response_model=MockClaimResponse)
def submit_mock_claim(submission: MockClaimSubmission):
    """
    SRS v2.0 Requirement 4.5: Mock PMFBY Insurer intake endpoint.
    Accepts completed claim evidence packet and returns official acknowledgment registry.
    """
    ack_id = f"PMFBY-TEL-2026-{random.randint(10000, 99999)}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    
    claim_record = {
        **submission.model_dump(),
        "acknowledgment_id": ack_id,
        "submitted_at": now_str,
        "status": "APPROVED_BY_INSURER"
    }
    FILED_CLAIMS_DB.append(claim_record)
    
    return MockClaimResponse(
        status="SUCCESS",
        acknowledgment_id=ack_id,
        submitted_at=now_str,
        message=f"Claim successfully filed and registered under reference {ack_id}."
    )

# --- Step 3: Trigger Warning & Dispatches Endpoint ---

@router.post("/api/pmfby/trigger-alert", response_model=TriggerAlertResponse)
def trigger_alert(request: TriggerAlertRequest):
    """
    Evaluates field telemetry, saves a pending claim record if in Claim Tier,
    generates the evidence PDF, and triggers multi-channel WhatsApp/SMS/Voice alerts.
    """
    # 1. Run multi-signal guardrails
    fusion = evaluate_multi_signal_guardrails(
        ndvi_drop_pct=request.ndvi_drop_pct,
        rainfall_deficit_pct=request.rainfall_deficit_pct,
        has_farmer_photo=request.has_farmer_photo
    )
    
    alert_triggered = fusion.tier != "NORMAL"
    pdf_url = None
    dispatched_results = {}
    
    if alert_triggered:
        explainability = generate_plain_language_explainability(
            crop_type=request.crop_type,
            ndvi_before=0.74, # simulated baseline
            ndvi_after=0.74 * (1.0 - (request.ndvi_drop_pct / 100.0)),
            rainfall_deficit=request.rainfall_deficit_pct,
            has_photo=request.has_farmer_photo
        )
        
        # If Claim Tier, generate the evidence PDF & register in pending database
        if fusion.tier == "PMFBY_CLAIM_ALERT":
            pdf_url = generate_evidence_pdf(
                farmer_id=request.farmer_id,
                plot_id=request.plot_id,
                crop_type=request.crop_type,
                damage_score=request.ndvi_drop_pct / 100.0,
                confidence_pct=fusion.confidence_score_pct,
                explainability_note=explainability
            )
            
            # Register in pending claim store for WhatsApp quick reply hook lookup
            PENDING_CLAIMS_DB[request.phone] = {
                "farmer_id": request.farmer_id,
                "plot_id": request.plot_id,
                "crop_type": request.crop_type,
                "damage_score": request.ndvi_drop_pct / 100.0,
                "confidence_pct": fusion.confidence_score_pct,
                "evidence_pdf_url": pdf_url,
                "consent_channel": "WhatsApp Quick Reply Button",
                "lang": request.lang
            }
            
        # Dispatch notifications across channels
        dispatched = dispatch_multi_channel_alert(
            phone=request.phone,
            plot_id=request.plot_id,
            crop_type=request.crop_type,
            tier=fusion.tier,
            lang=request.lang
        )
        dispatched_results = dispatched.get("results", {})
        
        # Save to dashboard alerts feed log
        alert_record = {
            "id": f"alert-{random.randint(900, 999)}",
            "plot_id": request.plot_id,
            "farmer_name": request.farmer_id.replace("FARMER-", "").replace("-", " ").title(),
            "crop_type": request.crop_type,
            "tier": fusion.tier,
            "confidence_score_pct": fusion.confidence_score_pct,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "explainability_note": explainability,
            "status": "AWAITING_CONSENT" if fusion.tier == "PMFBY_CLAIM_ALERT" else "ADVISORY_SENT",
            "evidence_pdf_url": pdf_url
        }
        DISPATCHED_ALERTS_FEED.insert(0, alert_record)

    return TriggerAlertResponse(
        alert_triggered=alert_triggered,
        tier=fusion.tier,
        confidence_score_pct=fusion.confidence_score_pct,
        evidence_pdf_url=pdf_url,
        messages_dispatched=dispatched_results
    )

# --- Step 3: Webhook Endpoint for Farmer Approvals ---

@router.post("/api/pmfby/webhook/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Webhook listening for incoming replies (e.g., Twilio WhatsApp webhook).
    Form parameters include:
      - Body: Incoming response text (e.g., "1" or "Submit")
      - From: Sender's phone number
    """
    form_data = await request.form()
    incoming_body = form_data.get("Body", "").strip()
    sender_phone = form_data.get("From", "").replace("whatsapp:", "").strip()
    
    logger_msg = f"Received webhook: From={sender_phone}, Body={incoming_body}"
    print(logger_msg)
    
    if incoming_body.lower() in ["1", "submit"]:
        # Lookup pending claim for this phone number
        pending_claim = PENDING_CLAIMS_DB.get(sender_phone)
        
        if pending_claim:
            # Trigger Mock Insurer API
            submission = MockClaimSubmission(
                farmer_id=pending_claim["farmer_id"],
                plot_id=pending_claim["plot_id"],
                crop_type=pending_claim["crop_type"],
                damage_score=pending_claim["damage_score"],
                confidence_pct=pending_claim["confidence_pct"],
                evidence_pdf_url=pending_claim["evidence_pdf_url"],
                consent_channel="WhatsApp Quick Reply Button"
            )
            
            # Record claim officially
            res = submit_mock_claim(submission)
            
            # Remove from pending queue
            del PENDING_CLAIMS_DB[sender_phone]
            
            # Format and send confirmation back to farmer in their selected language
            lang = pending_claim.get("lang", "TE")
            confirmation_message = (
                "మీ పొలం ({plot_id}) PMFBY పంట నష్టపరిహారం క్లెయిమ్ విజయవంతంగా సమర్పించబడింది. "
                "రెఫరెన్స్ సంఖ్య: {ack_id}. సమయం: {timestamp}. — FasalRakshak"
                if lang == "TE" else
                "Your PMFBY crop loss claim for plot ({plot_id}) has been successfully submitted. "
                "Reference No: {ack_id}. Timestamp: {timestamp}. — FasalRakshak"
            )
            
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            formatted_confirmation = confirmation_message.format(
                plot_id=pending_claim["plot_id"],
                ack_id=res.acknowledgment_id,
                timestamp=now_str
            )
            
            # Update status in feed log
            for alert in DISPATCHED_ALERTS_FEED:
                if alert["plot_id"] == pending_claim["plot_id"] and alert["tier"] == "PMFBY_CLAIM_ALERT":
                    alert["status"] = "CLAIM_SUBMITTED"
                    alert["acknowledgment_id"] = res.acknowledgment_id
            
            send_whatsapp(sender_phone, formatted_confirmation)
            send_sms(sender_phone, formatted_confirmation)
            
            return {
                "status": "CLAIM_AUTO_FILED",
                "ack_id": res.acknowledgment_id,
                "recipient": sender_phone,
                "message": formatted_confirmation
            }
        else:
            return {"status": "NO_PENDING_CLAIM_FOUND", "message": "No active pending claim alert for this number."}
            
    return {"status": "IGNORED", "message": "Message is not an approval keyword."}

# --- Step 4: Alerts Feed & Risk Aggregates Endpoints ---

@router.get("/api/pmfby/alerts-feed")
def get_alerts_feed():
    """Returns the latest triggered advisories and claim alerts."""
    return DISPATCHED_ALERTS_FEED

@router.get("/api/pmfby/claims-list")
def get_claims_list():
    """Returns all claims successfully submitted to the mock insurer."""
    return FILED_CLAIMS_DB

@router.get("/api/pmfby/aggregate-risk")
def get_aggregate_risk():
    """
    Summarizes village/district level risk ratios for Agriculture Officers.
    Counts plots in Advisory status, Claim status, and Normal status.
    """
    # Count of simulated village database
    advisory_count = sum(1 for alert in DISPATCHED_ALERTS_FEED if alert["tier"] == "PREVENTIVE_ADVISORY")
    claim_count = len(FILED_CLAIMS_DB) + sum(1 for alert in DISPATCHED_ALERTS_FEED if alert["tier"] == "PMFBY_CLAIM_ALERT" and alert["status"] != "CLAIM_SUBMITTED")
    
    total_monitored_plots = 42 # Mock total village database size
    normal_plots = total_monitored_plots - advisory_count - claim_count
    
    return {
        "village_name": "Warangal West Block",
        "district": "Warangal",
        "state": "Telangana",
        "total_monitored_plots": total_monitored_plots,
        "advisory_status_count": advisory_count,
        "claim_status_count": claim_count,
        "normal_status_count": max(0, normal_plots),
        "total_claims_filed": len(FILED_CLAIMS_DB),
        "district_risk_percentage": round(((advisory_count + claim_count * 2) / (total_monitored_plots * 2)) * 100, 1)
    }

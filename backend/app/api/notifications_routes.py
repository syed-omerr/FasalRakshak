from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import random

from app.services.notifications import (
    send_whatsapp,
    send_sms,
    trigger_voice_call,
    dispatch_multi_channel_alert,
    format_message,
    TEMPLATES
)

router = APIRouter(prefix="/api/notifications", tags=["WhatsApp & SMS Notifications Engine"])

# In-memory store for sent outbox log
SENT_NOTIFICATIONS_OUTBOX: List[Dict[str, Any]] = [
    {
        "id": "msg-101",
        "channel": "WHATSAPP",
        "phone": "+919848022339",
        "plot_id": "plot-102",
        "language": "TE",
        "tier": "PMFBY_CLAIM_ALERT",
        "message": "మీ పొలం (plot-102) లో పంట నష్టం నిర్ధారించబడింది. PMFBY పంట నష్టపరిహారం క్లెయిమ్ సమర్పించడానికి '1' అని ప్రత్యుత్తరం ఇవ్వండి. — FasalRakshak",
        "status": "DELIVERED",
        "sid": "WA-SID-8839210",
        "timestamp": "2026-08-07 08:30:15"
    },
    {
        "id": "msg-102",
        "channel": "SMS",
        "phone": "+919848022339",
        "plot_id": "plot-103",
        "language": "EN",
        "tier": "PREVENTIVE_ADVISORY",
        "message": "Warning: Moisture stress detected in your plot plot-103. Please irrigate your Maize crop immediately. — FasalRakshak",
        "status": "DELIVERED",
        "sid": "SMS-SID-1928301",
        "timestamp": "2026-08-07 08:45:00"
    }
]


# Schemas
class WhatsAppMessageRequest(BaseModel):
    phone: str = Field("+919848022339", description="Farmer mobile number with country code")
    message: str = Field(..., description="Content of WhatsApp message")
    plot_id: Optional[str] = Field("plot-101", description="Associated plot ID")
    language: Optional[str] = Field("TE", description="Language code: TE, HI, EN")

class SMSMessageRequest(BaseModel):
    phone: str = Field("+919848022339", description="Farmer mobile number with country code")
    message: str = Field(..., description="Content of SMS message")
    plot_id: Optional[str] = Field("plot-101", description="Associated plot ID")
    language: Optional[str] = Field("TE", description="Language code: TE, HI, EN")

class DispatchAlertRequest(BaseModel):
    phone: str = Field("+919848022339", description="Target mobile number")
    plot_id: str = Field("plot-101", description="Plot ID")
    crop_type: str = Field("Cotton", description="Crop type")
    tier: str = Field("PREVENTIVE_ADVISORY", description="PREVENTIVE_ADVISORY or PMFBY_CLAIM_ALERT")
    language: str = Field("TE", description="TE, HI, or EN")
    channel: str = Field("BOTH", description="WHATSAPP, SMS, or BOTH")
    custom_message: Optional[str] = None


@router.post("/send-whatsapp")
def api_send_whatsapp(req: WhatsAppMessageRequest):
    """
    Direct Endpoint to Send WhatsApp Alert to Farmer.
    Uses Twilio WhatsApp API if credentials present, otherwise falls back to instant mock logger.
    """
    if not req.phone or not req.message:
        raise HTTPException(status_code=400, detail="Phone number and message content are required.")

    res = send_whatsapp(phone=req.phone, message=req.message)
    
    outbox_entry = {
        "id": f"msg-{random.randint(1000, 9999)}",
        "channel": "WHATSAPP",
        "phone": req.phone,
        "plot_id": req.plot_id,
        "language": req.language,
        "tier": "CUSTOM_ALERT",
        "message": req.message,
        "status": res.get("status", "SENT"),
        "sid": res.get("sid", "WA-MOCK-SID"),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    SENT_NOTIFICATIONS_OUTBOX.insert(0, outbox_entry)

    return {
        "status": "SUCCESS",
        "channel": "WHATSAPP",
        "recipient": req.phone,
        "details": res,
        "outbox_record": outbox_entry
    }


@router.post("/send-sms")
def api_send_sms(req: SMSMessageRequest):
    """
    Direct Endpoint to Send SMS Alert to Farmer.
    Uses Twilio Programmable SMS API if credentials present, otherwise falls back to instant mock logger.
    """
    if not req.phone or not req.message:
        raise HTTPException(status_code=400, detail="Phone number and message content are required.")

    res = send_sms(phone=req.phone, message=req.message)

    outbox_entry = {
        "id": f"msg-{random.randint(1000, 9999)}",
        "channel": "SMS",
        "phone": req.phone,
        "plot_id": req.plot_id,
        "language": req.language,
        "tier": "CUSTOM_ALERT",
        "message": req.message,
        "status": res.get("status", "SENT"),
        "sid": res.get("sid", "SMS-MOCK-SID"),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    SENT_NOTIFICATIONS_OUTBOX.insert(0, outbox_entry)

    return {
        "status": "SUCCESS",
        "channel": "SMS",
        "recipient": req.phone,
        "details": res,
        "outbox_record": outbox_entry
    }


@router.post("/send-alert")
def api_dispatch_alert(req: DispatchAlertRequest):
    """
    Multi-Channel Trigger Endpoint (WhatsApp + SMS + Voice).
    Generates structured alert text from template if custom_message is omitted.
    """
    lang = req.language.upper()
    tier = req.tier.upper()

    # Resolve message text
    if req.custom_message and req.custom_message.strip():
        msg_text = req.custom_message
    else:
        try:
            msg_text = format_message(tier=tier, lang=lang, plot_id=req.plot_id, crop_type=req.crop_type)
        except Exception:
            msg_text = f"FasalRakshak Alert: Plot {req.plot_id} ({req.crop_type}) requires attention."

    results = {}

    if req.channel.upper() in ["WHATSAPP", "BOTH"]:
        results["whatsapp"] = send_whatsapp(req.phone, msg_text)
        SENT_NOTIFICATIONS_OUTBOX.insert(0, {
            "id": f"msg-{random.randint(1000, 9999)}",
            "channel": "WHATSAPP",
            "phone": req.phone,
            "plot_id": req.plot_id,
            "language": lang,
            "tier": tier,
            "message": msg_text,
            "status": results["whatsapp"].get("status", "SENT"),
            "sid": results["whatsapp"].get("sid", "WA-MOCK-SID"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    if req.channel.upper() in ["SMS", "BOTH"]:
        results["sms"] = send_sms(req.phone, msg_text)
        SENT_NOTIFICATIONS_OUTBOX.insert(0, {
            "id": f"msg-{random.randint(1000, 9999)}",
            "channel": "SMS",
            "phone": req.phone,
            "plot_id": req.plot_id,
            "language": lang,
            "tier": tier,
            "message": msg_text,
            "status": results["sms"].get("status", "SENT"),
            "sid": results["sms"].get("sid", "SMS-MOCK-SID"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    if tier == "PMFBY_CLAIM_ALERT":
        results["voice"] = trigger_voice_call(req.phone, msg_text)

    # Also log to global alerts feed in claims_routes
    from app.api.claims_routes import DISPATCHED_ALERTS_FEED
    feed_record = {
        "id": f"alert-{random.randint(900, 999)}",
        "plot_id": req.plot_id,
        "farmer_name": f"Farmer ({req.phone})",
        "crop_type": req.crop_type,
        "tier": tier,
        "confidence_score_pct": 92.5,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "explainability_note": msg_text,
        "status": "AWAITING_CONSENT" if tier == "PMFBY_CLAIM_ALERT" else "ADVISORY_SENT"
    }
    DISPATCHED_ALERTS_FEED.insert(0, feed_record)

    return {
        "status": "SUCCESS",
        "recipient": req.phone,
        "tier": tier,
        "language": lang,
        "message": msg_text,
        "dispatched_channels": results,
        "alerts_feed_record": feed_record
    }


@router.get("/outbox")
def get_notifications_outbox():
    """
    Returns full chronological outbox log of sent WhatsApp and SMS messages.
    """
    return SENT_NOTIFICATIONS_OUTBOX

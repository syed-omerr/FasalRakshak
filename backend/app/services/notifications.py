import os
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotificationsService")

# Environment configuration for real Twilio integration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+14155552671")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# Attempt to initialize Twilio client if keys are present
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client successfully initialized.")
    except ImportError:
        logger.warning("twilio library not installed. Defaulting to Mock Notification Server.")
else:
    logger.info("Twilio credentials missing. Running in MOCK Mode.")

# Vernacular & English templates dictionary (SRS v2.0 Requirement 4.3)
TEMPLATES = {
    "TE": {
        "PREVENTIVE_ADVISORY": (
            "మీ పొలం (ప్లాట్ సంఖ్య: {plot_id}) లో తేమ తగ్గుతున్న సూచనలు కనిపిస్తున్నాయి. "
            "NDVI శాతము పడిపోయింది మరియు వర్షపాతం లోటు ఉంది. దయచేసి {crop_type} పంటకు నీటి పారుదల అందించండి. — FasalRakshak"
        ),
        "PMFBY_CLAIM_ALERT": (
            "మీ పొలం ({plot_id}) లో పంట నష్టం నిర్ధారించబడింది. "
            "PMFBY పంట నష్టపరిహారం క్లెయిమ్ సమర్పించడానికి సిద్ధంగా ఉంది. క్లెయిమ్ చేయడానికి '1' లేదా 'Submit' అని ప్రత్యుత్తరం ఇవ్వండి. — FasalRakshak"
        ),
        "CLAIM_FILED_CONFIRMATION": (
            "మీ పొలం ({plot_id}) PMFBY పంట నష్టపరిహారం క్లెయిమ్ విజయవంతంగా సమర్పించబడింది. "
            "రెఫరెన్స్ సంఖ్య: {ack_id}. సమయం: {timestamp}. — FasalRakshak"
        )
    },
    "EN": {
        "PREVENTIVE_ADVISORY": (
            "Warning: Moisture stress detected in your plot {plot_id}. "
            "NDVI canopy drop is noticeable. Please irrigate your {crop_type} crop immediately. — FasalRakshak"
        ),
        "PMFBY_CLAIM_ALERT": (
            "Crop damage confirmed for plot {plot_id}. "
            "Your PMFBY claim packet is ready. Reply with '1' or 'Submit' to approve immediate filing. — FasalRakshak"
        ),
        "CLAIM_FILED_CONFIRMATION": (
            "Your PMFBY crop loss claim for plot ({plot_id}) has been successfully filed. "
            "Reference No: {ack_id}. Timestamp: {timestamp}. — FasalRakshak"
        )
    }
}

def format_message(tier: str, lang: str, **kwargs) -> str:
    """Helper to format template string with kwargs"""
    lang_templates = TEMPLATES.get(lang.upper(), TEMPLATES["EN"])
    template = lang_templates.get(tier.upper(), "")
    return template.format(**kwargs)

def send_sms(phone: str, message: str) -> Dict[str, Any]:
    """Sends SMS using Twilio or falls back to log mock"""
    if twilio_client:
        try:
            msg = twilio_client.messages.create(
                body=message,
                from_=TWILIO_FROM_NUMBER,
                to=phone
            )
            logger.info(f"SMS sent successfully to {phone} via Twilio. SID: {msg.sid}")
            return {"status": "SENT", "channel": "SMS", "sid": msg.sid, "body": message}
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio: {str(e)}")
            # Fallback to mock
    
    # Mock SMS behavior
    logger.info(f"[MOCK SMS] Outbox target: {phone} | Content: {message}")
    return {"status": "MOCKED", "channel": "SMS", "sid": "mock-sms-sid-12345", "body": message}

def send_whatsapp(phone: str, message: str) -> Dict[str, Any]:
    """Sends WhatsApp message using Twilio or falls back to log mock"""
    to_whatsapp = f"whatsapp:{phone}" if not phone.startswith("whatsapp:") else phone
    
    if twilio_client:
        try:
            msg = twilio_client.messages.create(
                body=message,
                from_=TWILIO_WHATSAPP_FROM,
                to=to_whatsapp
            )
            logger.info(f"WhatsApp sent successfully to {to_whatsapp} via Twilio. SID: {msg.sid}")
            return {"status": "SENT", "channel": "WHATSAPP", "sid": msg.sid, "body": message}
        except Exception as e:
            logger.error(f"Failed to send WhatsApp via Twilio: {str(e)}")
            # Fallback to mock
            
    # Mock WhatsApp behavior
    logger.info(f"[MOCK WHATSAPP] Outbox target: {to_whatsapp} | Content: {message}")
    return {"status": "MOCKED", "channel": "WHATSAPP", "sid": "mock-wa-sid-12345", "body": message}

def trigger_voice_call(phone: str, message: str) -> Dict[str, Any]:
    """Triggers outbound Twilio TTS Voice Call or logs mock call"""
    if twilio_client:
        try:
            # Twilio TwiML speaking the warning message
            twiml = f"<Response><Say voice='alice' language='hi-IN'>{message}</Say></Response>"
            call = twilio_client.calls.create(
                twiml=twiml,
                from_=TWILIO_FROM_NUMBER,
                to=phone
            )
            logger.info(f"Voice call triggered to {phone}. Call SID: {call.sid}")
            return {"status": "TRIGGERED", "channel": "VOICE", "sid": call.sid, "body": message}
        except Exception as e:
            logger.error(f"Failed to trigger Voice call via Twilio: {str(e)}")
            # Fallback to mock
            
    # Mock Voice Call behavior
    logger.info(f"[MOCK VOICE CALL] Outbox target: {phone} | Play Speech TTS: {message}")
    return {"status": "MOCKED", "channel": "VOICE", "sid": "mock-call-sid-12345", "body": message}

def dispatch_multi_channel_alert(phone: str, plot_id: str, crop_type: str, tier: str, lang: str = "TE") -> Dict[str, Any]:
    """
    SRS v2.0 Req 4.3: Dispatches warning messages across WhatsApp, SMS, and Outbound Voice.
    """
    msg_body = format_message(tier=tier, lang=lang, plot_id=plot_id, crop_type=crop_type)
    
    results = {}
    results["whatsapp"] = send_whatsapp(phone, msg_body)
    results["sms"] = send_sms(phone, msg_body)
    
    # Voice Call is triggered specifically for Claim Alerts (high urgency)
    if tier == "PMFBY_CLAIM_ALERT":
        results["voice"] = trigger_voice_call(phone, msg_body)
        
    return {
        "success": True,
        "recipient": phone,
        "tier": tier,
        "language": lang,
        "results": results
    }

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pmfby_evaluate_signals_guardrail():
    response = client.post("/api/pmfby/evaluate-signals?ndvi_drop_pct=18.5&rainfall_deficit_pct=42.0&has_farmer_photo=true")
    assert response.status_code == 200
    data = response.json()
    assert data["agreeing_signals_count"] >= 2
    assert data["confidence_score_pct"] > 70.0
    assert data["tier"] == "PMFBY_CLAIM_ALERT"

def test_pmfby_submit_claim_endpoint():
    payload = {
        "farmer_id": "FARMER-TEL-9842",
        "plot_id": "plot-101",
        "crop_type": "Cotton",
        "damage_score": 0.72,
        "confidence_pct": 88.5,
        "signals_used": ["NDVI satellite drop 18%", "Open-Meteo dry spell 12 days"],
        "ndvi_before": 0.74,
        "ndvi_after": 0.52,
        "rainfall_deficit_pct": 42.0,
        "consent_channel": "WhatsApp Button"
    }
    response = client.post("/api/pmfby/submit-claim", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESSFULLY_SUBMITTED"
    assert "PMFBY-TEL-2026-" in data["acknowledgment_id"]
    assert "explainability_note" in data

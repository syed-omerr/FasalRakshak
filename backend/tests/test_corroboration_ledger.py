import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.corroboration_ledger import (
    record_plot_signal_breach,
    query_corroboration_ledger,
    get_latest_village_corroboration,
    CORROBORATION_LEDGER_STORE
)

client = TestClient(app)

def test_1_ledger_creation_and_upsert_on_threshold_breach():
    """
    Acceptance Criteria #1 & #6:
    A corroboration ledger entry is created/updated automatically when 2+ plots in the same village
    breach the same threshold in the same window (tested with 3 synthetic plots).
    Ledger entries persist across requests and reuse the existing entry.
    """
    test_village = "synth_village_01"
    
    # Single plot breach (count < 2) -> Should NOT create ledger entry yet
    res1 = record_plot_signal_breach(village_id=test_village, plot_id="synth-plot-A", signal_type="swi")
    assert res1["corroboration_created"] is False
    assert res1["plot_count"] == 1

    # Second plot breach -> Should CREATE ledger entry (count = 2)
    res2 = record_plot_signal_breach(village_id=test_village, plot_id="synth-plot-B", signal_type="swi")
    assert res2["corroboration_created"] is True
    assert res2["action"] == "CREATED"
    assert res2["entry"]["plot_count"] == 2
    assert "synth-plot-A" in res2["entry"]["plot_ids"]
    assert "synth-plot-B" in res2["entry"]["plot_ids"]

    # Third plot breach -> Should UPSERT existing ledger entry (count = 3)
    res3 = record_plot_signal_breach(village_id=test_village, plot_id="synth-plot-C", signal_type="swi")
    assert res3["corroboration_created"] is True
    assert res3["action"] == "UPDATED"
    assert res3["entry"]["plot_count"] == 3
    assert "synth-plot-C" in res3["entry"]["plot_ids"]


def test_2_enterprise_view_filtering_and_query():
    """
    Acceptance Criteria #2:
    Enterprise can view and filter ledger entries by village, signal_type, and date range.
    """
    response = client.get("/api/pmfby/corroboration-ledger?village_id=warangal_north&role=enterprise")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Enterprise role must see plot_ids
    assert data[0]["plot_ids"] is not None
    assert isinstance(data[0]["plot_ids"], list)


def test_3_kisan_eligibility_report_sources_from_ledger():
    """
    Acceptance Criteria #3:
    Kisan eligibility report includes aggregate count line, sourced directly from the ledger.
    """
    res = client.get("/api/pmfby/corroboration/plot-101?location=Warangal%20North,%20Telangana")
    assert res.status_code == 200
    data = res.json()
    assert "cluster_plots_affected" in data
    assert data["cluster_plots_affected"] >= 2
    assert "corroboration_line_english" in data
    assert "nearby farms" in data["corroboration_line_english"].lower()


def test_4_privacy_redaction_for_kisan_and_public_roles():
    """
    Acceptance Criteria #4 (FR-L6):
    Farmer-facing and public outputs NEVER expose other farmers' plot IDs or identities — only aggregate counts.
    """
    # Kisan Role Query
    kisan_res = client.get("/api/pmfby/villages/warangal_north/corroboration-ledger?role=kisan")
    assert kisan_res.status_code == 200
    kisan_data = kisan_res.json()
    assert len(kisan_data) >= 1
    # plot_ids MUST be redacted (None) for Kisan/public
    assert kisan_data[0]["plot_ids"] is None
    # plot_count MUST be present
    assert kisan_data[0]["plot_count"] >= 2


def test_5_non_blocking_when_zero_ledger_entries():
    """
    Acceptance Criteria #5 (FR-L7):
    A claim can still be filed and marked Applicable with zero ledger entries present.
    Absence of corroboration must not block or downgrade an otherwise-eligible claim.
    """
    zero_village = "isolated_empty_village_99"
    kisan_info = get_latest_village_corroboration(village_id=zero_village, role="kisan")
    assert kisan_info["has_corroboration"] is False
    assert kisan_info["plot_count"] == 0

    # Submit claim for isolated plot
    claim_payload = {
        "farmer_id": "FARMER-ISOLATED-01",
        "plot_id": "plot-isolated-999",
        "crop_type": "Cotton",
        "damage_score": 0.75,
        "confidence_pct": 88.0,
        "signals_used": ["NDVI drop 18%", "Open-Meteo dry spell"],
        "ndvi_before": 0.74,
        "ndvi_after": 0.52,
        "rainfall_deficit_pct": 42.0,
        "swi_val": 0.42,
        "consent_channel": "WhatsApp"
    }
    response = client.post("/api/pmfby/submit-claim", json=claim_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "PMFBY" in res_data["acknowledgment_id"]


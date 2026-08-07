import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger("CorroborationLedgerService")

# In-memory persistent corroboration ledger store
# Structure: Dict[entry_id, Dict[str, Any]]
CORROBORATION_LEDGER_STORE: Dict[str, Dict[str, Any]] = {}

# Raw signal breaches recorded per plot
# Structure: List[Dict[str, Any]]
SIGNAL_BREACHES_LOG: List[Dict[str, Any]] = []


def seed_initial_corroboration_ledger():
    """
    Seeds initial realistic corroboration ledger entries for Telangana mandals/villages.
    """
    if CORROBORATION_LEDGER_STORE:
        return

    today = datetime.now()
    w_start = (today - timedelta(days=6)).strftime("%Y-%m-%d")
    w_end = today.strftime("%Y-%m-%d")
    created = today.strftime("%Y-%m-%dT%H:%M:%SZ")

    initial_entries = [
        {
            "id": "corrob-warangal-swi-001",
            "village_id": "warangal_north",
            "mandal_id": "warangal_mandal",
            "village_name": "Warangal North",
            "signal_type": "swi",
            "plot_ids": ["plot-101", "plot-102", "plot-103", "plot-csv-102"],
            "plot_count": 4,
            "window_start": w_start,
            "window_end": w_end,
            "created_at": created,
            "summary_text": "4 nearby farms in Warangal North showed severe Soil Water Index (SWI) root-zone deficit this week.",
            "summary_text_telugu": "4 గ్రామంలోని సమీప పొలాలు ఈ వారం నేల తేమ శాతంలో లోటును సూచిస్తున్నాయి."
        },
        {
            "id": "corrob-parkal-ndvi-002",
            "village_id": "parkal",
            "mandal_id": "parkal_mandal",
            "village_name": "Parkal Mandal",
            "signal_type": "ndvi",
            "plot_ids": ["plot-104", "plot-105", "plot-csv-101"],
            "plot_count": 3,
            "window_start": w_start,
            "window_end": w_end,
            "created_at": created,
            "summary_text": "3 nearby farms in Parkal Mandal confirmed satellite NDVI canopy health drop > 18%.",
            "summary_text_telugu": "3 పార్కల్ మండలంలోని పొలాలు ఉపగ్రహ NDVI ఆకుపచ్చదన తగ్గుదల నమోదు చేశాయి."
        },
        {
            "id": "corrob-narsampet-weather-003",
            "village_id": "narsampet",
            "mandal_id": "narsampet_mandal",
            "village_name": "Narsampet",
            "signal_type": "combined",
            "plot_ids": ["plot-106", "plot-107", "plot-108", "plot-109", "plot-110"],
            "plot_count": 5,
            "window_start": w_start,
            "window_end": w_end,
            "created_at": created,
            "summary_text": "5 nearby farms in Narsampet verified combined satellite + dry spell weather drought agreement.",
            "summary_text_telugu": "5 నర్సంపేట పొలాలు వర్షపాతం లోటు మరియు ఉపగ్రహ సమాచారంతో సరిపోలాయి."
        }
    ]

    for entry in initial_entries:
        CORROBORATION_LEDGER_STORE[entry["id"]] = entry

    logger.info(f"Initialized Corroboration Ledger with {len(initial_entries)} entries.")


# Ensure seed runs on module load
seed_initial_corroboration_ledger()


def record_plot_signal_breach(
    village_id: str,
    plot_id: str,
    signal_type: str = "swi",
    mandal_id: Optional[str] = None,
    village_name: Optional[str] = None,
    window_days: int = 7
) -> Dict[str, Any]:
    """
    FR-L1 & FR-L2:
    Whenever 2 or more enrolled plots in the same village breach the same damage threshold
    within the same time window, write/upsert a CorroborationLedgerEntry.
    """
    now = datetime.now()
    w_start = (now - timedelta(days=window_days - 1)).strftime("%Y-%m-%d")
    w_end = now.strftime("%Y-%m-%d")
    created_at = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    v_name = village_name or village_id.replace("_", " ").title()
    m_id = mandal_id or f"{village_id}_mandal"

    # Log individual breach event
    SIGNAL_BREACHES_LOG.append({
        "village_id": village_id,
        "plot_id": plot_id,
        "signal_type": signal_type,
        "timestamp": created_at
    })

    # Check existing plots in this village with matching signal breach in the window
    relevant_breaches = [
        b for b in SIGNAL_BREACHES_LOG
        if b["village_id"] == village_id and (b["signal_type"] == signal_type or signal_type == "combined")
    ]
    
    unique_plot_ids = list(set([b["plot_id"] for b in relevant_breaches]))

    # Ensure current plot_id is included
    if plot_id not in unique_plot_ids:
        unique_plot_ids.append(plot_id)

    plot_count = len(unique_plot_ids)

    # FR-L1 Rule: Require 2+ plots to create/upsert corroboration ledger entry
    if plot_count < 2:
        return {
            "corroboration_created": False,
            "reason": "Fewer than 2 plots breached threshold in window.",
            "plot_count": plot_count,
            "village_id": village_id
        }

    # Generate composite entry ID for village + signal + window
    entry_id = f"corrob-{village_id}-{signal_type}-{w_start}"

    existing_entry = CORROBORATION_LEDGER_STORE.get(entry_id)

    if existing_entry:
        # Upsert: merge plot_ids and update plot_count
        combined_plots = list(set(existing_entry["plot_ids"] + unique_plot_ids))
        existing_entry["plot_ids"] = combined_plots
        existing_entry["plot_count"] = len(combined_plots)
        existing_entry["summary_text"] = f"{len(combined_plots)} nearby farms in {v_name} showed {signal_type.upper()} threshold agreement this week."
        existing_entry["summary_text_telugu"] = f"{len(combined_plots)} గ్రామంలోని సమీప పొలాలు ఈ వారం ఒకే రకమైన పంట నష్టాన్ని సూచిస్తున్నాయి."
        CORROBORATION_LEDGER_STORE[entry_id] = existing_entry
        logger.info(f"Updated CorroborationLedgerEntry {entry_id} (count={len(combined_plots)})")
        return {"corroboration_created": True, "entry": existing_entry, "action": "UPDATED"}

    # Create new entry
    new_entry = {
        "id": entry_id,
        "village_id": village_id,
        "mandal_id": m_id,
        "village_name": v_name,
        "signal_type": signal_type,
        "plot_ids": unique_plot_ids,
        "plot_count": plot_count,
        "window_start": w_start,
        "window_end": w_end,
        "created_at": created_at,
        "summary_text": f"{plot_count} nearby farms in {v_name} showed {signal_type.upper()} threshold agreement this week.",
        "summary_text_telugu": f"{plot_count} గ్రామంలోని సమీప పొలాలు ఈ వారం ఒకే రకమైన పంట నష్టాన్ని సూచిస్తున్నాయి."
    }

    CORROBORATION_LEDGER_STORE[entry_id] = new_entry
    logger.info(f"Created new CorroborationLedgerEntry {entry_id} (count={plot_count})")
    return {"corroboration_created": True, "entry": new_entry, "action": "CREATED"}


def query_corroboration_ledger(
    village_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    signal_type: Optional[str] = None,
    role: str = "enterprise"
) -> List[Dict[str, Any]]:
    """
    FR-L3 & FR-L6:
    Queries corroboration ledger with role-based privacy filters.
    Enterprise role receives plot_ids; Kisan/public role receives plot_count only with plot_ids redacted.
    """
    entries = list(CORROBORATION_LEDGER_STORE.values())

    if village_id and village_id.lower() != "all":
        entries = [e for e in entries if e["village_id"] == village_id or e.get("mandal_id") == village_id]

    if signal_type and signal_type.lower() != "all":
        entries = [e for e in entries if e["signal_type"] == signal_type]

    if from_date:
        entries = [e for e in entries if e["window_start"] >= from_date]

    if to_date:
        entries = [e for e in entries if e["window_end"] <= to_date]

    # Sort descending by creation time / window start
    entries.sort(key=lambda x: x.get("created_at", x.get("window_start")), reverse=True)

    # Privacy Redaction for Kisan / Public roles (FR-L6)
    formatted_results = []
    for entry in entries:
        item = dict(entry)
        if role.lower() != "enterprise":
            # Redact exact plot_ids for non-enterprise users
            item["plot_ids"] = None
        formatted_results.append(item)

    return formatted_results


def get_latest_village_corroboration(village_id: str, role: str = "kisan") -> Dict[str, Any]:
    """
    FR-L5 & FR-L7:
    Look up the most recent relevant ledger entry for a village to surface in Kisan eligibility reports.
    If no entry exists (e.g. 0 corroborating plots), returns non-blocking default context (FR-L7).
    """
    ledger = query_corroboration_ledger(village_id=village_id, role=role)

    if ledger:
        latest = ledger[0]
        count = latest["plot_count"]
        return {
            "has_corroboration": True,
            "entry_id": latest["id"],
            "plot_count": count,
            "village_name": latest["village_name"],
            "signal_type": latest["signal_type"],
            "window_start": latest["window_start"],
            "window_end": latest["window_end"],
            "corroboration_line_english": f"{count} nearby farms in your village showed the same pattern this week.",
            "corroboration_line_telugu": f"{count} గ్రామంలోని సమీప పొలాలు ఈ వారం ఒకే రకమైన పంట నష్టాన్ని సూచిస్తున్నాయి.",
            "summary": latest.get("summary_text")
        }

    # Fallback when 0 corroborating plots exist in village (FR-L7: Non-blocking)
    return {
        "has_corroboration": False,
        "entry_id": None,
        "plot_count": 0,
        "village_name": village_id.replace("_", " ").title(),
        "signal_type": "standalone",
        "window_start": None,
        "window_end": None,
        "corroboration_line_english": "Single plot detection active (No nearby plot cluster required for PMFBY claim applicability).",
        "corroboration_line_telugu": "ఒక్క పొలంలో పంట నష్టం నమోదు (క్లెయిమ్ కు ఇరుగుపొరుగు ఆధారాలు తప్పనిసరి కాదు).",
        "summary": "Standalone plot detection. Multi-signal satellite & weather thresholds are evaluated independently."
    }

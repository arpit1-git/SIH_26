"""
Admin / Municipal API — /api/admin/*

Phase 1: No JWT auth yet — auth middleware added in Phase 7.
         Routes marked with # TODO Phase 7: add auth dependency.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

import app.store as store

router = APIRouter(prefix="/api/admin", tags=["Municipal Admin"])


def _risk_level(score: float) -> str:
    return "critical" if score >= 81 else "high" if score >= 56 else "medium" if score >= 31 else "low"


def _enrich_admin(inc: dict) -> dict:
    risk = inc.get("risk_score", 30.0)
    level = _risk_level(risk)
    facilities = store.facilities.get(inc["incident_id"], [])
    
    # Check if hospital / school within impact threshold
    has_hospital = any(f.get("facility_type") == "hospital" and f.get("distance_meters", 1000) <= 400 for f in facilities)
    has_school = any(f.get("facility_type") == "school" and f.get("distance_meters", 1000) <= 300 for f in facilities)

    return {
        **inc,
        "level": level,
        "civic_impact_score": inc.get("civic_impact_score", round(risk * 0.95, 1)),
        "complaint_velocity": inc.get("complaint_velocity", 1.0),
        "is_velocity_surge": inc.get("complaint_velocity", 1.0) >= 2.0,
        "critical_facility_alert": has_hospital or has_school,
        "facilities": facilities,
        "address": inc.get("address", inc.get("location_name")),
    }


# ── Priority Inbox ────────────────────────────────────────────────────────────

@router.get("/incidents/priority", summary="Priority inbox — sorted by Civic Priority Score")
async def priority_inbox(
    level: Optional[str] = Query(None, description="Filter: low/medium/high/critical"),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None, description="Filter: waste/waterlogging"),
    sort_by: str = Query("priority", description="Sort by: priority / impact / velocity / reports"),
    limit: int = Query(50, le=200),
):
    """
    Municipal priority inbox (PRD Section 33).
    Returns incidents sorted by risk_score, civic_impact, or velocity.
    Enriched with facility alerts and velocity surge indicators.
    """
    incidents = list(store.incidents.values())

    if level:
        incidents = [i for i in incidents if _risk_level(i.get("risk_score", 0)) == level]
    if status:
        incidents = [i for i in incidents if i.get("status") == status]
    if category:
        incidents = [i for i in incidents if i.get("category") == category]

    if sort_by == "impact":
        incidents.sort(key=lambda x: x.get("civic_impact_score", x.get("risk_score", 0)), reverse=True)
    elif sort_by == "velocity":
        incidents.sort(key=lambda x: x.get("complaint_velocity", 0.0), reverse=True)
    elif sort_by == "reports":
        incidents.sort(key=lambda x: x.get("complaint_count", 1) + x.get("support_count", 0), reverse=True)
    else:  # priority (default)
        incidents.sort(key=lambda x: x.get("risk_score", 0), reverse=True)

    all_incs = list(store.incidents.values())
    summary = {
        "critical": sum(1 for i in all_incs if _risk_level(i.get("risk_score", 0)) == "critical"),
        "high":     sum(1 for i in all_incs if _risk_level(i.get("risk_score", 0)) == "high"),
        "medium":   sum(1 for i in all_incs if _risk_level(i.get("risk_score", 0)) == "medium"),
        "low":      sum(1 for i in all_incs if _risk_level(i.get("risk_score", 0)) == "low"),
        "velocity_surges": sum(1 for i in all_incs if i.get("complaint_velocity", 0.0) >= 2.0),
        "total": len(all_incs),
    }

    return {
        "summary": summary,
        "incidents": [_enrich_admin(i) for i in incidents[:limit]],
        "total": len(incidents),
    }


# ── Assignment ────────────────────────────────────────────────────────────────

@router.post("/incidents/{incident_id}/assign", summary="Assign incident to department/team")
async def assign_incident(incident_id: str, body: dict):
    """
    Assign a civic incident to a department and field team.
    Body: `{ "department": "Drainage", "team": "Team-B", "authority": "Ward Officer A" }`

    Phase 7: requires JWT supervisor/admin role.
    """
    # TODO Phase 7: require_roles(["admin", "supervisor"])
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    inc["assigned_department"] = body.get("department")
    inc["assigned_team"]       = body.get("team")
    inc["assigned_authority"]  = body.get("authority")
    inc["status"]              = "assigned"
    inc["assigned_at"]         = datetime.utcnow().isoformat()
    inc["updated_at"]          = datetime.utcnow().isoformat()

    _append_status_history(inc, old="open", new="assigned")

    return {
        "incident_id": incident_id,
        "status":      "assigned",
        "department":  inc["assigned_department"],
        "team":        inc["assigned_team"],
    }


# ── Status Update ─────────────────────────────────────────────────────────────

@router.patch("/incidents/{incident_id}/status", summary="Update incident status")
async def update_status(incident_id: str, body: dict):
    """
    Update incident status with audit log entry.
    Valid statuses: open · assigned · in_progress · completed · resolved · escalated

    Phase 7: requires JWT role check.
    """
    # TODO Phase 7: require_roles(["admin", "supervisor", "field_worker"])
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    VALID = {"open", "assigned", "in_progress", "completed", "resolved", "escalated", "closed"}
    new_status = body.get("status", "").lower()
    if new_status not in VALID:
        raise HTTPException(400, f"Invalid status '{new_status}'. Valid: {sorted(VALID)}")

    old_status = inc.get("status", "open")
    inc["status"]     = new_status
    inc["updated_at"] = datetime.utcnow().isoformat()

    if new_status == "resolved":
        inc["resolved_at"] = datetime.utcnow().isoformat()

    _append_status_history(inc, old=old_status, new=new_status, note=body.get("note"))

    return {
        "incident_id": incident_id,
        "old_status":  old_status,
        "new_status":  new_status,
        "timestamp":   inc["updated_at"],
    }


# ── After-Evidence Upload (stub — full CV pipeline in Phase 8) ────────────────

@router.post("/incidents/{incident_id}/after-evidence", summary="Upload after-cleanup evidence")
async def upload_after_evidence(incident_id: str):
    """
    Accepts after-cleanup photo upload. Triggers CV before/after comparison.
    Full implementation in Phase 8 (file upload + CV verification pipeline).
    """
    # TODO Phase 8: accept UploadFile, call ai.verify_resolution(before, after)
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    return {"incident_id": incident_id, "status": "stub", "note": "Phase 8 implementation pending."}


# ── SLA & Performance ─────────────────────────────────────────────────────────

@router.get("/sla", summary="SLA performance metrics")
async def get_sla():
    """
    Returns SLA performance metrics per department.
    Phase 1: mock data. Phase 7: real DB queries.
    """
    return {
        "avg_response_time_hours":   2.4,
        "avg_resolution_time_hours": 18.7,
        "resolved_within_sla_pct":   72.3,
        "overdue_count":             5,
        "escalated_count":           2,
        "total_incidents":           len(store.incidents),
        "department_performance": [
            {"department": "Sanitation", "avg_resolution_h": 12.3, "sla_compliance_pct": 81, "overdue": 1},
            {"department": "Drainage",   "avg_resolution_h": 24.1, "sla_compliance_pct": 64, "overdue": 3},
            {"department": "Roads",      "avg_resolution_h": 31.5, "sla_compliance_pct": 55, "overdue": 1},
        ],
    }


@router.get("/performance", summary="Municipal operational performance overview")
async def get_performance():
    incs = list(store.incidents.values())
    return {
        "total_incidents": len(incs),
        "open":            sum(1 for i in incs if i.get("status") == "open"),
        "assigned":        sum(1 for i in incs if i.get("status") == "assigned"),
        "resolved":        sum(1 for i in incs if i.get("status") == "resolved"),
        "critical_active": sum(1 for i in incs if _risk_level(i.get("risk_score", 0)) == "critical" and i.get("status") != "resolved"),
    }


@router.get("/predictions", summary="Predicted hotspots (stub — Phase 9)")
async def get_predictions():
    """Predictive hotspot data. Full XGBoost + H3 model implemented in Phase 9."""
    return {
        "predictions": [],
        "note": "Predictive hotspot model implemented in Phase 9.",
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _append_status_history(inc: dict, old: str, new: str, note: str = None):
    inc.setdefault("status_history", []).append({
        "old_status": old,
        "new_status": new,
        "timestamp":  datetime.utcnow().isoformat(),
        "actor_type": "admin",
        "note":       note,
    })

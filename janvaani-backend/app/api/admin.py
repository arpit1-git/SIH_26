"""
Admin / Municipal API — /api/admin/*

Phase 7: SLA metrics now computed from live data via sla_service.
         Escalation queue, workers endpoints, and SLA enrichment added.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Body

import app.store as store
from app.services import sla_service

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

@router.get("/sla", summary="SLA performance metrics — real computed data")
async def get_sla():
    """
    Returns real-time SLA performance metrics computed from live incident store.
    Phase 7: sla_service computes compliance %, overdue count, dept breakdown.
    """
    incs = list(store.incidents.values())
    return sla_service.get_sla_stats(incs)


@router.get("/performance", summary="Municipal operational performance overview")
async def get_performance():
    incs = list(store.incidents.values())
    all_workers = list(store.workers.values())
    stats = sla_service.get_sla_stats(incs)
    return {
        **stats,
        "open":       sum(1 for i in incs if i.get("status") == "open"),
        "assigned":   sum(1 for i in incs if i.get("status") == "assigned"),
        "in_progress":sum(1 for i in incs if i.get("status") == "in_progress"),
        "workers_available": sum(1 for w in all_workers if w.get("status") == "available"),
        "workers_on_duty":   sum(1 for w in all_workers if w.get("status") == "on_duty"),
        "workers_in_transit":sum(1 for w in all_workers if w.get("status") == "in_transit"),
    }


# ── Escalation Queue ──────────────────────────────────────────────────────────

@router.get("/escalation", summary="Escalation queue — overdue + flagged incidents")
async def get_escalation_queue():
    """
    Returns all incidents that are overdue or manually flagged for escalation.
    Sorted by escalation level and risk score.
    """
    incs = list(store.incidents.values())
    queue = sla_service.get_escalation_queue(incs)
    return {
        "total_escalated": len(queue),
        "incidents": queue,
    }


@router.post("/incidents/{incident_id}/escalate", summary="Manually escalate an incident")
async def escalate_incident(incident_id: str, body: dict = Body(default={})):
    """Manually escalate an incident one level and add a note."""
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    current = inc.get("escalation_level", 0)
    inc["escalation_level"] = min(current + 1, 3)
    inc["status"] = "escalated"
    inc["updated_at"] = datetime.utcnow().isoformat()
    _append_status_history(inc, old=inc.get("status", "open"), new="escalated", note=body.get("reason"))
    return {
        "incident_id": incident_id,
        "escalation_level": inc["escalation_level"],
        "status": "escalated",
        "reason": body.get("reason", "Manually escalated"),
    }


# ── Workers (Admin view) ──────────────────────────────────────────────────────

@router.get("/workers", summary="All field workers with assignment status")
async def get_workers():
    """Return all field workers with their current assignment details (admin view)."""
    all_workers = list(store.workers.values())
    enriched = []
    for w in all_workers:
        inc_id = w.get("assigned_incident_id")
        inc = store.incidents.get(inc_id) if inc_id else None
        enriched.append({
            **w,
            "current_incident_severity": inc.get("severity") if inc else None,
            "current_incident_risk_score": inc.get("risk_score") if inc else None,
            "current_incident_location": inc.get("location_name") if inc else None,
        })
    return {
        "total": len(enriched),
        "available": sum(1 for w in all_workers if w["status"] == "available"),
        "on_duty":   sum(1 for w in all_workers if w["status"] == "on_duty"),
        "in_transit":sum(1 for w in all_workers if w["status"] == "in_transit"),
        "workers": enriched,
    }


@router.post("/incidents/{incident_id}/assign", summary="Assign incident to department/team/worker")
async def assign_incident(incident_id: str, body: dict = Body(...)):
    """
    Assign a civic incident to a department, team, and optionally a field worker.
    Body: `{ "department": "Drainage", "team": "Team-B", "authority": "Ward Officer", "worker_id": "W001" }`
    Phase 7: also sets SLA deadline and updates worker assignment.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    old_status = inc.get("status", "open")
    inc["assigned_department"] = body.get("department", inc.get("assigned_department"))
    inc["assigned_team"]       = body.get("team", inc.get("assigned_team"))
    inc["assigned_authority"]  = body.get("authority", inc.get("assigned_authority"))
    inc["status"]              = "assigned"
    inc["assigned_at"]         = datetime.utcnow().isoformat()
    inc["updated_at"]          = datetime.utcnow().isoformat()

    # Assign worker if provided
    worker_id = body.get("worker_id")
    if worker_id:
        worker = store.workers.get(worker_id)
        if not worker:
            raise HTTPException(404, f"Worker '{worker_id}' not found.")
        inc["assigned_worker_id"] = worker_id
        worker["assigned_incident_id"] = incident_id
        worker["current_task_status"] = "assigned"
        worker["status"] = "on_duty"

    # Set SLA deadline
    from app.services.sla_service import compute_sla_deadline
    inc["sla_deadline"] = compute_sla_deadline(inc).isoformat()

    _append_status_history(inc, old=old_status, new="assigned", note=body.get("note"))

    return {
        "incident_id": incident_id,
        "status":      "assigned",
        "department":  inc["assigned_department"],
        "team":        inc["assigned_team"],
        "worker_id":   worker_id,
        "sla_deadline": inc["sla_deadline"],
    }


from app.services.predictive_service import predictive_service


# ── Predictive & AI Policy Simulator (Phase 9) ────────────────────────────────

@router.get("/predictions", summary="XGBoost & H3 predicted risk forecasts")
async def get_predictions():
    """
    Returns 7-day to 30-day predicted risk indices, H3 spatial hotspot features,
    and ward-by-ward vulnerability forecasts.
    """
    return predictive_service.get_predictive_risk_data()


@router.get("/predictions/recurring", summary="Chronic blackspots & recurring problem analysis")
async def get_recurring_blackspots():
    """
    Returns chronic repeat problem locations (3+ incidents in 90d),
    causal root-cause analysis, and long-term remediation recommendations.
    """
    return predictive_service.get_recurring_problems()


@router.post("/predictions/simulate", summary="Run AI policy & budget simulation")
async def simulate_policy(body: dict = Body(default={})):
    """
    Simulates municipal intervention scenarios (budget increases, field team additions, desilting).
    Returns projected risk reduction %, SLA compliance boost %, prevented incidents, and estimated ROI multiplier.
    """
    return predictive_service.simulate_policy(
        sanitation_budget_increase_pct=float(body.get("sanitation_budget_increase_pct", 0)),
        drainage_budget_increase_pct=float(body.get("drainage_budget_increase_pct", 0)),
        road_budget_increase_pct=float(body.get("road_budget_increase_pct", 0)),
        extra_field_teams=int(body.get("extra_field_teams", 0)),
        pre_monsoon_clearing=bool(body.get("pre_monsoon_clearing", False)),
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _append_status_history(inc: dict, old: str, new: str, note: str = None):
    inc.setdefault("status_history", []).append({
        "old_status": old,
        "new_status": new,
        "timestamp":  datetime.utcnow().isoformat(),
        "actor_type": "admin",
        "note":       note,
    })

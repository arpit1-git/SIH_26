"""
Field Worker API — Phase 7: Municipal Operations & SLA Workflows

Routes:
  GET  /api/field/workers                     — all workers + assignments
  GET  /api/field/workers/{id}                — single worker detail
  POST /api/field/workers/{id}/accept         — accept assigned incident
  POST /api/field/workers/{id}/advance-status — advance task status flow
  POST /api/field/incidents/{id}/after-evidence — submit after-cleanup evidence (mock)
  GET  /api/field/incidents/{id}              — get incident for field view
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Body

import app.store as store

router = APIRouter(prefix="/api/field", tags=["Field Workers"])

# Valid status flow for field workers
STATUS_FLOW = ["assigned", "accepted", "on_the_way", "in_progress", "completed"]

ACTION_LABELS = {
    "assigned":    "Task Assigned",
    "accepted":    "Task Accepted",
    "on_the_way":  "En Route to Site",
    "in_progress": "Work In Progress",
    "completed":   "Work Completed",
}

RECOMMENDED_ACTIONS = {
    "waste": [
        "Dispatch sanitation team to the site",
        "Remove accumulated waste material",
        "Inspect nearby collection points for overflow",
        "Review waste segregation conditions",
        "Capture after-cleanup photographic evidence",
    ],
    "waterlogging": [
        "Inspect nearby drainage outlets for blockage",
        "Clear identified blockage points",
        "Place temporary warning barriers on flooded stretch",
        "Monitor traffic diversion if required",
        "Re-inspect site after drainage action",
    ],
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_worker(worker_id: str) -> dict:
    w = store.workers.get(worker_id)
    if not w:
        raise HTTPException(404, f"Worker '{worker_id}' not found.")
    return w


def _enrich_worker(w: dict) -> dict:
    """Add current assignment details to worker."""
    assigned_id = w.get("assigned_incident_id")
    inc = store.incidents.get(assigned_id) if assigned_id else None
    return {
        **w,
        "current_incident": {
            "incident_id": inc["incident_id"],
            "issue_type": inc["issue_type"],
            "category": inc["category"],
            "severity": inc["severity"],
            "risk_score": inc["risk_score"],
            "location_name": inc["location_name"],
            "latitude": inc["latitude"],
            "longitude": inc["longitude"],
            "image_url": inc.get("image_url"),
            "affected_area_estimate": inc.get("affected_area_estimate"),
            "segmentation_mask_url": inc.get("segmentation_mask_url"),
            "recommended_actions": RECOMMENDED_ACTIONS.get(inc.get("category", "waste"), []),
            "sla_deadline": inc.get("sla_deadline"),
            "status": inc.get("status"),
        } if inc else None,
    }


# ── GET /api/field/workers ────────────────────────────────────────────────────

@router.get("/workers", summary="List all field workers with current assignments")
async def list_workers():
    """Return all field workers enriched with their current incident assignment."""
    all_workers = [_enrich_worker(w) for w in store.workers.values()]
    return {
        "total": len(all_workers),
        "available": sum(1 for w in store.workers.values() if w["status"] == "available"),
        "on_duty":   sum(1 for w in store.workers.values() if w["status"] == "on_duty"),
        "in_transit": sum(1 for w in store.workers.values() if w["status"] == "in_transit"),
        "workers": all_workers,
    }


# ── GET /api/field/workers/{id} ───────────────────────────────────────────────

@router.get("/workers/{worker_id}", summary="Get single field worker detail")
async def get_worker(worker_id: str):
    w = _get_worker(worker_id)
    return _enrich_worker(w)


# ── POST /api/field/workers/{id}/accept ──────────────────────────────────────

@router.post("/workers/{worker_id}/accept", summary="Worker accepts their assigned incident")
async def accept_assignment(worker_id: str):
    """
    Transitions worker status from 'assigned' → 'accepted' and
    incident status from 'assigned' → 'accepted'.
    """
    w = _get_worker(worker_id)
    inc_id = w.get("assigned_incident_id")
    if not inc_id:
        raise HTTPException(400, "Worker has no assigned incident.")

    inc = store.incidents.get(inc_id)
    if not inc:
        raise HTTPException(404, f"Assigned incident '{inc_id}' not found.")

    w["current_task_status"] = "accepted"
    w["status"] = "on_duty"
    inc["status"] = "accepted"
    inc["updated_at"] = _now()

    _log_status(inc, old="assigned", new="accepted", actor=worker_id)

    return {
        "worker_id": worker_id,
        "incident_id": inc_id,
        "task_status": "accepted",
        "message": "Assignment accepted. Proceed to site.",
    }


# ── POST /api/field/workers/{id}/advance-status ───────────────────────────────

@router.post("/workers/{worker_id}/advance-status", summary="Advance worker task status")
async def advance_status(worker_id: str, body: dict = Body(...)):
    """
    Advance task status along the fixed flow:
    assigned → accepted → on_the_way → in_progress → completed

    Body: `{ "status": "in_progress" }`
    """
    w = _get_worker(worker_id)
    inc_id = w.get("assigned_incident_id")
    if not inc_id:
        raise HTTPException(400, "Worker has no active incident assignment.")

    inc = store.incidents.get(inc_id)
    if not inc:
        raise HTTPException(404, f"Incident '{inc_id}' not found.")

    new_status = body.get("status", "").lower()
    if new_status not in STATUS_FLOW:
        raise HTTPException(400, f"Invalid status '{new_status}'. Valid: {STATUS_FLOW}")

    current = w.get("current_task_status", "assigned")
    current_idx = STATUS_FLOW.index(current) if current in STATUS_FLOW else 0
    new_idx = STATUS_FLOW.index(new_status)

    if new_idx != current_idx + 1:
        raise HTTPException(400, f"Cannot jump from '{current}' to '{new_status}'. Follow the sequential flow.")

    old_status = w["current_task_status"]
    w["current_task_status"] = new_status
    inc["status"] = new_status
    inc["updated_at"] = _now()

    if new_status == "completed":
        w["status"] = "available"
        # Keep assignment until after-evidence uploaded
        inc["status"] = "completed"

    _log_status(inc, old=old_status, new=new_status, actor=worker_id)

    return {
        "worker_id": worker_id,
        "incident_id": inc_id,
        "previous_status": old_status,
        "current_status": new_status,
        "label": ACTION_LABELS.get(new_status, new_status),
        "next_step": STATUS_FLOW[new_idx + 1] if new_idx + 1 < len(STATUS_FLOW) else "Upload after-evidence",
    }


# ── POST /api/field/incidents/{id}/after-evidence ─────────────────────────────

@router.post("/incidents/{incident_id}/after-evidence", summary="Submit after-cleanup evidence")
async def submit_after_evidence(incident_id: str, body: dict = Body(default={})):
    """
    Mock after-evidence submission (Phase 7 demo).
    Marks incident as 'completed' with simulated CV verification result.
    Full file-upload + CV pipeline in Phase 8.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    # Simulate CV verification result
    inc["status"]               = "resolved"
    inc["resolved_at"]          = _now()
    inc["updated_at"]           = _now()
    inc["after_image_url"]      = inc.get("before_image_url") or inc.get("image_url")
    inc["verification_status"]  = "fully_resolved"
    inc["verification_reduction_pct"] = 91.5
    inc["verification_confidence"]    = 0.94

    # Free up assigned worker
    worker_id = inc.get("assigned_worker_id")
    if worker_id and worker_id in store.workers:
        store.workers[worker_id]["status"] = "available"
        store.workers[worker_id]["assigned_incident_id"] = None
        store.workers[worker_id]["current_task_status"] = None
        store.workers[worker_id]["total_resolved"] = store.workers[worker_id].get("total_resolved", 0) + 1

    _log_status(inc, old="completed", new="resolved", actor=worker_id or "field_worker")

    return {
        "incident_id": incident_id,
        "status": "resolved",
        "verification_status": "fully_resolved",
        "verification_reduction_pct": 91.5,
        "verification_confidence": 0.94,
        "message": "✅ AI Verified Resolution — incident marked as resolved.",
    }


# ── GET /api/field/incidents/{id} ─────────────────────────────────────────────

@router.get("/incidents/{incident_id}", summary="Get incident in field worker view")
async def get_field_incident(incident_id: str):
    """Return an incident with field-worker-specific enrichment."""
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    category = inc.get("category", "waste")
    return {
        **inc,
        "recommended_actions": RECOMMENDED_ACTIONS.get(category, []),
        "nearby_facilities": store.facilities.get(incident_id, []),
        "status_flow": STATUS_FLOW,
        "action_labels": ACTION_LABELS,
    }


# ── Helper ─────────────────────────────────────────────────────────────────────

def _log_status(inc: dict, old: str, new: str, actor: str = "field_worker"):
    inc.setdefault("status_history", []).append({
        "old_status": old,
        "new_status": new,
        "timestamp":  _now(),
        "actor_type": "field_worker",
        "actor_id":   actor,
    })

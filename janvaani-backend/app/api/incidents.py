"""
Incidents API — /api/incidents

Public-facing civic incident endpoints. No authentication required.
Phase 1: in-memory store. Phase 4: PostgreSQL/PostGIS.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

import app.store as store

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


# ── Enrichment ────────────────────────────────────────────────────────────────

def _enrich(inc: dict) -> dict:
    """Add computed / derived fields to raw incident dict."""
    risk = inc.get("risk_score", 30.0)
    level = (
        "critical" if risk >= 81
        else "high" if risk >= 56
        else "medium" if risk >= 31
        else "low"
    )
    return {
        **inc,
        "level": level,
        "civic_impact_score": round(risk * 0.95, 1),
        "evidence_score": inc.get("evidence_score", 0.80),
        "complaint_velocity": 0.0,          # Phase 5
        "recurrence_count": 0,              # Phase 9
        "assigned_authority": None,         # Phase 7
        "assigned_department": None,        # Phase 7
        "assigned_team": None,              # Phase 7
        "sla_deadline": None,               # Phase 7
        "escalation_level": 0,              # Phase 7
        "resolved_at": None,
        "h3_index": None,                   # Phase 4
        "nearby_facilities": [],            # Phase 4
        "ai_summary": None,                 # Phase 6
        "ai_recommendation": None,         # Phase 6
        "comments": store.comments.get(inc["incident_id"], []),
        "status_history": inc.get("status_history", []),
        "explanation_bullets": inc.get("explanation_bullets", []),
        "address": inc.get("address"),
        "updated_at": inc.get("updated_at", inc.get("created_at", "")),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", summary="List civic incidents — public feed")
async def list_incidents(
    issue_type: Optional[str]  = Query(None, description="Filter by issue type"),
    severity: Optional[str]    = Query(None, description="Filter by severity level"),
    status: Optional[str]      = Query(None, description="Filter by status (open/assigned/resolved)"),
    level: Optional[str]       = Query(None, description="Filter by risk level (low/medium/high/critical)"),
    limit: int                 = Query(20, le=100),
    offset: int                = Query(0, ge=0),
):
    """
    Public complaint feed — returns paginated civic incidents.
    Sorted by risk_score descending (most urgent first).
    No authentication required.
    """
    incidents = list(store.incidents.values())

    if issue_type:
        incidents = [i for i in incidents if i.get("issue_type") == issue_type]
    if severity:
        incidents = [i for i in incidents if i.get("severity") == severity]
    if status:
        incidents = [i for i in incidents if i.get("status") == status]
    if level:
        def _level(r):
            return "critical" if r >= 81 else "high" if r >= 56 else "medium" if r >= 31 else "low"
        incidents = [i for i in incidents if _level(i.get("risk_score", 0)) == level]

    incidents.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    total = len(incidents)
    page  = [_enrich(i) for i in incidents[offset : offset + limit]]

    return {"total": total, "limit": limit, "offset": offset, "incidents": page}


@router.get("/{incident_id}", summary="Get full incident details")
async def get_incident(incident_id: str):
    """
    Returns the complete evidence-to-resolution data for one civic incident.
    Public access — no authentication required.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    return _enrich(inc)


@router.post("/{incident_id}/support", summary="I am also affected")
async def support_incident(incident_id: str):
    """
    Register citizen support: "I am also affected."
    Increments `support_count` without creating a duplicate complaint.
    Phase 5 will add per-IP rate limiting.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    inc["support_count"] = inc.get("support_count", 0) + 1
    inc["updated_at"] = datetime.utcnow().isoformat()

    return {
        "incident_id": incident_id,
        "support_count": inc["support_count"],
        "message": "Support registered — thank you for reporting.",
    }


@router.post("/{incident_id}/like", summary="Like an incident")
async def like_incident(incident_id: str):
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    inc["like_count"] = inc.get("like_count", 0) + 1
    return {"incident_id": incident_id, "like_count": inc["like_count"]}


@router.post("/{incident_id}/comments", summary="Add a comment to an incident")
async def add_comment(incident_id: str, body: dict):
    """
    Add a public comment to a civic incident.
    Body: `{ "text": "..." }`
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(400, "Comment text cannot be empty.")
    if len(text) > 500:
        raise HTTPException(400, "Comment too long. Max 500 characters.")

    comment = {
        "id": str(uuid.uuid4()),
        "text": text,
        "created_at": datetime.utcnow().isoformat(),
    }
    store.comments.setdefault(incident_id, []).append(comment)

    return {
        "incident_id": incident_id,
        "comment": comment,
        "total_comments": len(store.comments[incident_id]),
    }


@router.get("/{incident_id}/comments", summary="Get comments for an incident")
async def get_comments(incident_id: str):
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    return {
        "incident_id": incident_id,
        "comments": store.comments.get(incident_id, []),
        "total": len(store.comments.get(incident_id, [])),
    }

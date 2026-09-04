"""
Incidents API — /api/incidents

Public-facing civic incident endpoints. No authentication required.
Phase 1: in-memory store. Phase 4: PostgreSQL/PostGIS.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.priority_scoring import calculate_civic_risk_score, get_evidence_confidence_label
from app.services.explainer_service import generate_why_critical_explanation, generate_recommended_actions
import app.store as store

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


# ── Scoring & Dynamic Recalculation ───────────────────────────────────────────

def _rescore_incident(inc: dict) -> None:
    """Dynamically recalculates priority score, civic impact, and explanation factors."""
    facilities = store.facilities.get(inc["incident_id"], [])
    
    # Extract proximity metrics from attached facilities if present
    hosp_dist = 600.0
    school_dist = 600.0
    for f in facilities:
        if f.get("facility_type") == "hospital":
            hosp_dist = min(hosp_dist, float(f.get("distance_meters", 600.0)))
        elif f.get("facility_type") == "school":
            school_dist = min(school_dist, float(f.get("distance_meters", 600.0)))

    scoring_data = {
        "severity": inc.get("severity", "medium"),
        "confidence": inc.get("evidence_score", 0.85),
        "complaint_count": inc.get("complaint_count", 1),
        "support_count": inc.get("support_count", 0),
        "complaint_velocity": inc.get("complaint_velocity", 1.0),
        "affected_area_estimate": inc.get("affected_area_estimate", 25.0),
        "hospital_distance_m": hosp_dist,
        "school_distance_m": school_dist,
        "is_arterial_road": True,
        "recurrence_count": inc.get("recurrence_count", 0),
        "hours_unresolved": 2.0,
    }

    risk_score, civic_impact, level, factors = calculate_civic_risk_score(scoring_data)
    inc["risk_score"] = risk_score
    inc["civic_impact_score"] = civic_impact
    inc["level"] = level
    inc["explanation_bullets"] = factors
    inc["updated_at"] = datetime.utcnow().isoformat()


# ── Enrichment ────────────────────────────────────────────────────────────────

def _enrich(inc: dict) -> dict:
    """Add computed / derived fields to raw incident dict for complete Phase 5 payload."""
    risk = inc.get("risk_score", 30.0)
    level = (
        "critical" if risk >= 81
        else "high" if risk >= 56
        else "medium" if risk >= 31
        else "low"
    )
    
    evidence_score = float(inc.get("evidence_score", 0.82))
    complaint_count = int(inc.get("complaint_count", 1))
    confidence_info = get_evidence_confidence_label(evidence_score, complaint_count)
    
    incident_facilities = store.facilities.get(inc["incident_id"], [
        {
            "facility_type": "hospital",
            "name": "Central District Trauma Hospital",
            "distance_meters": 320.0,
        },
        {
            "facility_type": "school",
            "name": "Govt Model Senior School",
            "distance_meters": 210.0,
        },
        {
            "facility_type": "arterial_road",
            "name": "Main City Arterial Corridor",
            "distance_meters": 45.0,
        }
    ])

    recommended_actions = generate_recommended_actions(
        inc.get("issue_type", "civic_issue"),
        level,
    )

    return {
        **inc,
        "level": level,
        "civic_impact_score": inc.get("civic_impact_score", round(risk * 0.95, 1)),
        "evidence_score": evidence_score,
        "evidence_confidence": confidence_info,
        "complaint_velocity": inc.get("complaint_velocity", 1.2),
        "recurrence_count": inc.get("recurrence_count", 0),
        "assigned_authority": inc.get("assigned_authority", "Municipal Corporation"),
        "assigned_department": inc.get("assigned_department", "Public Works & Sanitation"),
        "assigned_team": inc.get("assigned_team", "Rapid Response Squad #1"),
        "sla_deadline": inc.get("sla_deadline"),
        "escalation_level": inc.get("escalation_level", 0),
        "resolved_at": inc.get("resolved_at"),
        "h3_index": inc.get("h3_index", "8860145b00ffffff"),
        "nearby_facilities": incident_facilities,
        "recommended_actions": recommended_actions,
        "comments": store.comments.get(inc["incident_id"], []),
        "status_history": inc.get("status_history", []),
        "explanation_bullets": inc.get("explanation_bullets", []),
        "address": inc.get("address", inc.get("location_name")),
        "updated_at": inc.get("updated_at", inc.get("created_at", "")),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", summary="List civic incidents — public feed")
async def list_incidents(
    issue_type: Optional[str]  = Query(None, description="Filter by issue type"),
    severity: Optional[str]    = Query(None, description="Filter by severity level"),
    status: Optional[str]      = Query(None, description="Filter by status (open/assigned/resolved)"),
    level: Optional[str]       = Query(None, description="Filter by risk level (low/medium/high/critical)"),
    limit: int                 = Query(50, le=100),
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


@router.get("/{incident_id}/explanation", summary="Explainable AI reasoning breakdown")
async def get_incident_explanation(incident_id: str):
    """
    Returns 'Why is this Critical?' explainable AI reasoning, factor contribution percentages,
    and recommended municipal actions (PRD Sections 17 & 34).
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    
    enriched = _enrich(inc)
    return generate_why_critical_explanation(enriched)


@router.get("/{incident_id}/facilities", summary="Nearby critical facilities & threat perimeter")
async def get_incident_facilities(incident_id: str):
    """
    Returns geospatial critical infrastructure proximity list (Hospitals, Schools, Arterial Roads, Drains).
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")
    
    facilities = store.facilities.get(incident_id, [
        {"facility_type": "hospital", "name": "Central District Trauma Hospital", "distance_meters": 320.0},
        {"facility_type": "school", "name": "Govt Senior Secondary Model School", "distance_meters": 180.0},
        {"facility_type": "arterial_road", "name": "Main Arterial Transit Ring Road", "distance_meters": 50.0},
        {"facility_type": "storm_drain", "name": "Primary Outfall Stormwater Channel #4", "distance_meters": 120.0},
    ])
    return {"incident_id": incident_id, "facilities": facilities, "total": len(facilities)}


@router.post("/{incident_id}/support", summary="I am also affected")
async def support_incident(incident_id: str):
    """
    Register citizen support: "I am also affected."
    Increments `support_count`, recalculates complaint velocity, and dynamically escalates priority score.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    inc["support_count"] = inc.get("support_count", 0) + 1
    # Velocity surge upon active community support
    inc["complaint_velocity"] = round(inc.get("complaint_velocity", 1.0) + 0.3, 1)
    
    # Dynamic recalculation
    _rescore_incident(inc)

    return {
        "incident_id": incident_id,
        "support_count": inc["support_count"],
        "complaint_velocity": inc["complaint_velocity"],
        "new_risk_score": inc["risk_score"],
        "new_civic_impact": inc["civic_impact_score"],
        "level": inc["level"],
        "message": "Support registered — civic priority score dynamically updated.",
    }


@router.post("/{incident_id}/recalculate", summary="Recalculate priority score")
async def recalculate_incident_priority(incident_id: str):
    """
    Forces full dynamic AI priority scoring recalculation for an incident.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    _rescore_incident(inc)
    return {
        "incident_id": incident_id,
        "risk_score": inc["risk_score"],
        "civic_impact_score": inc["civic_impact_score"],
        "level": inc["level"],
        "explanation_bullets": inc["explanation_bullets"],
        "updated_at": inc["updated_at"],
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
    Body: `{ "text": "...", "author_name": "..." }`
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident '{incident_id}' not found.")

    text = (body.get("text") or "").strip()
    author = (body.get("author_name") or "Concerned Citizen").strip()
    if not text:
        raise HTTPException(400, "Comment text cannot be empty.")
    if len(text) > 500:
        raise HTTPException(400, "Comment too long. Max 500 characters.")

    comment = {
        "comment_id": f"c-{uuid.uuid4().hex[:8]}",
        "author_name": author,
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

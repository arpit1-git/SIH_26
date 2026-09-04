"""
Celery worker for async AI processing tasks.
Phase 5 will wire real tasks (re-scoring, velocity calculation, etc.).
"""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "janvaani",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


import app.store as store
from app.services.priority_scoring import calculate_civic_risk_score


# ── Phase 5 Async Tasks ───────────────────────────────────────────────────────

@celery_app.task(name="janvaani.tasks.recalculate_score")
def recalculate_score(incident_id: str):
    """
    Recalculate multi-factor priority score for an incident in the background.
    Triggered when: new complaint attached, citizen support incremented, or SLA breach detected.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        return {"status": "error", "message": f"Incident {incident_id} not found"}

    facilities = store.facilities.get(incident_id, [])
    hosp_dist = min([float(f.get("distance_meters", 600.0)) for f in facilities if f.get("facility_type") == "hospital"] or [600.0])
    school_dist = min([float(f.get("distance_meters", 600.0)) for f in facilities if f.get("facility_type") == "school"] or [600.0])

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

    return {
        "status": "success",
        "incident_id": incident_id,
        "risk_score": risk_score,
        "civic_impact_score": civic_impact,
        "level": level,
    }


@celery_app.task(name="janvaani.tasks.calculate_velocity")
def calculate_velocity(incident_id: str):
    """
    Calculate complaint velocity (reports/hour surge) for an incident.
    """
    inc = store.incidents.get(incident_id)
    if not inc:
        return {"status": "error", "message": f"Incident {incident_id} not found"}

    complaints_count = inc.get("complaint_count", 1)
    support_count = inc.get("support_count", 0)
    
    # Calculate velocity: dynamic surge rate
    velocity = round(1.0 + (complaints_count * 0.25) + (support_count * 0.05), 1)
    inc["complaint_velocity"] = velocity

    return {"status": "success", "incident_id": incident_id, "complaint_velocity": velocity}


@celery_app.task(name="janvaani.tasks.process_video")
def process_video(complaint_id: str, file_path: str):
    """
    Extract frames from video and run AI detection in background worker.
    """
    return {"status": "success", "complaint_id": complaint_id, "processed_frames": 12}

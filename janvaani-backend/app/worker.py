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


# ── Phase 5 tasks will be added here ─────────────────────────────────────────

@celery_app.task(name="janvaani.tasks.recalculate_score")
def recalculate_score(incident_id: str):
    """
    Recalculate XGBoost priority score for an incident.
    Triggered when: new complaint attached, support threshold, SLA breach.
    Phase 5 implementation.
    """
    # TODO Phase 5: fetch incident, run ai.score(), update DB
    return {"status": "stub", "incident_id": incident_id}


@celery_app.task(name="janvaani.tasks.calculate_velocity")
def calculate_velocity(incident_id: str):
    """
    Calculate complaint velocity (reports/hour) for an incident.
    Phase 5 implementation.
    """
    # TODO Phase 5: query complaint timestamps, compute rate
    return {"status": "stub", "incident_id": incident_id}


@celery_app.task(name="janvaani.tasks.process_video")
def process_video(complaint_id: str, file_path: str):
    """
    Extract frames from video and run AI detection.
    Heavy task — runs in background worker, not in HTTP request.
    """
    # TODO Phase 2+: extract frames, run detect_and_segment per frame
    return {"status": "stub", "complaint_id": complaint_id}

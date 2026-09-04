"""
Complaints API — /api/complaints

Handles citizen complaint submission and AI analysis preview.
Phase 1: uses in-memory store. Phase 4: replaced with PostgreSQL/PostGIS.
"""

import math
import os
import uuid
from datetime import datetime
from typing import Optional

import aiofiles
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import settings
from app.schemas.complaints import ComplaintAnalyzeResponse, ComplaintResponse
from app.schemas.ai import IssueType
from app.services.ai_service_factory import get_ai_service
import app.store as store

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

ALLOWED_MEDIA_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "video/mp4", "video/webm", "video/quicktime",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in metres. Phase 4: replaced by PostGIS ST_DWithin."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _find_or_create_incident(
    latitude: float,
    longitude: float,
    issue_type: str,
    complaint_id: str,
    ai_result,
    radius_m: float = 200.0,
) -> tuple[str, str]:
    """
    Find nearby incident of the same type within radius_m, or create a new one.
    Returns (incident_id, action) where action is 'merged' | 'created'.

    Phase 4: replaced with PostGIS ST_DWithin + H3 cell proximity query.
    """
    for inc_id, inc in store.incidents.items():
        if inc.get("issue_type") != issue_type:
            continue
        dist = _haversine_m(latitude, longitude, inc["latitude"], inc["longitude"])
        if dist <= radius_m:
            inc["complaint_count"] += 1
            inc["updated_at"] = datetime.utcnow().isoformat()
            return inc_id, "merged"

    # Create new incident
    incident_id = f"JV-{str(uuid.uuid4())[:8].upper()}"
    severity_score = {"low": 20, "medium": 40, "high": 65, "critical": 85}.get(
        ai_result.severity_initial.value, 35
    )
    store.incidents[incident_id] = {
        "incident_id": incident_id,
        "issue_type": issue_type,
        "severity": ai_result.severity_initial.value,
        "risk_score": float(severity_score),
        "latitude": latitude,
        "longitude": longitude,
        "complaint_count": 1,
        "support_count": 0,
        "like_count": 0,
        "status": "open",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "segmentation_mask_url": ai_result.segmentation_mask_url,
        "evidence_score": ai_result.evidence_score,
    }
    return incident_id, "created"


async def _save_upload(file: UploadFile, complaint_id: str) -> tuple[str, bytes]:
    """Save uploaded file, return (media_url, file_bytes)."""
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    raw_ext = os.path.splitext(file.filename or "upload.jpg")[1]
    ext = raw_ext if raw_ext else ".jpg"
    filename = f"{complaint_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File too large. Max: {settings.MAX_UPLOAD_SIZE_MB} MB.")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(file_bytes)

    return f"/uploads/{filename}", file_bytes


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=ComplaintAnalyzeResponse,
    summary="Upload media and get AI analysis (pre-submit preview)",
)
async def analyze_complaint(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    issue_type_hint: Optional[str] = Form(None),
):
    """
    Upload media and receive AI detection + segmentation results immediately.
    This is **Step 5** of the 6-step report wizard — the user sees AI results
    *before* confirming submission.

    The complaint is not yet persisted; call `POST /api/complaints` to submit.
    """
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(400, f"Unsupported media type: {file.content_type}")

    complaint_id = str(uuid.uuid4())
    _, image_bytes = await _save_upload(file, complaint_id + "_preview")

    ai = get_ai_service()
    # Hint filename with issue type for better mock type selection
    filename_hint = f"{issue_type_hint or ''}_{file.filename or 'upload'}"
    ai_result = await ai.detect_and_segment(image_bytes, filename=filename_hint)

    incident_id, action = _find_or_create_incident(
        latitude=latitude,
        longitude=longitude,
        issue_type=ai_result.issue_type.value,
        complaint_id=complaint_id,
        ai_result=ai_result,
    )
    incident = store.incidents[incident_id]

    return ComplaintAnalyzeResponse(
        complaint_id=complaint_id,
        incident_id=incident_id,
        action=action,
        incident_complaint_count=incident["complaint_count"],
        ai_result=ai_result,
    )


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=201,
    summary="Submit complaint (final step)",
)
async def create_complaint(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    issue_type_hint: Optional[str] = Form(None),
    text_description: Optional[str] = Form(None),
    voice_transcript: Optional[str] = Form(None),
    incident_id: Optional[str] = Form(None),
):
    """
    Final complaint submission.
    Saves media, runs AI analysis, attaches to or creates a civic incident.
    """
    if file.content_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(400, f"Unsupported media type: {file.content_type}")

    complaint_id = str(uuid.uuid4())
    media_url, image_bytes = await _save_upload(file, complaint_id)

    ai = get_ai_service()
    filename_hint = f"{issue_type_hint or ''}_{file.filename or 'upload'}"
    ai_result = await ai.detect_and_segment(image_bytes, filename=filename_hint)

    if not incident_id:
        incident_id, _ = _find_or_create_incident(
            latitude=latitude,
            longitude=longitude,
            issue_type=ai_result.issue_type.value,
            complaint_id=complaint_id,
            ai_result=ai_result,
        )

    now = datetime.utcnow()
    complaint = {
        "complaint_id": complaint_id,
        "incident_id": incident_id,
        "media_url": media_url,
        "media_type": file.content_type,
        "text_description": text_description,
        "voice_transcript": voice_transcript,
        "latitude": latitude,
        "longitude": longitude,
        "created_at": now,
        "evidence_score": ai_result.evidence_score,
        "status": "submitted",
    }
    store.complaints[complaint_id] = complaint

    return ComplaintResponse(
        **complaint,
        message="Complaint submitted successfully. Thank you for reporting.",
    )

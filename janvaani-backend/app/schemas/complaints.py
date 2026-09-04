from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .ai import IssueType, DetectionResult


class ComplaintAnalyzeResponse(BaseModel):
    """
    Response from POST /api/complaints/analyze.
    Returned before final submit — shows AI result preview in the wizard.
    """
    complaint_id: str
    incident_id: Optional[str] = None
    action: str = Field(..., description="'created' | 'merged' — new or attached to existing")
    incident_complaint_count: int
    ai_result: DetectionResult


class ComplaintResponse(BaseModel):
    """Response after POST /api/complaints — final submission."""
    complaint_id: str
    incident_id: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    text_description: Optional[str]
    voice_transcript: Optional[str]
    latitude: float
    longitude: float
    created_at: datetime
    evidence_score: float
    status: str
    message: str = "Complaint submitted successfully."

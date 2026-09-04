from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .ai import IssueType, SeverityLevel, RiskLevel


class IncidentSummary(BaseModel):
    """Compact incident representation for the public feed / list view."""
    incident_id: str
    issue_type: IssueType
    severity: SeverityLevel
    risk_score: float
    civic_impact_score: float
    level: RiskLevel
    complaint_count: int
    support_count: int
    like_count: int = 0
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    segmentation_mask_url: Optional[str] = None
    explanation_bullets: List[str] = []


class IncidentDetail(IncidentSummary):
    """Full incident details for the evidence-to-resolution detail page."""
    evidence_score: float
    complaint_velocity: float
    recurrence_count: int
    assigned_authority: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_team: Optional[str] = None
    sla_deadline: Optional[str] = None
    escalation_level: int = 0
    resolved_at: Optional[str] = None
    h3_index: Optional[str] = None
    nearby_facilities: List[dict] = []
    ai_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None
    comments: List[dict] = []
    status_history: List[dict] = []

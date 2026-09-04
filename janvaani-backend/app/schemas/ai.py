"""
AI-related Pydantic schemas.

These define the contract between:
  - MockAIService  (current Phase 1 implementation)
  - YOLOAIService  (future YOLO26-Seg implementation)
  - All API endpoints and frontend responses

CRITICAL: Do not change field names without updating the frontend and
          ai_service.py abstract interface simultaneously.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class IssueType(str, Enum):
    # Waste types
    PLASTIC_WASTE    = "plastic_waste"
    ORGANIC_WASTE    = "organic_waste"
    MIXED_WASTE      = "mixed_waste"
    ILLEGAL_DUMPING  = "illegal_dumping"
    OVERFLOWING_BIN  = "overflowing_bin"
    # Water types
    WATERLOGGING     = "waterlogging"
    FLOODED_ROAD     = "flooded_road"
    STANDING_WATER   = "standing_water"
    BLOCKED_DRAINAGE = "blocked_drainage"


class SeverityLevel(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"


class EvidenceConfidenceLevel(str, Enum):
    HIGH            = "high"          # evidence_score >= 0.75
    NEEDS_REVIEW    = "needs_review"  # 0.50 – 0.74
    INSUFFICIENT    = "insufficient"  # < 0.50


class RiskLevel(str, Enum):
    LOW      = "low"       # 0 – 30
    MEDIUM   = "medium"    # 31 – 55
    HIGH     = "high"      # 56 – 80
    CRITICAL = "critical"  # 81 – 100


# ── Detection / Segmentation ──────────────────────────────────────────────────

class Detection(BaseModel):
    """Single detected object from YOLO inference (or mock)."""
    label: str = Field(..., description="Detected class label (e.g. 'waterlogging')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence 0–1")
    bbox: List[int] = Field(..., description="Bounding box [x1, y1, x2, y2] in pixels")
    affected_area_estimate: float = Field(
        ..., ge=0.0, description="Estimated affected area in m²"
    )


class DetectionResult(BaseModel):
    """
    Full result from detect_and_segment().
    Returned by POST /api/ai/detect and POST /api/ai/segment.

    YOLO swap note:
      - Mock: label/confidence/area are randomized realistic values
      - YOLO: label/confidence/area are from real YOLO26-Seg inference
      - segmentation_mask_url points to /api/ai/mock-mask (mock) or real mask PNG (YOLO)
    """
    issue_type: IssueType
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity_initial: SeverityLevel
    detections: List[Detection]
    segmentation_mask_url: Optional[str] = Field(
        None, description="URL of the segmentation mask overlay PNG"
    )
    evidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Combined evidence reliability score"
    )
    evidence_level: EvidenceConfidenceLevel
    processing_time_ms: int
    model_name: str
    model_version: str


# ── Voice Transcription ───────────────────────────────────────────────────────

class TranscriptionResult(BaseModel):
    """Result from transcribe(). Powered by Whisper (or mock)."""
    transcript: str
    language: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    extracted_issue_type: Optional[IssueType] = None
    extracted_landmark: Optional[str] = None
    processing_time_ms: int


# ── AI Summary ────────────────────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    """Input context for Gemini AI summary generation."""
    incident_id: Optional[str] = None
    issue_type: IssueType
    severity: SeverityLevel
    risk_score: float = Field(..., ge=0.0, le=100.0)
    complaint_count: int = Field(default=1, ge=1)
    support_count: int = Field(default=0, ge=0)
    complaint_velocity: float = Field(default=0.0, description="Reports per hour")
    hours_unresolved: float = Field(default=0.0, ge=0.0)
    nearby_facilities: List[dict] = []
    affected_area_m2: Optional[float] = None
    location_description: Optional[str] = None


# ── Priority Scoring ──────────────────────────────────────────────────────────

class ScoreInput(BaseModel):
    """
    Structured input features for XGBoost priority scoring.
    Phase 5 will build the full XGBoost model. Phase 1 uses heuristic mock scoring.
    """
    issue_type: IssueType
    severity_numeric: float = Field(
        ..., ge=0.0, le=3.0, description="0=low, 1=medium, 2=high, 3=critical"
    )
    detection_confidence: float = Field(..., ge=0.0, le=1.0)
    complaint_count: int = Field(default=1, ge=1)
    support_count: int = Field(default=0, ge=0)
    complaint_velocity: float = Field(default=0.0, description="Reports per hour")
    affected_area_m2: float = Field(default=0.0, ge=0.0)
    road_importance: float = Field(
        default=0.5, ge=0.0, le=1.0, description="0=minor lane, 1=arterial road"
    )
    nearby_school_dist_m: Optional[float] = Field(None, ge=0.0)
    nearby_hospital_dist_m: Optional[float] = Field(None, ge=0.0)
    hours_unresolved: float = Field(default=0.0, ge=0.0)
    recurrence_count: int = Field(default=0, ge=0)
    escalation_level: int = Field(default=0, ge=0)


class ScoreResult(BaseModel):
    """
    Output of the Civic Priority Scoring engine.
    risk_score and civic_impact_score are both 0–100.
    explanation_bullets are plain-language reasons for the score.
    """
    risk_score: float = Field(..., ge=0.0, le=100.0)
    civic_impact_score: float = Field(..., ge=0.0, le=100.0)
    level: RiskLevel
    explanation_bullets: List[str]


# ── Resolution Verification ───────────────────────────────────────────────────

class VerificationResult(BaseModel):
    """
    Result from before/after computer vision comparison.

    YOLO swap note:
      - Mock: random realistic area values and reduction %
      - YOLO: real pixel-level segmentation area measured from both images
    """
    area_before_m2: float
    area_after_m2: float
    reduction_pct: float = Field(..., ge=0.0, le=100.0)
    outcome: str  # fully_resolved | partially_resolved | not_verified | needs_review
    outcome_label: str
    outcome_emoji: str
    confidence: float = Field(..., ge=0.0, le=1.0)

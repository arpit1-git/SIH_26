"""
SQLAlchemy ORM Entities for JANVAANI.
Defines tables for complaints, incidents, AI analysis, nearby facilities, and municipal structure.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum as SAEnum,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class CivicIncident(Base):
    """Aggregated civic incident representing a clustered issue."""
    __tablename__ = "civic_incidents"

    incident_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"JV-{uuid.uuid4().hex[:6].upper()}")
    issue_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)  # "waste" | "waterlogging"
    severity: Mapped[str] = mapped_column(String(20), default="medium")  # critical, high, medium, low
    
    # Priority Scoring Engine
    risk_score: Mapped[float] = mapped_column(Float, default=50.0, index=True)
    civic_impact_score: Mapped[float] = mapped_column(Float, default=50.0)
    evidence_score: Mapped[float] = mapped_column(Float, default=0.8)
    
    # Geospatial Details
    h3_index: Mapped[str] = mapped_column(String(20), index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location_name: Mapped[str] = mapped_column(String(255), default="Urban Sector")
    ward_number: Mapped[int] = mapped_column(Integer, default=1)
    
    # Dynamics & Engagement
    complaint_count: Mapped[int] = mapped_column(Integer, default=1)
    support_count: Mapped[int] = mapped_column(Integer, default=0)
    complaint_velocity: Mapped[float] = mapped_column(Float, default=0.0)
    recurrence_count: Mapped[int] = mapped_column(Integer, default=0)
    is_hotspot: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Municipal Management
    assigned_authority: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_team: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="open")  # open, in_progress, resolved, escalated
    sla_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    escalation_level: Mapped[int] = mapped_column(Integer, default=0)
    
    # Media & Visuals
    image_url: Mapped[str] = mapped_column(String(500), default="/ui_themes/waste1.jpg")
    segmentation_mask_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    affected_area_estimate: Mapped[float] = mapped_column(Float, default=25.0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="incident", cascade="all, delete-orphan")
    facilities: Mapped[List["NearbyFacilityEvidence"]] = relationship("NearbyFacilityEvidence", back_populates="incident", cascade="all, delete-orphan")
    history: Mapped[List["StatusHistory"]] = relationship("StatusHistory", back_populates="incident", cascade="all, delete-orphan")
    comments: Mapped[List["IncidentComment"]] = relationship("IncidentComment", back_populates="incident", cascade="all, delete-orphan")


class Complaint(Base):
    """Raw citizen complaint submission."""
    __tablename__ = "complaints"

    complaint_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"CMP-{uuid.uuid4().hex[:8].upper()}")
    incident_id: Mapped[str] = mapped_column(String(50), ForeignKey("civic_incidents.incident_id"), nullable=False)
    
    media_url: Mapped[str] = mapped_column(String(500), default="/ui_themes/waste1.jpg")
    media_type: Mapped[str] = mapped_column(String(20), default="image")
    text_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    voice_transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    location_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    evidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    status: Mapped[str] = mapped_column(String(30), default="analyzed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident: Mapped["CivicIncident"] = relationship("CivicIncident", back_populates="complaints")
    ai_analysis: Mapped[Optional["AIAnalysis"]] = relationship("AIAnalysis", back_populates="complaint", uselist=False, cascade="all, delete-orphan")


class AIAnalysis(Base):
    """Computer Vision detection and segmentation results."""
    __tablename__ = "ai_analysis"

    analysis_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"AI-{uuid.uuid4().hex[:8]}")
    complaint_id: Mapped[str] = mapped_column(String(50), ForeignKey("complaints.complaint_id"), nullable=False)
    
    issue_type: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.88)
    severity_initial: Mapped[str] = mapped_column(String(20), default="medium")
    
    bbox_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    affected_area_estimate: Mapped[float] = mapped_column(Float, default=20.0)
    segmentation_mask_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    evidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=320)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="ai_analysis")


class NearbyFacilityEvidence(Base):
    """Geospatial proximity markers (schools, hospitals, arterial roads)."""
    __tablename__ = "nearby_facilities"

    facility_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"FAC-{uuid.uuid4().hex[:8]}")
    incident_id: Mapped[str] = mapped_column(String(50), ForeignKey("civic_incidents.incident_id"), nullable=False)
    
    facility_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "hospital", "school", "arterial_road", "storm_drain"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_meters: Mapped[float] = mapped_column(Float, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    incident: Mapped["CivicIncident"] = relationship("CivicIncident", back_populates="facilities")


class StatusHistory(Base):
    """Audit log of status changes and assignments."""
    __tablename__ = "status_history"

    history_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"HIST-{uuid.uuid4().hex[:8]}")
    incident_id: Mapped[str] = mapped_column(String(50), ForeignKey("civic_incidents.incident_id"), nullable=False)
    
    old_status: Mapped[str] = mapped_column(String(30))
    new_status: Mapped[str] = mapped_column(String(30))
    updated_by: Mapped[str] = mapped_column(String(100), default="System AI Engine")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident: Mapped["CivicIncident"] = relationship("CivicIncident", back_populates="history")


class Feedback(Base):
    """Citizen resolution rating and feedback."""
    __tablename__ = "feedback"

    feedback_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"FB-{uuid.uuid4().hex[:8]}")
    incident_id: Mapped[str] = mapped_column(String(50), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=5)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class IncidentComment(Base):
    """Community discussions on civic incidents."""
    __tablename__ = "incident_comments"

    comment_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: f"COMM-{uuid.uuid4().hex[:8]}")
    incident_id: Mapped[str] = mapped_column(String(50), ForeignKey("civic_incidents.incident_id"), nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), default="Resident Citizen")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    incident: Mapped["CivicIncident"] = relationship("CivicIncident", back_populates="comments")

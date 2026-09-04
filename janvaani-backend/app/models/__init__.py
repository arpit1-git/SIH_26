"""
SQLAlchemy ORM Models — Phase 4 placeholder.

Full model definitions (Complaint, CivicIncident, AIAnalysis, NearbyFacility,
StatusHistory, Feedback, MunicipalBody, Department, Team) will be added in Phase 4
when PostgreSQL/PostGIS is fully wired.

This file currently only imports Base so Alembic can discover the models package.
"""

from app.db.database import Base  # noqa: F401 — imported for Alembic autogenerate

# ── Phase 4: Define models here ───────────────────────────────────────────────
# Example (to be expanded in Phase 4):
#
# class CivicIncident(Base):
#     __tablename__ = "civic_incidents"
#     incident_id = Column(UUID, primary_key=True, default=uuid4)
#     issue_type  = Column(String, nullable=False)
#     location    = Column(Geometry("POINT", srid=4326), nullable=False)
#     h3_index    = Column(String(15), index=True)
#     risk_score  = Column(Float, default=0.0)
#     ...

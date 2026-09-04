"""
Base declarative model class for SQLAlchemy ORM.
Phase 4 will extend this class for all DB entities.
"""

from datetime import datetime, timezone
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

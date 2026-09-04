"""
Database connection setup — SQLAlchemy async engine.

Phase 1: Engine is configured but DB is not actively used (in-memory store).
Phase 4: Full schema migrations, PostGIS, H3 extension, all models activated.

To initialize schema in Phase 4:
    from app.db.database import init_db
    await init_db()
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ── Async Engine ──────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,   # detect stale connections
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── ORM Base ──────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ── Dependency ────────────────────────────────────────────────────────────────
async def get_db():
    """
    FastAPI dependency: async DB session.
    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Init ──────────────────────────────────────────────────────────────────────
async def init_db():
    """
    Create all tables from ORM models.
    Phase 4: replace with Alembic migrations for production.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

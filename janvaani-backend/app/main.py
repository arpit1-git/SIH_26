"""
JANVAANI FastAPI Application Entry Point

Phase 1 — Foundation + Mock AI Layer
  - MockAIService active (AI_PROVIDER=mock in .env)
  - In-memory data store (Phase 4: PostgreSQL/PostGIS)
  - All civic API endpoints functional
  - Swagger UI at /docs

To run locally (without Docker):
    uvicorn app.main:app --reload --port 8000
"""

import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api import ai, complaints, incidents, map, admin, news, field, auth, system

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("janvaani")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="JANVAANI — Civic Intelligence Platform API",
    description="""
## JANVAANI API — Responsive Civic AI & Public Community Engine

AI-powered civic issue detection, prioritization, response, community social awareness, and resolution.

**Lifecycle:** Report → Detect → Segment → Cluster → Score → Assign → Route → Verify → Resolve
    """,
    version="2.0.0-phase10",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={"name": "JANVAANI Team", "url": "https://github.com/arpit1-git/SIH_26"},
)


# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Add X-Process-Time-Ms header to every response."""
    t0 = time.monotonic()
    response = await call_next(request)
    ms = round((time.monotonic() - t0) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(ms)
    return response


# ── Static Files ──────────────────────────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(ai.router)
app.include_router(complaints.router)
app.include_router(incidents.router)
app.include_router(map.router)
app.include_router(admin.router)
app.include_router(news.router)
app.include_router(field.router)
app.include_router(auth.router)
app.include_router(system.router)


# ── Root + Health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="API info")
async def root():
    return {
        "service":      "JANVAANI Civic Intelligence API",
        "version":      "2.0.0-phase10",
        "status":       "running",
        "phase":        "Phase 10 — System Hardening, JWT/RBAC Auth & Telemetry",
        "ai_provider":  settings.AI_PROVIDER,
        "docs":         "/docs",
        "redoc":        "/redoc",
        "endpoints": {
            "ai":         "/api/ai/*",
            "complaints": "/api/complaints",
            "incidents":  "/api/incidents",
            "map":        "/api/map/*",
            "admin":      "/api/admin/*",
            "auth":       "/api/auth/*",
            "system":     "/api/system/*",
        },
    }


@app.get("/health", tags=["Health"], summary="Health check")
async def health():
    return {
        "status":      "healthy",
        "ai_provider": settings.AI_PROVIDER,
        "env":         settings.APP_ENV,
        "debug":       settings.DEBUG,
    }


# ── Lifecycle Events ──────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("=" * 60)
    logger.info("  🚀 JANVAANI API — STARTING")
    logger.info(f"  Phase:       Phase 1 — Foundation + Mock AI Layer")
    logger.info(f"  AI Provider: {settings.AI_PROVIDER.upper()}")
    logger.info(f"  Environment: {settings.APP_ENV}")
    logger.info(f"  Docs:        http://localhost:8000/docs")
    if settings.AI_PROVIDER == "mock":
        logger.info("  🤖 MockAIService active — realistic fake AI data")
        logger.info("  💡 YOLO swap: set AI_PROVIDER=yolo in .env (Phase X)")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("JANVAANI API shutting down.")

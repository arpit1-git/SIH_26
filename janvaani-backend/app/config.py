from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── AI Provider ──────────────────────────────────────────────
    # "mock"  → MockAIService (realistic fake data)
    # "yolo"  → YOLOAIService (real YOLO26-Seg — deferred to Phase X)
    AI_PROVIDER: str = "mock"

    # YOLO model path (only needed when AI_PROVIDER=yolo)
    YOLO_MODEL_PATH: str = "/app/models/janvaani-yolo26-seg-v1/best.pt"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://janvaani:janvaanipass@db:5432/janvaani"
    DATABASE_URL_SYNC: str = "postgresql://janvaani:janvaanipass@db:5432/janvaani"

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"

    # ── Security ─────────────────────────────────────────────────
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Gemini ───────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # ── Upload ───────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "/app/uploads"

    # ── App ──────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

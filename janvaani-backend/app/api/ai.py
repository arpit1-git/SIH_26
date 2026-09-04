"""
AI API endpoints — /api/ai/*

All AI operations go through MockAIService (Phase 1).
When YOLO is ready, set AI_PROVIDER=yolo in .env — these routes never change.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import Response

from app.services.ai_service_factory import get_ai_service
from app.schemas.ai import (
    DetectionResult,
    TranscriptionResult,
    ScoreResult,
    VerificationResult,
    ScoreInput,
    SummarizeRequest,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_AUDIO_TYPES = {
    "audio/wav", "audio/mpeg", "audio/ogg", "audio/webm",
    "audio/mp4", "audio/x-m4a", "audio/aac",
}
MAX_BYTES = 50 * 1024 * 1024  # 50 MB


def _validate_image(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            400,
            f"Unsupported image type: {file.content_type}. "
            f"Allowed: {sorted(ALLOWED_IMAGE_TYPES)}",
        )


@router.post(
    "/detect",
    response_model=DetectionResult,
    summary="Detect civic issue in uploaded image",
)
async def detect(file: UploadFile = File(...)):
    """
    Run AI detection on an uploaded image.
    Returns detected classes, confidence, bounding boxes, and initial severity.

    **YOLO swap note:** Currently uses MockAIService.
    When YOLO26-Seg is trained, set `AI_PROVIDER=yolo` in `.env` — this route stays unchanged.
    """
    _validate_image(file)
    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(413, "Image too large. Maximum size is 50 MB.")

    ai = get_ai_service()
    return await ai.detect_and_segment(image_bytes, filename=file.filename or "")


@router.post(
    "/segment",
    response_model=DetectionResult,
    summary="Detect + segment civic issue (returns mask URL)",
)
async def segment(file: UploadFile = File(...)):
    """
    Run AI detection + instance segmentation.
    Returns all fields from `/detect` plus a `segmentation_mask_url` pointing to the PNG overlay.

    **YOLO swap note:** Mock returns a Pillow-generated polygon URL.
    YOLO26-Seg will return a real pixel-level mask stored to disk.
    """
    _validate_image(file)
    image_bytes = await file.read()
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(413, "Image too large.")

    ai = get_ai_service()
    return await ai.detect_and_segment(image_bytes, filename=file.filename or "")


@router.post(
    "/transcribe",
    response_model=TranscriptionResult,
    summary="Transcribe voice complaint audio",
)
async def transcribe(file: UploadFile = File(...)):
    """
    Transcribe audio voice complaint. Extracts issue type and landmark mentions.
    Uses Whisper (mock in Phase 1).
    """
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            400, f"Unsupported audio type: {file.content_type}. Allowed: {sorted(ALLOWED_AUDIO_TYPES)}"
        )
    audio_bytes = await file.read()
    ai = get_ai_service()
    return await ai.transcribe(audio_bytes)


@router.post("/summarize", summary="Generate AI civic incident summary")
async def summarize(request: SummarizeRequest):
    """
    Generate a plain-language AI summary for a civic incident.
    Uses Gemini 2.5 Flash-Lite (mock in Phase 1).
    Always labelled as AI-generated in the UI.
    """
    ai = get_ai_service()
    summary_text = await ai.summarize(request.model_dump())
    return {
        "summary": summary_text,
        "ai_generated": True,
        "model": "mock-gemini" if "mock" in type(ai).__name__.lower() else "gemini-2.5-flash-lite",
    }


@router.post(
    "/score",
    response_model=ScoreResult,
    summary="Calculate Civic Priority Score (0–100)",
)
async def score(input_data: ScoreInput):
    """
    Calculate Civic Priority Score using XGBoost (heuristic mock in Phase 1).
    Returns `risk_score`, `civic_impact_score`, `level`, and `explanation_bullets`.

    Thresholds: Low (0–30) · Medium (31–55) · High (56–80) · Critical (81–100)
    """
    ai = get_ai_service()
    return await ai.score(input_data.model_dump())


@router.post(
    "/verify-resolution",
    response_model=VerificationResult,
    summary="Verify resolution with before/after computer vision",
)
async def verify_resolution(
    before: UploadFile = File(..., description="Before-cleanup image"),
    after: UploadFile = File(..., description="After-cleanup image"),
):
    """
    Compare before/after images to verify issue resolution.
    Returns area reduction % and outcome: ✅ Fully Resolved / ⚠️ Partial / ❌ Not Verified / 🟡 Review.
    Runs Structural Similarity (SSIM), color histogram comparison, and contour area reduction analysis.
    """
    _validate_image(before)
    _validate_image(after)
    before_bytes = await before.read()
    after_bytes  = await after.read()

    from app.services.verification_service import analyze_before_after_cv
    return analyze_before_after_cv(before_bytes, after_bytes)


@router.get(
    "/mock-mask",
    summary="Get mock segmentation mask PNG overlay",
    response_class=Response,
)
async def get_mock_mask(
    type: str  = Query(default="waterlogging", description="Civic issue type"),
    seed: int  = Query(default=42, description="Seed for deterministic output"),
):
    """
    Generate and return a colored semi-transparent PNG mask overlay.
    Used by MockAIService to simulate YOLO26-Seg segmentation output.

    Returns a PNG image. Use `<img src="/api/ai/mock-mask?type=waterlogging&seed=42">` in the frontend.
    """
    ai = get_ai_service()
    png_bytes = await ai.generate_mock_mask(issue_type=type, seed=seed)
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},  # cache 24h (same seed = same image)
    )

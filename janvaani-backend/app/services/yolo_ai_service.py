"""
YOLOAIService — YOLO26-Seg real AI implementation.

⚠️  NOT YET IMPLEMENTED — YOLO model training is deferred to Phase X.

When janvaani-yolo26-seg-v1/best.pt is trained and ready:
─────────────────────────────────────────────────────────
1. Implement detect_and_segment()  → real YOLO26-Seg inference
2. Implement verify_resolution()   → pixel-level before/after comparison
3. Implement transcribe()          → real Whisper ASR
4. Implement summarize()           → real Gemini 2.5 Flash-Lite
5. Implement score()               → real XGBoost model
6. Set AI_PROVIDER=yolo in .env
7. ALL endpoints, schemas, and frontend work with zero changes. ✅

Reference implementation: app/services/mock_ai_service.py
Interface contract:       app/services/ai_service.py
"""

from .ai_service import AIService
from app.schemas.ai import (
    DetectionResult, TranscriptionResult, ScoreResult, VerificationResult
)


class YOLOAIService(AIService):

    def __init__(self):
        raise NotImplementedError(
            "\n"
            "════════════════════════════════════════════════════════\n"
            "  YOLOAIService is not yet implemented.\n"
            "  YOLO26-Seg training is deferred to Phase X.\n"
            "\n"
            "  To use the working mock implementation:\n"
            "    Set AI_PROVIDER=mock in .env\n"
            "════════════════════════════════════════════════════════\n"
        )

    async def detect_and_segment(self, image_bytes: bytes, filename: str = "") -> DetectionResult:
        # TODO Phase X: Load best.pt, run YOLO26-Seg inference, build DetectionResult
        raise NotImplementedError("YOLO detect_and_segment pending.")

    async def transcribe(self, audio_bytes: bytes) -> TranscriptionResult:
        # TODO Phase X: Run Whisper inference on audio_bytes
        raise NotImplementedError("Whisper transcription pending.")

    async def summarize(self, context: dict) -> str:
        # TODO Phase X: Call Gemini 2.5 Flash-Lite with context
        raise NotImplementedError("Gemini summarize pending.")

    async def score(self, incident_data: dict) -> ScoreResult:
        # TODO Phase 5: Load XGBoost model, compute score from incident_data features
        raise NotImplementedError("XGBoost scoring pending.")

    async def verify_resolution(self, before_bytes: bytes, after_bytes: bytes) -> VerificationResult:
        # TODO Phase X: Run YOLO26-Seg on both images, compare segmentation areas
        raise NotImplementedError("CV resolution verification pending.")

    async def generate_mock_mask(self, issue_type: str, seed: int) -> bytes:
        # TODO Phase X: Return real YOLO26-Seg mask as PNG
        raise NotImplementedError("YOLO mask generation pending.")

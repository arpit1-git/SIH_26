"""
AIService — Abstract Base Class

This is the contract that both MockAIService and YOLOAIService implement.

HOW THE SWAP WORKS
==================
Phase 1 (now):   AI_PROVIDER=mock  → MockAIService returns realistic fake data
Phase X (later): AI_PROVIDER=yolo  → YOLOAIService runs real YOLO26-Seg inference

The swap is ONE line in .env. No endpoint, schema, or frontend code changes.

All downstream code (API routes, scoring engine, frontend) talks only to
this interface — never directly to MockAIService or YOLOAIService.
"""

from abc import ABC, abstractmethod

from app.schemas.ai import (
    DetectionResult,
    TranscriptionResult,
    ScoreResult,
    VerificationResult,
)


class AIService(ABC):

    @abstractmethod
    async def detect_and_segment(
        self, image_bytes: bytes, filename: str = ""
    ) -> DetectionResult:
        """
        Run object detection + instance segmentation on an image.

        Returns structured DetectionResult with:
          - issue_type, confidence, severity_initial
          - detections list (label, bbox, affected_area_estimate)
          - segmentation_mask_url (PNG overlay)
          - evidence_score, evidence_level

        YOLO swap note:
          Mock → randomized realistic values, pre-generated PNG mask URL
          YOLO → real YOLO26-Seg inference, actual pixel mask stored to disk
        """
        ...

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes) -> TranscriptionResult:
        """
        Transcribe voice complaint audio.
        Extract issue type and landmark mentions from the transcription.

        YOLO swap note: Whisper is independent of YOLO.
        Mock → sample transcripts. Real → Whisper inference.
        """
        ...

    @abstractmethod
    async def summarize(self, context: dict) -> str:
        """
        Generate a plain-language AI summary for a civic incident.
        Uses Gemini 2.5 Flash-Lite grounded in stored evidence data.
        Always labelled "AI-generated" in the UI.
        """
        ...

    @abstractmethod
    async def score(self, incident_data: dict) -> ScoreResult:
        """
        Calculate Civic Priority Score (0–100) using XGBoost.
        Returns risk_score, civic_impact_score, level, explanation_bullets.

        Phase 1: heuristic mock scoring.
        Phase 5: real XGBoost model trained on civic signals.
        """
        ...

    @abstractmethod
    async def verify_resolution(
        self, before_bytes: bytes, after_bytes: bytes
    ) -> VerificationResult:
        """
        Compare before/after images to verify issue resolution.
        Returns area reduction % and outcome label.

        YOLO swap note:
          Mock → random realistic reduction %, plausible before/after areas
          YOLO → real segmentation on both images, actual pixel area comparison
        """
        ...

    @abstractmethod
    async def generate_mock_mask(self, issue_type: str, seed: int) -> bytes:
        """
        Generate a visual segmentation mask overlay (PNG bytes).

        Mock → colored semi-transparent polygon generated with Pillow
        YOLO → actual YOLO26-Seg mask rendered as PNG

        Used by GET /api/ai/mock-mask endpoint.
        """
        ...

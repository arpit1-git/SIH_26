"""
AIServiceFactory — singleton factory for the active AI service.

Usage in FastAPI endpoints:
    ai = get_ai_service()
    result = await ai.detect_and_segment(image_bytes)

Toggle via .env:
    AI_PROVIDER=mock   →  MockAIService  (Phase 1, default)
    AI_PROVIDER=yolo   →  YOLOAIService  (Phase X, after training)
"""

from app.config import settings
from .ai_service import AIService

_instance: AIService | None = None


def get_ai_service() -> AIService:
    """
    Return the singleton AI service instance.
    Created once on first call, reused for all subsequent requests.

    To reset (e.g., in tests):
        import app.services.ai_service_factory as factory
        factory._instance = None
    """
    global _instance

    if _instance is None:
        provider = settings.AI_PROVIDER.lower().strip()

        if provider == "mock":
            from .mock_ai_service import MockAIService
            _instance = MockAIService()

        elif provider == "yolo":
            from .yolo_ai_service import YOLOAIService
            _instance = YOLOAIService()  # raises NotImplementedError until Phase X

        else:
            raise ValueError(
                f"Unknown AI_PROVIDER: '{provider}'. "
                f"Valid values: 'mock' | 'yolo'"
            )

    return _instance

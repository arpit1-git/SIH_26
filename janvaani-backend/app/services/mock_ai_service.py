"""
MockAIService — Phase 1 AI implementation.

Returns realistic, randomized civic AI results that match the exact schema
the real YOLO26-Seg service will produce. Every field, every type, every range
is calibrated to feel real so the full frontend and scoring engine can be
built and tested without a trained model.

Realism features:
  - 15% chance of LOW confidence (tests the warning UI path)
  - Issue type inferred from filename hints
  - Affected area: 8–95 m² range
  - Evidence score consistent with confidence
  - Mock mask: Pillow-generated colored polygon PNG (issue-type colored)
  - Voice transcripts: realistic civic complaint sentences
  - Score: simple heuristic that approximates XGBoost output

YOLO swap: Set AI_PROVIDER=yolo in .env → YOLOAIService takes over.
           This file is never touched again after that.
"""

import asyncio
import io
import math
import random
import time
from typing import Optional

import numpy as np
from PIL import Image, ImageDraw

from app.schemas.ai import (
    Detection,
    DetectionResult,
    EvidenceConfidenceLevel,
    IssueType,
    RiskLevel,
    ScoreResult,
    SeverityLevel,
    TranscriptionResult,
    VerificationResult,
)
from .ai_service import AIService


# ── Issue → mask color mapping ────────────────────────────────────────────────
ISSUE_COLORS: dict[str, tuple[int, int, int, int]] = {
    "plastic_waste":    (255, 180,  50, 155),  # amber
    "organic_waste":    (100, 190,  70, 155),  # green
    "mixed_waste":      (200, 110,  50, 155),  # burnt orange
    "illegal_dumping":  (190,  50,  50, 155),  # red
    "overflowing_bin":  (220, 140,  40, 155),  # orange
    "waterlogging":     ( 50, 130, 230, 155),  # blue
    "flooded_road":     ( 30,  70, 180, 155),  # deep blue
    "standing_water":   ( 80, 170, 230, 155),  # sky blue
    "blocked_drainage": (110,  60, 150, 155),  # purple
}

WASTE_TYPES = [
    IssueType.PLASTIC_WASTE,
    IssueType.ORGANIC_WASTE,
    IssueType.MIXED_WASTE,
    IssueType.ILLEGAL_DUMPING,
    IssueType.OVERFLOWING_BIN,
]

WATER_TYPES = [
    IssueType.WATERLOGGING,
    IssueType.FLOODED_ROAD,
    IssueType.STANDING_WATER,
    IssueType.BLOCKED_DRAINAGE,
]

ALL_TYPES = WASTE_TYPES + WATER_TYPES

# ── Realistic voice complaint samples ─────────────────────────────────────────
VOICE_SAMPLES = [
    {
        "transcript": "There is a lot of water accumulated on the road near the hospital. Vehicles are unable to pass.",
        "language": "en",
        "extracted_issue_type": IssueType.WATERLOGGING,
        "extracted_landmark": "hospital",
    },
    {
        "transcript": "The garbage bin near the bus stop is completely overflowing. Waste is scattered all around.",
        "language": "en",
        "extracted_issue_type": IssueType.OVERFLOWING_BIN,
        "extracted_landmark": "bus stop",
    },
    {
        "transcript": "Someone has illegally dumped a large amount of waste behind the market. It is blocking the lane.",
        "language": "en",
        "extracted_issue_type": IssueType.ILLEGAL_DUMPING,
        "extracted_landmark": "market",
    },
    {
        "transcript": "The road is completely flooded. I can see water up to half a foot. My children cannot go to school.",
        "language": "en",
        "extracted_issue_type": IssueType.FLOODED_ROAD,
        "extracted_landmark": "school",
    },
    {
        "transcript": "The drain near the railway station is blocked. Water is standing on the footpath.",
        "language": "en",
        "extracted_issue_type": IssueType.BLOCKED_DRAINAGE,
        "extracted_landmark": "railway station",
    },
    {
        "transcript": "Mixed plastic and organic waste is lying on the street. No one has collected it for three days.",
        "language": "en",
        "extracted_issue_type": IssueType.MIXED_WASTE,
        "extracted_landmark": None,
    },
]

# ── AI recommendation templates ───────────────────────────────────────────────
RECOMMENDATIONS = {
    "waterlogging": [
        "1. Inspect nearby drainage infrastructure for blockages.",
        "2. Deploy water pumps if water depth exceeds 15 cm.",
        "3. Place traffic warning barriers on affected road sections.",
        "4. Alert nearby schools and hospitals via municipal notification.",
        "5. Re-inspect after 2 hours to confirm water subsidence.",
    ],
    "flooded_road": [
        "1. Close affected road section immediately and redirect traffic.",
        "2. Deploy emergency water pumping teams.",
        "3. Inspect drainage outfalls downstream for blockage.",
        "4. Coordinate with traffic police for alternate route diversion.",
        "5. Capture after-action evidence photo before reopening.",
    ],
    "blocked_drainage": [
        "1. Dispatch drainage maintenance crew to inspect drain.",
        "2. Clear solid waste and debris causing the blockage.",
        "3. Use jetting equipment for partial blockages.",
        "4. Monitor water level post-clearing.",
        "5. Submit after-work evidence to close the incident.",
    ],
    "default_waste": [
        "1. Dispatch sanitation team to the reported location.",
        "2. Remove accumulated waste and transport to designated facility.",
        "3. Inspect nearby collection bins for overflow condition.",
        "4. Review waste collection frequency for this area.",
        "5. Capture after-cleanup photo as resolution evidence.",
    ],
}


class MockAIService(AIService):
    """
    Mock AI Service — realistic fake civic AI results.
    All outputs match the exact schema of YOLOAIService.

    Phase 1 implementation. YOLO swap: change AI_PROVIDER=yolo in .env.
    """

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _severity(confidence: float, area: float) -> SeverityLevel:
        score = confidence * 0.55 + min(area, 100) / 100 * 0.45
        if score >= 0.73:   return SeverityLevel.CRITICAL
        elif score >= 0.52: return SeverityLevel.HIGH
        elif score >= 0.33: return SeverityLevel.MEDIUM
        return SeverityLevel.LOW

    @staticmethod
    def _evidence_level(score: float) -> EvidenceConfidenceLevel:
        if score >= 0.75: return EvidenceConfidenceLevel.HIGH
        elif score >= 0.50: return EvidenceConfidenceLevel.NEEDS_REVIEW
        return EvidenceConfidenceLevel.INSUFFICIENT

    @staticmethod
    def _risk_level(score: float) -> RiskLevel:
        if score >= 81: return RiskLevel.CRITICAL
        elif score >= 56: return RiskLevel.HIGH
        elif score >= 31: return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def _infer_type(filename: str) -> Optional[IssueType]:
        fn = filename.lower()
        if any(k in fn for k in ["water", "flood", "drain", "log"]):
            return random.choice(WATER_TYPES)
        if any(k in fn for k in ["waste", "dump", "bin", "garbage", "trash"]):
            return random.choice(WASTE_TYPES)
        return None

    # ── AIService implementation ──────────────────────────────────────────────

    async def detect_and_segment(
        self, image_bytes: bytes, filename: str = ""
    ) -> DetectionResult:
        # Simulate GPU inference latency
        await asyncio.sleep(random.uniform(0.25, 0.75))
        start = time.monotonic()

        issue_type = self._infer_type(filename) or random.choice(ALL_TYPES)

        # 15% chance of low-confidence result (exercises warning UI)
        low_confidence = random.random() < 0.15
        if low_confidence:
            confidence    = round(random.uniform(0.51, 0.67), 3)
            evidence_score = round(random.uniform(0.33, 0.54), 3)
        else:
            confidence    = round(random.uniform(0.74, 0.97), 3)
            evidence_score = round(random.uniform(0.68, 0.95), 3)

        area = round(random.uniform(8.5, 92.0), 1)
        severity = self._severity(confidence, area)
        evidence_level = self._evidence_level(evidence_score)

        # Generate plausible bbox for a 640×480 frame
        x1 = random.randint(50, 180)
        y1 = random.randint(40, 140)
        x2 = random.randint(380, 590)
        y2 = random.randint(260, 430)

        seed = abs(hash(filename)) % 10000 if filename else random.randint(1, 9999)
        elapsed_ms = int((time.monotonic() - start) * 1000) + random.randint(120, 480)

        return DetectionResult(
            issue_type=issue_type,
            confidence=confidence,
            severity_initial=severity,
            detections=[
                Detection(
                    label=issue_type.value,
                    confidence=confidence,
                    bbox=[x1, y1, x2, y2],
                    affected_area_estimate=area,
                )
            ],
            segmentation_mask_url=(
                f"/api/ai/mock-mask?type={issue_type.value}&seed={seed}"
            ),
            evidence_score=evidence_score,
            evidence_level=evidence_level,
            processing_time_ms=elapsed_ms,
            model_name="mock-ai-service",
            model_version="phase1-dev",
        )

    async def transcribe(self, audio_bytes: bytes) -> TranscriptionResult:
        await asyncio.sleep(random.uniform(0.5, 1.2))
        sample = random.choice(VOICE_SAMPLES)
        return TranscriptionResult(
            transcript=sample["transcript"],
            language=sample["language"],
            confidence=round(random.uniform(0.81, 0.97), 3),
            extracted_issue_type=sample["extracted_issue_type"],
            extracted_landmark=sample["extracted_landmark"],
            processing_time_ms=random.randint(400, 1200),
        )

    async def summarize(self, context: dict) -> str:
        await asyncio.sleep(random.uniform(0.15, 0.45))
        issue = context.get("issue_type", "civic issue").replace("_", " ")
        count = context.get("complaint_count", 1)
        area  = context.get("affected_area_m2")
        loc   = context.get("location_description", "the reported location")
        velocity = context.get("complaint_velocity", 0)

        parts = [
            f"JANVAANI detected {issue} at {loc}.",
            f"{count} citizen report{'s' if count > 1 else ''} have been recorded.",
        ]
        if area:
            parts.append(f"Estimated affected area: {area:.1f} m².")
        if velocity > 1:
            parts.append(
                f"Complaint rate is rising ({velocity:.1f} reports/hour) — situation may be worsening."
            )
        parts.append(
            "Municipal attention is recommended based on current AI evidence and community reports."
        )
        return " ".join(parts)

    async def score(self, incident_data: dict) -> ScoreResult:
        await asyncio.sleep(0.05)

        complaint_count  = incident_data.get("complaint_count", 1)
        support_count    = incident_data.get("support_count", 0)
        velocity         = incident_data.get("complaint_velocity", 0.0)
        severity_numeric = incident_data.get("severity_numeric", 1.0)
        confidence       = incident_data.get("detection_confidence", 0.80)
        area             = incident_data.get("affected_area_m2", 20.0)
        hours_unresolved = incident_data.get("hours_unresolved", 0.0)
        school_dist      = incident_data.get("nearby_school_dist_m")
        hospital_dist    = incident_data.get("nearby_hospital_dist_m")
        recurrence       = incident_data.get("recurrence_count", 0)
        road_importance  = incident_data.get("road_importance", 0.5)

        # Heuristic scoring (Phase 5 replaces with real XGBoost)
        score = 15.0
        score += min(complaint_count * 2.5, 20.0)
        score += min(support_count * 1.5, 10.0)
        score += min(velocity * 4.5, 14.0)
        score += severity_numeric * 8.0
        score += confidence * 5.0
        score += min(area / 12.0, 7.0)
        score += min(hours_unresolved * 2.0, 10.0)
        score += recurrence * 2.5
        score += road_importance * 5.0

        bullets: list[str] = []
        if complaint_count >= 5:
            bullets.append(f"{complaint_count} citizen reports recorded.")
        if velocity >= 2:
            bullets.append(f"Complaint rate rising rapidly ({velocity:.1f} reports/hour).")
        if school_dist is not None and school_dist < 500:
            score += 8.0
            bullets.append(f"School within {int(school_dist)} m.")
        if hospital_dist is not None and hospital_dist < 500:
            score += 6.0
            bullets.append(f"Hospital within {int(hospital_dist)} m.")
        if hours_unresolved > 2:
            bullets.append(f"Unresolved for {hours_unresolved:.1f} hours.")
        if recurrence >= 3:
            bullets.append(f"Recurring location — {recurrence} similar incidents in 90 days.")
        if road_importance >= 0.8:
            bullets.append("Major arterial road affected.")
        if not bullets:
            bullets.append("Initial assessment based on available evidence.")

        risk_score        = min(round(score, 1), 100.0)
        civic_impact      = min(round(score * random.uniform(0.88, 1.12), 1), 100.0)
        level             = self._risk_level(risk_score)

        return ScoreResult(
            risk_score=risk_score,
            civic_impact_score=civic_impact,
            level=level,
            explanation_bullets=bullets,
        )

    async def verify_resolution(
        self, before_bytes: bytes, after_bytes: bytes
    ) -> VerificationResult:
        await asyncio.sleep(random.uniform(0.35, 0.85))

        before_area = round(random.uniform(20.0, 80.0), 1)
        roll = random.random()
        if roll < 0.65:      # 65% fully resolved
            after_area = round(before_area * random.uniform(0.02, 0.11), 1)
        elif roll < 0.82:    # 17% partial
            after_area = round(before_area * random.uniform(0.18, 0.44), 1)
        else:                # 18% not verified
            after_area = round(before_area * random.uniform(0.60, 0.88), 1)

        reduction_pct = round((before_area - after_area) / before_area * 100, 1)
        confidence    = round(random.uniform(0.71, 0.96), 3)

        if reduction_pct >= 85:
            outcome, label, emoji = "fully_resolved", "Fully Resolved", "✅"
        elif reduction_pct >= 40:
            outcome, label, emoji = "partially_resolved", "Partially Resolved", "⚠️"
        elif confidence < 0.60:
            outcome, label, emoji = "needs_review", "Needs Human Review", "🟡"
        else:
            outcome, label, emoji = "not_verified", "Not Verified", "❌"

        return VerificationResult(
            area_before_m2=before_area,
            area_after_m2=after_area,
            reduction_pct=reduction_pct,
            outcome=outcome,
            outcome_label=label,
            outcome_emoji=emoji,
            confidence=confidence,
        )

    async def generate_mock_mask(self, issue_type: str, seed: int) -> bytes:
        """Generate a colored semi-transparent polygon overlay as PNG bytes."""
        random.seed(seed)
        np.random.seed(seed % (2**31))

        W, H = 640, 480
        img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        color = ISSUE_COLORS.get(issue_type, (100, 120, 200, 150))

        # Draw 1–3 irregular convex-ish polygons
        num_shapes = random.randint(1, 3)
        for _ in range(num_shapes):
            cx = random.randint(100, W - 100)
            cy = random.randint(80, H - 80)
            n  = random.randint(6, 10)
            pts = []
            for i in range(n):
                angle = (2 * math.pi * i / n) + random.uniform(-0.3, 0.3)
                r     = random.randint(35, 130)
                px    = int(cx + r * math.cos(angle))
                py    = int(cy + r * math.sin(angle))
                pts.append((max(0, min(W - 1, px)), max(0, min(H - 1, py))))

            draw.polygon(pts, fill=color)
            outline = (*color[:3], 230)
            draw.polygon(pts, outline=outline)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

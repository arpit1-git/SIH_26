"""
Priority Scoring Engine for JANVAANI.
Simulates multi-factor XGBoost civic prioritization scoring (0–100)
using structured civic signals and proximity exposure.
"""

from typing import Dict, Any, Tuple, List
import math


def get_evidence_confidence_label(evidence_score: float, complaint_count: int) -> Dict[str, Any]:
    """
    Computes evidence reliability according to PRD Section 21:
    - High Confidence (Green): High model score / multiple consistent reports
    - Needs Review (Yellow): Moderate score
    - Insufficient Evidence (Red): Low model score & single report
    """
    if evidence_score >= 0.85 or (complaint_count >= 3 and evidence_score >= 0.70):
        return {
            "label": "High Confidence",
            "tier": "high",
            "color": "emerald",
            "description": "Strong computer vision evidence cross-validated by civic location patterns.",
        }
    elif evidence_score >= 0.65 or complaint_count >= 2:
        return {
            "label": "Needs Review",
            "tier": "medium",
            "color": "amber",
            "description": "Moderate confidence detection — flagged for fast-track operator confirmation.",
        }
    else:
        return {
            "label": "Insufficient Evidence",
            "tier": "low",
            "color": "rose",
            "description": "Low confidence imagery — operator triage recommended before dispatch.",
        }


def calculate_civic_risk_score(data: Dict[str, Any]) -> Tuple[float, float, str, List[str]]:
    """
    Computes (risk_score, civic_impact_score, severity_level, explanation_factors).
    Scores range from 0.0 to 100.0 based on PRD Sections 15, 16, 18, 19, 20.
    """
    # 1. Base Severity Weight (0 - 35 pts)
    sev = str(data.get("severity", "medium")).lower()
    sev_points = {
        "critical": 35.0,
        "high": 25.0,
        "medium": 15.0,
        "low": 8.0,
    }.get(sev, 15.0)

    # 2. Confidence Calibration (multiplier 0.8 - 1.0)
    conf = float(data.get("confidence", 0.85))
    base_score = sev_points * (0.8 + 0.2 * conf)

    # 3. Citizen Volume & Support Signals (0 - 20 pts)
    complaints = int(data.get("complaint_count", 1))
    supports = int(data.get("support_count", 0))
    volume_factor = min(15.0, math.log1p(complaints) * 4.5) + min(5.0, math.log1p(supports) * 1.5)

    # 4. Complaint Velocity Spike (0 - 15 pts) - PRD Section 18
    velocity = float(data.get("complaint_velocity", 1.0))
    velocity_factor = min(15.0, velocity * 3.5)

    # 5. Affected Surface Footprint Area (0 - 10 pts)
    area = float(data.get("affected_area_estimate", 20.0))
    area_factor = min(10.0, math.log1p(area) * 2.2)

    # 6. Critical Facility Exposure (0 - 15 pts) - PRD Section 19
    # Hospital proximity (< 500m)
    hosp_dist = float(data.get("hospital_distance_m", 600.0))
    hosp_factor = max(0.0, (500.0 - min(500.0, hosp_dist)) / 500.0 * 8.0)

    # School proximity (< 400m)
    school_dist = float(data.get("school_distance_m", 600.0))
    school_factor = max(0.0, (400.0 - min(400.0, school_dist)) / 400.0 * 5.0)

    # Transit Highway / Arterial Road factor
    is_arterial = bool(data.get("is_arterial_road", True))
    transit_factor = 2.0 if is_arterial else 0.0

    facility_factor = hosp_factor + school_factor + transit_factor

    # 7. Chronic Recurrence / Blackspot (0 - 10 pts) - PRD Section 22
    recurrence = int(data.get("recurrence_count", 0))
    recurrence_factor = min(10.0, recurrence * 2.5)

    # 8. Unresolved Duration Escalation (0 - 10 pts)
    hours = float(data.get("hours_unresolved", 2.0))
    time_factor = min(10.0, math.log1p(hours) * 2.8)

    # Aggregate Total Risk Score
    raw_risk = (
        base_score
        + volume_factor
        + velocity_factor
        + area_factor
        + facility_factor
        + recurrence_factor
        + time_factor
    )

    risk_score = round(min(100.0, max(5.0, raw_risk)), 1)
    
    # Civic Impact Score (PRD Section 20) - weighs public exposure, population impact, and facilities
    civic_impact_raw = (
        (volume_factor * 2.2)
        + (facility_factor * 2.5)
        + (area_factor * 2.0)
        + (base_score * 0.6)
        + (velocity_factor * 1.2)
    )
    civic_impact_score = round(min(100.0, max(10.0, civic_impact_raw)), 1)

    # Determine Priority Level (PRD Section 16)
    if risk_score >= 81.0:
        level = "critical"
    elif risk_score >= 56.0:
        level = "high"
    elif risk_score >= 31.0:
        level = "medium"
    else:
        level = "low"

    # Generate Structured Explanation Factors (PRD Section 17)
    factors = []
    if complaints > 3 or supports > 10:
        factors.append(f"High public density: {complaints} citizen reports and {supports} verified community upvotes")
    if velocity >= 1.8:
        factors.append(f"Rapid complaint velocity spike (+{round(velocity * 100)}% surge rate in recent reports)")
    if hosp_dist <= 400.0:
        factors.append(f"Emergency hazard: Major Trauma Hospital within {int(hosp_dist)}m perimeter")
    if school_dist <= 300.0:
        factors.append(f"Pedestrian vulnerability: Public Model School within {int(school_dist)}m")
    if is_arterial:
        factors.append("Arterial transit road obstruction impacting city transit corridor")
    if recurrence >= 3:
        factors.append(f"Chronic Blackspot: {recurrence} repeat incidents recorded at this location in 90 days")
    if area >= 30.0:
        factors.append(f"Large surface footprint estimated at {area} m² by computer vision")
    if hours >= 4.0:
        factors.append(f"Unresolved for {int(hours)} hours exceeding standard SLA window")

    if not factors:
        factors.append("Standard priority municipal issue under routine monitoring.")

    return risk_score, civic_impact_score, level, factors

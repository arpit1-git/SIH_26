"""
Database Seed Script for JANVAANI.
Populates 50+ realistic civic incidents across 10 issue themes with realistic coordinates,
severity levels, priority scores, nearby facilities, and mock masks.
"""

import random
from datetime import datetime, timezone, timedelta

# 10 issue types mapped to themes
ISSUE_THEMES = [
    {"type": "mixed_waste", "cat": "waste", "img": "/ui_themes/waste1.jpg", "sev": "high", "area": 35.0},
    {"type": "illegal_dumping", "cat": "waste", "img": "/ui_themes/waste2.jpg", "sev": "critical", "area": 85.0},
    {"type": "overflowing_bin", "cat": "waste", "img": "/ui_themes/waste3.jpg", "sev": "medium", "area": 12.0},
    {"type": "commercial_waste", "cat": "waste", "img": "/ui_themes/waste4.jpg", "sev": "high", "area": 48.0},
    {"type": "waste_hotspot", "cat": "waste", "img": "/ui_themes/waste5.jpg", "sev": "critical", "area": 110.0},
    {"type": "waterlogging", "cat": "waterlogging", "img": "/ui_themes/water1.jpg", "sev": "critical", "area": 65.0},
    {"type": "flooded_road", "cat": "waterlogging", "img": "/ui_themes/water2.png", "sev": "critical", "area": 95.0},
    {"type": "blocked_drain", "cat": "waterlogging", "img": "/ui_themes/water3.png", "sev": "high", "area": 28.0},
    {"type": "standing_water", "cat": "waterlogging", "img": "/ui_themes/water4.png", "sev": "medium", "area": 40.0},
    {"type": "waterlogging_hotspot", "cat": "waterlogging", "img": "/ui_themes/water5.png", "sev": "critical", "area": 140.0},
]

LOCATIONS = [
    {"name": "MG Road Arterial Underpass, Ward 12", "lat": 28.6139, "lng": 77.2090, "ward": 12},
    {"name": "Central Market Commercial Gate 4, Sector 7", "lat": 28.6210, "lng": 77.2150, "ward": 7},
    {"name": "Bus Terminal Flyover Corridor, Ward 4", "lat": 28.6080, "lng": 77.2010, "ward": 4},
    {"name": "City General Hospital Access Road, Ward 9", "lat": 28.6185, "lng": 77.2240, "ward": 9},
    {"name": "Public School Complex Sector 15, Ward 3", "lat": 28.6300, "lng": 77.1950, "ward": 3},
    {"name": "Railway Colony Main Drain Junction, Ward 11", "lat": 28.6050, "lng": 77.2180, "ward": 11},
    {"name": "Industrial Area Phase 2 Dumping Ground", "lat": 28.5980, "lng": 77.2300, "ward": 14},
    {"name": "Subzi Mandi Wholesale Complex, Ward 6", "lat": 28.6270, "lng": 77.2080, "ward": 6},
    {"name": "Metro Station Gate 2 Pedestrian Subway", "lat": 28.6155, "lng": 77.2120, "ward": 8},
    {"name": "Civic Center Ring Road Underpass, Ward 5", "lat": 28.6110, "lng": 77.2280, "ward": 5},
]


def generate_mock_incidents(count: int = 50) -> list:
    """Generate 50+ realistic civic incidents."""
    incidents = []
    now = datetime.now(timezone.utc)

    for i in range(count):
        theme = ISSUE_THEMES[i % len(ISSUE_THEMES)]
        loc = LOCATIONS[i % len(LOCATIONS)]
        
        # Add slight jitter to coordinates for realistic spread
        lat_jitter = loc["lat"] + random.uniform(-0.015, 0.015)
        lng_jitter = loc["lng"] + random.uniform(-0.015, 0.015)
        
        is_critical = theme["sev"] == "critical" or (i % 5 == 0)
        severity = "critical" if is_critical else theme["sev"]
        risk_score = random.randint(82, 98) if is_critical else (random.randint(58, 80) if severity == "high" else random.randint(25, 55))
        
        incident_id = f"JV-{1000 + i}"
        complaints_count = random.randint(5, 25) if is_critical else random.randint(1, 8)
        supports_count = random.randint(15, 80) if is_critical else random.randint(3, 20)
        recurrence = random.randint(3, 8) if (i % 4 == 0) else random.randint(0, 2)
        is_hotspot = recurrence >= 3

        hours_ago = random.randint(1, 48)
        created_at = now - timedelta(hours=hours_ago)
        
        status = "resolved" if (i % 6 == 0 and not is_critical) else ("in_progress" if (i % 3 == 0) else "open")

        incidents.append({
            "incident_id": incident_id,
            "issue_type": theme["type"],
            "category": theme["cat"],
            "severity": severity,
            "risk_score": float(risk_score),
            "civic_impact_score": float(min(100, risk_score + random.randint(-5, 8))),
            "evidence_score": round(random.uniform(0.72, 0.96), 2),
            "h3_index": f"8860145b{i:02x}ffff",
            "latitude": round(lat_jitter, 6),
            "longitude": round(lng_jitter, 6),
            "location_name": f"{loc['name']} (Sector {i%18 + 1})",
            "ward_number": loc["ward"],
            "complaint_count": complaints_count,
            "support_count": supports_count,
            "complaint_velocity": round(random.uniform(0.5, 4.5), 1),
            "recurrence_count": recurrence,
            "is_hotspot": is_hotspot,
            "assigned_authority": "Municipal Corporation Central Zone",
            "assigned_department": "Sanitation & Solid Waste" if theme["cat"] == "waste" else "Stormwater Drainage & Flood Control",
            "assigned_team": f"Rapid Action Team #{i%5 + 1}",
            "status": status,
            "sla_deadline": (created_at + timedelta(hours=12)).isoformat(),
            "escalation_level": 1 if is_critical and hours_ago > 6 else 0,
            "image_url": theme["img"],
            "segmentation_mask_url": f"/api/ai/mock-mask?type={theme['type']}&seed={i}",
            "affected_area_estimate": round(theme["area"] + random.uniform(-5.0, 10.0), 1),
            "created_at": created_at.isoformat(),
            "updated_at": now.isoformat(),
            "comments_count": random.randint(2, 14),
        })

    return incidents

"""
In-Memory Store & Seed Loader for JANVAANI.
Provides instant pre-seeded records for 50+ civic incidents, nearby facilities, and comments.
Phase 7: Added field workers registry and SLA rules.
"""

from typing import Dict, List, Set
from app.db.seed import generate_mock_incidents, generate_field_workers

# complaints[complaint_id] = { ...complaint fields... }
complaints: Dict[str, dict] = {}

# incidents[incident_id] = { ...incident fields... }
incidents: Dict[str, dict] = {}

# comments[incident_id] = [ { id, text, author, created_at }, ... ]
comments: Dict[str, list] = {}

# feedback[incident_id] = [ { rating: 1-5, comment, citizen_name, created_at } ]
feedback: Dict[str, list] = {}

# supports[incident_id] = set of ip/session hashes
supports: Dict[str, set] = {}

# news reactions
news_likes: Dict[str, int] = {}
news_shares: Dict[str, int] = {}

# Nearby facility evidence cache
facilities: Dict[str, list] = {}

# Phase 7: Field workers  workers[worker_id] = { ...worker fields... }
workers: Dict[str, dict] = {}

# Phase 7: SLA rules by severity — max hours before escalation
sla_rules: Dict[str, int] = {
    "critical": 4,    # 4 hours
    "high":     12,   # 12 hours
    "medium":   24,   # 24 hours
    "low":      72,   # 72 hours
}


def seed_store():
    """Seed in-memory store with 50+ realistic incidents and field workers."""
    mock_data = generate_mock_incidents(50)
    for inc in mock_data:
        inc_id = inc["incident_id"]
        incidents[inc_id] = inc
        
        # Seed comments
        comments[inc_id] = [
            {
                "comment_id": f"c1-{inc_id}",
                "author_name": "Local Resident",
                "text": "This issue has been worsening over the last few days. Need urgent clearance.",
                "created_at": inc["created_at"],
            },
            {
                "comment_id": f"c2-{inc_id}",
                "author_name": "Ward Inspector",
                "text": "Assigned to Rapid Response Unit. Inspection team dispatched.",
                "created_at": inc["created_at"],
            }
        ]
        
        # Seed nearby emergency facilities
        facilities[inc_id] = [
            {
                "facility_type": "hospital",
                "name": "Central District Trauma Hospital",
                "distance_meters": 320.0,
                "latitude": inc["latitude"] + 0.002,
                "longitude": inc["longitude"] + 0.001,
            },
            {
                "facility_type": "school",
                "name": "Govt Senior Secondary Model School",
                "distance_meters": 180.0,
                "latitude": inc["latitude"] - 0.0015,
                "longitude": inc["longitude"] + 0.002,
            },
            {
                "facility_type": "arterial_road",
                "name": "Main Arterial Transit Ring Road",
                "distance_meters": 50.0,
                "latitude": inc["latitude"] + 0.0005,
                "longitude": inc["longitude"] - 0.0005,
            },
            {
                "facility_type": "storm_drain",
                "name": "Primary Outfall Stormwater Channel #4",
                "distance_meters": 120.0,
                "latitude": inc["latitude"] - 0.001,
                "longitude": inc["longitude"] - 0.001,
            }
        ]

    # Phase 7: Seed field workers
    for w in generate_field_workers():
        workers[w["worker_id"]] = w


# Run seeding
seed_store()


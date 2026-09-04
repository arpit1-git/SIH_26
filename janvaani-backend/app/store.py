"""
Phase 1 — In-memory data store.

Replaces PostgreSQL for Phase 1 so the full API works without a DB.
Phase 4 will replace every dict here with real SQLAlchemy + PostGIS queries.

Structure mirrors the final DB schema so the migration is a drop-in swap.
"""

from typing import Dict

# complaints[complaint_id] = { ...complaint fields... }
complaints: Dict[str, dict] = {}

# incidents[incident_id] = { ...incident fields... }
incidents: Dict[str, dict] = {}

# comments[incident_id] = [ { id, text, created_at }, ... ]
comments: Dict[str, list] = {}

# supports[incident_id] = set of ip/session hashes (rate-limit dedup)
supports: Dict[str, set] = {}

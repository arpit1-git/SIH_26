"""
Map / GIS API — /api/map/*

Phase 1: Mock GeoJSON data with realistic coordinates.
Phase 4: Real PostGIS + H3 aggregation + OSM Overpass queries.
"""

import math
import random
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/map", tags=["GIS / Map"])

# ── Mock facility types (Phase 4: real OSM Overpass) ─────────────────────────
FACILITY_TYPES = [
    "school", "hospital", "clinic", "police_station",
    "fire_station", "bus_stop", "railway_station", "market",
]
FACILITY_WEIGHTS = {
    "hospital": 0.90, "school": 0.85, "fire_station": 0.78,
    "police_station": 0.72, "railway_station": 0.68, "clinic": 0.62,
    "market": 0.55, "bus_stop": 0.45,
}


@router.get("/heatmap", summary="H3 hexagon heatmap data (GeoJSON)")
async def get_heatmap(
    issue_type: Optional[str] = Query(None),
    status: Optional[str]     = Query(None),
    municipality: Optional[str] = Query(None),
):
    """
    Returns H3 hexagon-indexed incident density as GeoJSON FeatureCollection.
    Each feature has `incident_count`, `avg_risk_score`, `issue_type`.

    Phase 1: mock data with real-area Mumbai coordinates.
    Phase 4: real PostGIS + H3 aggregation query.
    """
    cells = [
        {"h3": "8a2a100d2d37fff", "lat": 19.0760, "lon": 72.8777, "count": 8,  "risk": 74.2, "type": "waterlogging",    "unresolved": 6},
        {"h3": "8a2a100d2cfffff", "lat": 19.0820, "lon": 72.8850, "count": 5,  "risk": 55.1, "type": "mixed_waste",      "unresolved": 3},
        {"h3": "8a2a100d2d27fff", "lat": 19.0700, "lon": 72.8700, "count": 12, "risk": 88.3, "type": "waterlogging",    "unresolved": 10},
        {"h3": "8a2a100d2c57fff", "lat": 19.0650, "lon": 72.8900, "count": 3,  "risk": 38.5, "type": "illegal_dumping", "unresolved": 2},
        {"h3": "8a2a100d2c67fff", "lat": 19.0900, "lon": 72.8600, "count": 7,  "risk": 65.0, "type": "overflowing_bin", "unresolved": 5},
        {"h3": "8a2a100d2e07fff", "lat": 19.0550, "lon": 72.9000, "count": 4,  "risk": 47.3, "type": "flooded_road",    "unresolved": 3},
        {"h3": "8a2a100d2d57fff", "lat": 19.0800, "lon": 72.8650, "count": 9,  "risk": 79.8, "type": "blocked_drainage","unresolved": 7},
    ]

    if issue_type:
        cells = [c for c in cells if c["type"] == issue_type]

    level_map = lambda r: "critical" if r >= 81 else "high" if r >= 56 else "medium" if r >= 31 else "low"

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c["lon"], c["lat"]]},
                "properties": {
                    "h3_index":       c["h3"],
                    "incident_count": c["count"],
                    "unresolved_count": c["unresolved"],
                    "avg_risk_score": c["risk"],
                    "issue_type":     c["type"],
                    "severity_level": level_map(c["risk"]),
                },
            }
            for c in cells
        ],
    }


@router.get("/nearby-facilities", summary="Nearby civic facilities for a location")
async def get_nearby_facilities(
    lat: float    = Query(..., description="Latitude"),
    lon: float    = Query(..., description="Longitude"),
    radius_m: float = Query(default=500, le=2000, description="Search radius in metres"),
):
    """
    Returns civic facilities (schools, hospitals, etc.) near a lat/lon point.

    Phase 1: realistic mock data generated from lat/lon.
    Phase 4: real OSM Overpass API query with caching.
    """
    random.seed(int(abs(lat * 1000 + lon * 1000)))  # deterministic for same location
    facilities = []

    for ftype in FACILITY_TYPES:
        if random.random() > 0.45:  # ~55% chance per type
            dist  = round(random.uniform(60, radius_m), 1)
            angle = random.uniform(0, 2 * math.pi)
            dlat  = (dist / 111_000) * math.cos(angle)
            dlon  = (dist / (111_000 * math.cos(math.radians(lat)))) * math.sin(angle)
            facilities.append({
                "type":             ftype,
                "name":             f"{ftype.replace('_', ' ').title()} #{random.randint(1, 99)}",
                "lat":              round(lat + dlat, 6),
                "lon":              round(lon + dlon, 6),
                "distance_m":       dist,
                "relevance_weight": FACILITY_WEIGHTS.get(ftype, 0.50),
            })

    facilities.sort(key=lambda x: x["distance_m"])
    return {
        "query_lat":    lat,
        "query_lon":    lon,
        "radius_m":     radius_m,
        "facility_count": len(facilities),
        "facilities":   facilities,
    }


@router.get("/municipalities", summary="List municipal bodies")
async def get_municipalities():
    """
    Returns registered municipal bodies and their basic info.
    Phase 4: fetched from DB, with geospatial jurisdiction boundaries (GeoJSON).
    """
    return {
        "municipalities": [
            {"id": "mun-001", "name": "Municipal Corporation of Greater Mumbai", "city": "Mumbai",     "state": "Maharashtra"},
            {"id": "mun-002", "name": "Pune Municipal Corporation",              "city": "Pune",       "state": "Maharashtra"},
            {"id": "mun-003", "name": "Navi Mumbai Municipal Corporation",       "city": "Navi Mumbai","state": "Maharashtra"},
            {"id": "mun-004", "name": "Thane Municipal Corporation",             "city": "Thane",      "state": "Maharashtra"},
        ]
    }


@router.get("/hotspots", summary="Top incident hotspots")
async def get_hotspots(limit: int = Query(default=5, le=20)):
    """
    Top H3 cells ranked by incident density.
    Phase 1: mock. Phase 4: real PostGIS/H3 aggregation + Phase 9: predictive overlay.
    """
    return {
        "hotspots": [
            {
                "h3_index":         "8a2a100d2d27fff",
                "lat": 19.0700, "lon": 72.8700,
                "incident_count":   12,
                "unresolved_count": 10,
                "avg_risk_score":   88.3,
                "top_issue_type":   "waterlogging",
                "recurrence":       4,
                "latest_incident_id": "JV-MOCK001",
                "nearby_critical_facilities": ["school (120m)", "hospital (480m)"],
            },
            {
                "h3_index":         "8a2a100d2d57fff",
                "lat": 19.0800, "lon": 72.8650,
                "incident_count":   9,
                "unresolved_count": 7,
                "avg_risk_score":   79.8,
                "top_issue_type":   "blocked_drainage",
                "recurrence":       2,
                "latest_incident_id": "JV-MOCK002",
                "nearby_critical_facilities": ["bus_stop (80m)", "market (250m)"],
            },
        ][:limit]
    }

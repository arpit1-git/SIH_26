"""
Map / GIS API — /api/map/*
Provides Geospatial Heatmaps, Dynamic H3 Clusters, Nearby Emergency Facilities, and Hotspots.
"""

import math
import random
from typing import Optional, List
from fastapi import APIRouter, Query
from app.store import incidents, facilities

router = APIRouter(prefix="/api/map", tags=["GIS / Map"])

FACILITY_WEIGHTS = {
    "hospital": 0.95,
    "school": 0.88,
    "arterial_road": 0.82,
    "storm_drain": 0.78,
    "bus_terminal": 0.65,
    "metro_station": 0.60,
}


@router.get("/heatmap", summary="Incident Heatmap & Geospatial Clusters (GeoJSON)")
async def get_heatmap(
    category: Optional[str] = Query(None, description="Category filter (waste or waterlogging)"),
    severity: Optional[str] = Query(None, description="Severity filter (critical, high, medium, low)"),
    status: Optional[str] = Query(None, description="Status filter (open, in_progress, resolved)"),
):
    """
    Returns dynamic GeoJSON FeatureCollection of all active civic incidents
    with H3 hexagon metadata, coordinates, severity levels, and priority scores.
    """
    all_incidents = list(incidents.values())

    if category and category != "all":
        all_incidents = [i for i in all_incidents if i.get("category") == category]
    if severity and severity != "all":
        all_incidents = [i for i in all_incidents if i.get("severity", "").lower() == severity.lower()]
    if status and status != "all":
        all_incidents = [i for i in all_incidents if i.get("status", "").lower() == status.lower()]

    features = []
    for inc in all_incidents:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [inc["longitude"], inc["latitude"]],
            },
            "properties": {
                "incident_id": inc["incident_id"],
                "issue_type": inc["issue_type"],
                "category": inc.get("category", "waste"),
                "severity": inc["severity"],
                "risk_score": inc["risk_score"],
                "civic_impact_score": inc.get("civic_impact_score", 50.0),
                "location_name": inc["location_name"],
                "ward_number": inc.get("ward_number", 1),
                "complaint_count": inc["complaint_count"],
                "support_count": inc.get("support_count", 0),
                "complaint_velocity": inc.get("complaint_velocity", 0.0),
                "recurrence_count": inc.get("recurrence_count", 0),
                "is_hotspot": inc.get("is_hotspot", False),
                "status": inc["status"],
                "image_url": inc.get("image_url", "/ui_themes/waste1.jpg"),
                "segmentation_mask_url": inc.get("segmentation_mask_url"),
                "affected_area_estimate": inc.get("affected_area_estimate", 25.0),
                "h3_index": inc.get("h3_index", "8860145b00ffffff"),
            },
        })

    return {
        "type": "FeatureCollection",
        "total_count": len(features),
        "features": features,
    }


@router.get("/nearby-facilities", summary="Nearby civic and emergency facilities")
async def get_nearby_facilities(
    lat: float = Query(..., description="Target Latitude"),
    lng: float = Query(..., description="Target Longitude"),
    radius_m: float = Query(default=1000.0, le=5000.0, description="Search radius in meters"),
):
    """
    Queries nearby critical emergency facilities (hospitals, schools, arterial transit roads, stormwater drains).
    """
    # Deterministic facility generator based on coordinates
    random.seed(int(abs(lat * 10000 + lng * 10000)))

    results = [
        {
            "facility_type": "hospital",
            "name": "District Apex Trauma Center & Hospital",
            "distance_meters": round(random.uniform(80, 450), 1),
            "lat": round(lat + random.uniform(-0.003, 0.003), 6),
            "lng": round(lng + random.uniform(-0.003, 0.003), 6),
            "impact_weight": 0.95,
        },
        {
            "facility_type": "school",
            "name": "Kendriya Vidyalaya Public School",
            "distance_meters": round(random.uniform(120, 500), 1),
            "lat": round(lat + random.uniform(-0.003, 0.003), 6),
            "lng": round(lng + random.uniform(-0.003, 0.003), 6),
            "impact_weight": 0.88,
        },
        {
            "facility_type": "arterial_road",
            "name": "National Highway Corridor Bypass",
            "distance_meters": round(random.uniform(40, 200), 1),
            "lat": round(lat + random.uniform(-0.002, 0.002), 6),
            "lng": round(lng + random.uniform(-0.002, 0.002), 6),
            "impact_weight": 0.85,
        },
        {
            "facility_type": "storm_drain",
            "name": "Trunk Drainage Canal #8",
            "distance_meters": round(random.uniform(60, 300), 1),
            "lat": round(lat + random.uniform(-0.002, 0.002), 6),
            "lng": round(lng + random.uniform(-0.002, 0.002), 6),
            "impact_weight": 0.80,
        },
    ]

    results.sort(key=lambda x: x["distance_meters"])
    return {
        "query_lat": lat,
        "query_lng": lng,
        "radius_m": radius_m,
        "facility_count": len(results),
        "facilities": results,
    }


@router.get("/hotspots", summary="Top chronic civic hotspot clusters")
async def get_hotspots(limit: int = Query(default=10, le=25)):
    """
    Returns top chronic civic hotspots with 90-day recurrence flags,
    complaint velocity spikes, and proximity hazards.
    """
    all_incidents = list(incidents.values())
    # Filter or rank by recurrence and risk score
    ranked = sorted(
        all_incidents,
        key=lambda x: (x.get("is_hotspot", False), x.get("risk_score", 0), x.get("complaint_count", 0)),
        reverse=True,
    )

    hotspot_list = []
    for inc in ranked[:limit]:
        hotspot_list.append({
            "incident_id": inc["incident_id"],
            "location_name": inc["location_name"],
            "issue_type": inc["issue_type"],
            "category": inc.get("category", "waste"),
            "risk_score": inc["risk_score"],
            "severity": inc["severity"],
            "complaint_count": inc["complaint_count"],
            "support_count": inc.get("support_count", 0),
            "complaint_velocity": inc.get("complaint_velocity", 1.0),
            "recurrence_count": inc.get("recurrence_count", 3),
            "is_hotspot": inc.get("is_hotspot", True),
            "lat": inc["latitude"],
            "lng": inc["longitude"],
            "image_url": inc.get("image_url", "/ui_themes/waste1.jpg"),
            "nearest_hospital_dist": "320m",
            "nearest_school_dist": "180m",
        })

    return {
        "total_hotspots": len(hotspot_list),
        "hotspots": hotspot_list,
    }


@router.get("/municipalities", summary="Municipal Corporation jurisdictions")
async def get_municipalities():
    """Returns municipal body zones and ward boundaries."""
    return {
        "municipalities": [
            {"id": "MC-01", "name": "Municipal Corporation Central Zone", "wards": [1, 2, 3, 4, 5, 6, 7]},
            {"id": "MC-02", "name": "Municipal Corporation North Industrial Zone", "wards": [8, 9, 10, 11]},
            {"id": "MC-03", "name": "Municipal Corporation South Transit Corridor", "wards": [12, 13, 14, 15]},
        ]
    }

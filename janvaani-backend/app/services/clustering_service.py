"""
Multi-Signal Incident Clustering & Duplicate Detection Engine for JANVAANI (Phase 5).
Combines spatial proximity (Haversine/H3), category matching, temporal decay,
and text/evidence similarity to cluster complaints into unified civic incidents.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

import app.store as store


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in meters between two lat/lng points."""
    R = 6_371_000  # Earth's radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def text_similarity_jaccard(text1: Optional[str], text2: Optional[str]) -> float:
    """Simple token-based Jaccard similarity for complaint text/voice transcripts."""
    if not text1 or not text2:
        return 0.0
    tokens1 = set(text1.lower().replace(",", " ").replace(".", " ").split())
    tokens2 = set(text2.lower().replace(",", " ").replace(".", " ").split())
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)


def evaluate_cluster_match(
    new_lat: float,
    new_lng: float,
    new_issue_type: str,
    new_text: Optional[str],
    incident: Dict[str, Any],
    max_radius_m: float = 250.0,
    max_time_hours: float = 48.0,
) -> Tuple[bool, float, List[str]]:
    """
    Evaluates whether a new complaint belongs to an existing incident.
    Returns:
      (is_match, match_confidence_score [0.0 - 1.0], matching_signals)
    """
    signals = []
    
    # 1. Category / Issue Type Check
    inc_type = incident.get("issue_type", "")
    inc_cat = incident.get("category", "")
    
    # Check exact type match or general category match
    is_waste_new = any(k in new_issue_type.lower() for k in ["waste", "dumping", "bin", "garbage", "trash"])
    is_water_new = any(k in new_issue_type.lower() for k in ["water", "flood", "drain", "stagnant"])
    
    is_waste_inc = inc_cat == "waste" or any(k in inc_type.lower() for k in ["waste", "dumping", "bin", "garbage"])
    is_water_inc = inc_cat == "waterlogging" or any(k in inc_type.lower() for k in ["water", "flood", "drain"])
    
    if new_issue_type == inc_type:
        type_score = 1.0
        signals.append(f"Identical issue classification: {new_issue_type}")
    elif (is_waste_new and is_waste_inc) or (is_water_new and is_water_inc):
        type_score = 0.75
        signals.append(f"Compatible issue domain: {inc_cat or 'civic'}")
    else:
        # Mismatched domain (e.g. garbage vs flooding)
        return False, 0.0, []

    # 2. Spatial Distance Check
    inc_lat = float(incident.get("latitude", 0.0))
    inc_lng = float(incident.get("longitude", 0.0))
    distance_m = haversine_distance_m(new_lat, new_lng, inc_lat, inc_lng)
    
    if distance_m > max_radius_m:
        return False, 0.0, []
        
    # Distance proximity score (1.0 at 0m, decaying to 0.0 at max_radius_m)
    spatial_score = max(0.0, (max_radius_m - distance_m) / max_radius_m)
    signals.append(f"Geographic proximity: {round(distance_m, 1)}m (within {int(max_radius_m)}m radius)")

    # 3. Temporal Window Check
    created_at_str = incident.get("created_at")
    time_score = 1.0
    if created_at_str:
        try:
            created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            now_dt = datetime.now(timezone.utc)
            diff_hours = (now_dt - created_dt).total_seconds() / 3600.0
            if diff_hours > max_time_hours:
                # Issue is too old to naturally cluster without active confirmation
                time_score = 0.3
            else:
                time_score = max(0.4, 1.0 - (diff_hours / max_time_hours) * 0.6)
            signals.append(f"Temporal proximity: incident reported {round(diff_hours, 1)}h ago")
        except Exception:
            time_score = 0.8

    # 4. Text / Keyword Similarity
    text_score = 0.5
    if new_text:
        text_sim = text_similarity_jaccard(new_text, incident.get("location_name", "") + " " + incident.get("address", ""))
        if text_sim > 0.2:
            text_score = min(1.0, 0.5 + text_sim)
            signals.append(f"Contextual description overlap: {round(text_sim * 100)}%")

    # Weighted Confidence Score
    confidence = (spatial_score * 0.45) + (type_score * 0.30) + (time_score * 0.15) + (text_score * 0.10)
    confidence = round(min(1.0, max(0.0, confidence)), 2)

    is_match = confidence >= 0.55
    return is_match, confidence, signals


def cluster_or_create_incident(
    latitude: float,
    longitude: float,
    issue_type: str,
    complaint_id: str,
    ai_result: Any,
    text_description: Optional[str] = None,
    max_radius_m: float = 250.0,
) -> Tuple[str, str, float, List[str]]:
    """
    Scans existing active civic incidents, finds the best cluster match or creates a new incident.
    Returns:
      (incident_id, action ['merged' | 'created'], cluster_confidence, signals)
    """
    best_incident_id = None
    best_confidence = 0.0
    best_signals = []

    for inc_id, inc in store.incidents.items():
        # Do not merge into closed or verified resolved incidents older than 12 hours
        if inc.get("status") in ["resolved", "closed"]:
            continue
            
        is_match, confidence, signals = evaluate_cluster_match(
            new_lat=latitude,
            new_lng=longitude,
            new_issue_type=issue_type,
            new_text=text_description,
            incident=inc,
            max_radius_m=max_radius_m,
        )

        if is_match and confidence > best_confidence:
            best_confidence = confidence
            best_incident_id = inc_id
            best_signals = signals

    # If match found, attach to existing incident and update velocity
    if best_incident_id and best_confidence >= 0.55:
        inc = store.incidents[best_incident_id]
        inc["complaint_count"] = inc.get("complaint_count", 1) + 1
        
        # Calculate updated velocity (reports/hour surge)
        now_iso = datetime.now(timezone.utc).isoformat()
        inc["updated_at"] = now_iso
        
        # Update velocity metric
        current_vel = inc.get("complaint_velocity", 1.0)
        inc["complaint_velocity"] = round(current_vel + 0.6, 1)

        return best_incident_id, "merged", best_confidence, best_signals

    # Otherwise, spin up a new Civic Incident
    import uuid
    from app.services.priority_scoring import calculate_civic_risk_score

    new_inc_id = f"JV-{1000 + len(store.incidents)}"
    initial_sev = getattr(ai_result, "severity_initial", None)
    sev_value = initial_sev.value if initial_sev else "medium"
    
    # Initial scoring calculation
    scoring_data = {
        "severity": sev_value,
        "confidence": getattr(ai_result, "evidence_score", 0.85),
        "complaint_count": 1,
        "support_count": 0,
        "complaint_velocity": 1.0,
        "affected_area_estimate": 25.0,
        "hospital_distance_m": 450.0,
        "school_distance_m": 350.0,
        "is_arterial_road": True,
        "recurrence_count": 0,
        "hours_unresolved": 0.5,
    }
    
    risk_score, civic_impact, level, factors = calculate_civic_risk_score(scoring_data)
    
    category = "waterlogging" if any(w in issue_type.lower() for w in ["water", "flood", "drain"]) else "waste"
    now_iso = datetime.now(timezone.utc).isoformat()

    new_incident = {
        "incident_id": new_inc_id,
        "issue_type": issue_type,
        "category": category,
        "severity": sev_value,
        "risk_score": risk_score,
        "civic_impact_score": civic_impact,
        "level": level,
        "evidence_score": getattr(ai_result, "evidence_score", 0.85),
        "latitude": latitude,
        "longitude": longitude,
        "location_name": f"Civic Location (Near {round(latitude, 4)}, {round(longitude, 4)})",
        "ward_number": 5,
        "complaint_count": 1,
        "support_count": 0,
        "like_count": 0,
        "complaint_velocity": 1.0,
        "recurrence_count": 0,
        "is_hotspot": False,
        "assigned_authority": "Municipal Corporation",
        "assigned_department": "Sanitation & Solid Waste" if category == "waste" else "Stormwater Drainage & Flood Control",
        "assigned_team": "Rapid Response Squad #1",
        "status": "open",
        "image_url": "/ui_themes/waste1.jpg" if category == "waste" else "/ui_themes/water1.jpg",
        "segmentation_mask_url": getattr(ai_result, "segmentation_mask_url", None) or f"/api/ai/mock-mask?type={issue_type}&seed=1",
        "affected_area_estimate": 25.0,
        "created_at": now_iso,
        "updated_at": now_iso,
        "explanation_bullets": factors,
    }

    store.incidents[new_inc_id] = new_incident
    return new_inc_id, "created", 1.0, ["New unique civic incident origin created"]

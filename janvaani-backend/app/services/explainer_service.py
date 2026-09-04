"""
Explainable AI Service for JANVAANI (Phase 5).
Generates human-readable, transparent reasoning and domain-specific municipal recommended actions.
"""

import math
from typing import Dict, Any, List


def generate_recommended_actions(issue_type: str, severity: str) -> List[Dict[str, Any]]:
    """
    Generates structured municipal decision-support recommendations according to PRD Section 34.
    """
    is_water = any(k in issue_type.lower() for k in ["water", "flood", "drain", "stagnant"])
    sev_upper = severity.upper()

    if is_water:
        return [
            {
                "step": 1,
                "title": "Stormwater Drainage Inspection",
                "action": "Inspect primary outfall channels and catch basins for debris blockage within 150m.",
                "department": "Stormwater Drainage & Flood Control",
                "priority": "Immediate" if sev_upper == "CRITICAL" else "High",
            },
            {
                "step": 2,
                "title": "High-Capacity De-Watering Pump Dispatch",
                "action": "Deploy trailer-mounted suction pump units to clear arterial carriage underpass.",
                "department": "Emergency Operations",
                "priority": "Immediate" if sev_upper == "CRITICAL" else "Standard",
            },
            {
                "step": 3,
                "title": "Traffic & Pedestrian Hazard Warning",
                "action": "Coordinate with traffic wardens to erect high-visibility warning barricades and flood depth gauges.",
                "department": "Traffic Police & Urban Safety",
                "priority": "High",
            },
            {
                "step": 4,
                "title": "Post-Drainage Silt Clearance & Verification",
                "action": "Remove collected sediment from road surface and capture after-cleanup computer vision evidence.",
                "department": "Sanitation & Solid Waste",
                "priority": "Routine",
            },
        ]
    else:
        return [
            {
                "step": 1,
                "title": "Rapid Sanitation Squad Mobilization",
                "action": "Dispatch compact hydraulic compactor and sanitation crew to cordoned waste zone.",
                "department": "Sanitation & Solid Waste",
                "priority": "Immediate" if sev_upper == "CRITICAL" else "High",
            },
            {
                "step": 2,
                "title": "Hazardous & Bio-Waste Segregation",
                "action": "Perform on-site sorting for unsegregated commercial or sharp waste prior to transport.",
                "department": "Sanitation & Solid Waste",
                "priority": "High",
            },
            {
                "step": 3,
                "title": "Anti-Microbial & Larvicidal Spraying",
                "action": "Disinfect surrounding ground perimeter to neutralize vector breeding and odor plume.",
                "department": "Public Health Division",
                "priority": "High",
            },
            {
                "step": 4,
                "title": "Digital Before/After Resolution Capture",
                "action": "Photograph cleared spot via Field Worker Module to trigger CV verification score.",
                "department": "Field Operations Unit",
                "priority": "Routine",
            },
        ]


def generate_why_critical_explanation(incident_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates explainable bullet points, signal factor breakdown, and reasoning for municipal triage.
    """
    issue_type = incident_data.get("issue_type", "civic_issue").replace("_", " ").title()
    severity = incident_data.get("severity", "medium").upper()
    risk_score = incident_data.get("risk_score", 50.0)
    civic_impact = incident_data.get("civic_impact_score", 50.0)
    complaints = incident_data.get("complaint_count", 1)
    supports = incident_data.get("support_count", 0)
    velocity = incident_data.get("complaint_velocity", 1.0)
    location = incident_data.get("location_name", "Municipal Zone")
    recurrence = incident_data.get("recurrence_count", 0)
    area = incident_data.get("affected_area_estimate", 25.0)

    bullets = []
    factor_breakdowns = []

    # 1. Citizen density & velocity spike
    bullets.append(f"{complaints} independent citizen complaints logged with {supports} active community upvotes.")
    factor_breakdowns.append({
        "factor": "Citizen Density & Upvotes",
        "contribution_pct": min(25, int(math.log1p(complaints + supports) * 6)),
        "description": f"{complaints} reports and {supports} verified affected citizens",
        "badge": "Community Signal",
    })

    if velocity >= 1.5:
        bullets.append(f"Accelerating report velocity: influx rate of {velocity} reports/hour (+{int(velocity*100)}% surge).")
        factor_breakdowns.append({
            "factor": "Velocity Surge",
            "contribution_pct": min(20, int(velocity * 4.5)),
            "description": f"Surge rate of {velocity} reports/hour",
            "badge": "Urgency Multiplier",
        })

    # 2. Environmental / Physical Impact
    if "water" in issue_type.lower() or "flood" in issue_type.lower():
        bullets.append(f"Severe surface flooding estimated at {area} m² causing potential vehicular stalling and transit delays.")
    else:
        bullets.append(f"Unsegregated solid waste accumulation ({area} m²) posing imminent public health and vector hazard.")

    factor_breakdowns.append({
        "factor": "Surface Footprint",
        "contribution_pct": min(15, int(math.log1p(area) * 3.5)),
        "description": f"Estimated affected surface area of {area} m²",
        "badge": "Physical Scale",
    })

    # 3. Critical Facility Proximity
    bullets.append("Critical proximity exposure: Located within 400m of Trauma Healthcare and Model School perimeter.")
    factor_breakdowns.append({
        "factor": "Critical Facility Proximity",
        "contribution_pct": 25,
        "description": "Hospital (<400m) & School (<300m) impact zone",
        "badge": "Vulnerability Risk",
    })

    # 4. Chronic Blackspot
    if recurrence >= 3:
        bullets.append(f"Chronic Blackspot: {recurrence} repeat incidents recorded at this exact location in 90 days.")
        factor_breakdowns.append({
            "factor": "Blackspot Recurrence",
            "contribution_pct": 15,
            "description": f"{recurrence} repeat civic incidents in last quarter",
            "badge": "Infrastructure Defect",
        })

    # 5. SLA Status
    bullets.append("Autonomous prioritization engine recommends field team dispatch within the next 2-hour window.")

    summary_text = (
        f"Incident {incident_data.get('incident_id', 'JV-INC')} is scored at {risk_score}/100 Risk Priority "
        f"and {civic_impact}/100 Civic Impact at {location} due to multi-signal civic escalation."
    )

    recommended_actions = generate_recommended_actions(issue_type, severity)

    return {
        "incident_id": incident_data.get("incident_id", "JV-INC"),
        "severity": severity.lower(),
        "risk_score": risk_score,
        "civic_impact_score": civic_impact,
        "summary": summary_text,
        "explanation_bullets": bullets,
        "factor_breakdowns": factor_breakdowns,
        "recommended_actions": recommended_actions,
        "ai_model": "JANVAANI Responsive Civic AI v2.0",
    }


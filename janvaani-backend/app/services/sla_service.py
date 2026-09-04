"""
SLA Service — Phase 7: Municipal Operations & SLA Workflows

Computes SLA deadlines by severity, detects overdue incidents,
calculates department-level compliance metrics, and returns
escalation queues for the Municipal Command Center.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict

import app.store as store

# SLA hours per severity level
SLA_HOURS: Dict[str, int] = {
    "critical": 4,
    "high":     12,
    "medium":   24,
    "low":      72,
}

DEPARTMENTS = [
    "Sanitation & Solid Waste",
    "Stormwater Drainage & Flood Control",
    "Roads & Infrastructure",
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_dt(iso: str) -> datetime:
    """Parse ISO string to timezone-aware datetime."""
    try:
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return _now()


def compute_sla_deadline(incident: dict) -> datetime:
    """Return SLA deadline for an incident based on its severity."""
    created = _parse_dt(incident.get("created_at", _now().isoformat()))
    hours = SLA_HOURS.get(incident.get("severity", "medium"), 24)
    return created + timedelta(hours=hours)


def enrich_sla(incident: dict) -> dict:
    """Add real-time SLA fields to an incident dict."""
    now = _now()
    deadline = compute_sla_deadline(incident)
    status = incident.get("status", "open")
    is_closed = status in ("resolved", "closed")

    time_remaining_h = round((deadline - now).total_seconds() / 3600, 1)
    is_overdue = not is_closed and deadline < now
    hours_overdue = round((now - deadline).total_seconds() / 3600, 1) if is_overdue else 0.0
    breach_pct = min(100, round(abs(time_remaining_h) / SLA_HOURS.get(incident.get("severity", "medium"), 24) * 100, 1))

    return {
        **incident,
        "sla_deadline": deadline.isoformat(),
        "sla_hours": SLA_HOURS.get(incident.get("severity", "medium"), 24),
        "sla_time_remaining_h": time_remaining_h if not is_closed else None,
        "is_overdue": is_overdue,
        "hours_overdue": hours_overdue,
        "sla_breach_pct": breach_pct if is_overdue else 0.0,
    }


def get_overdue_incidents(incidents: List[dict]) -> List[dict]:
    """Return all active incidents that have breached their SLA deadline."""
    now = _now()
    overdue = []
    for inc in incidents:
        status = inc.get("status", "open")
        if status in ("resolved", "closed"):
            continue
        deadline = compute_sla_deadline(inc)
        if deadline < now:
            enriched = enrich_sla(inc)
            overdue.append(enriched)
    overdue.sort(key=lambda x: x.get("hours_overdue", 0), reverse=True)
    return overdue


def get_escalation_queue(incidents: List[dict]) -> List[dict]:
    """Return incidents requiring escalation: overdue or marked escalated."""
    now = _now()
    queue = []
    for inc in incidents:
        status = inc.get("status", "open")
        if status in ("resolved", "closed"):
            continue
        deadline = compute_sla_deadline(inc)
        is_overdue = deadline < now
        is_flagged = inc.get("escalation_level", 0) >= 1
        if is_overdue or is_flagged:
            enriched = enrich_sla(inc)
            enriched["escalation_reason"] = _escalation_reason(inc, is_overdue)
            enriched["escalation_level"] = max(inc.get("escalation_level", 0), 1 if is_overdue else 0)
            queue.append(enriched)
    queue.sort(key=lambda x: (x.get("escalation_level", 0), x.get("risk_score", 0)), reverse=True)
    return queue


def _escalation_reason(inc: dict, is_overdue: bool) -> str:
    reasons = []
    if is_overdue:
        reasons.append("SLA Breached")
    if inc.get("risk_score", 0) >= 81:
        reasons.append("Critical Risk Score")
    if inc.get("complaint_velocity", 0) >= 3.0:
        reasons.append("High Complaint Velocity")
    if inc.get("critical_facility_alert"):
        reasons.append("Critical Facility Nearby")
    return " · ".join(reasons) if reasons else "Flagged for Escalation"


def get_sla_stats(incidents: List[dict]) -> dict:
    """Compute real SLA performance metrics from live incident data."""
    now = _now()
    active = [i for i in incidents if i.get("status") not in ("resolved", "closed")]
    resolved = [i for i in incidents if i.get("status") == "resolved"]

    overdue_count = sum(
        1 for i in active
        if compute_sla_deadline(i) < now
    )

    # Compliance: resolved within SLA
    resolved_within_sla = 0
    total_resolution_h = 0.0
    for i in resolved:
        created = _parse_dt(i.get("created_at", now.isoformat()))
        resolved_at = _parse_dt(i.get("resolved_at") or now.isoformat())
        deadline = compute_sla_deadline(i)
        if resolved_at <= deadline:
            resolved_within_sla += 1
        total_resolution_h += (resolved_at - created).total_seconds() / 3600

    compliance_pct = round(resolved_within_sla / len(resolved) * 100, 1) if resolved else 0.0
    avg_resolution_h = round(total_resolution_h / len(resolved), 1) if resolved else 0.0

    # Department breakdown
    dept_stats = {}
    for dept in DEPARTMENTS:
        dept_incs = [i for i in incidents if i.get("assigned_department") == dept]
        dept_resolved = [i for i in dept_incs if i.get("status") == "resolved"]
        dept_active = [i for i in dept_incs if i.get("status") not in ("resolved", "closed")]
        dept_overdue = sum(1 for i in dept_active if compute_sla_deadline(i) < now)

        d_compliance = 0.0
        d_avg_h = 0.0
        if dept_resolved:
            within = sum(
                1 for i in dept_resolved
                if _parse_dt(i.get("resolved_at") or now.isoformat()) <= compute_sla_deadline(i)
            )
            d_compliance = round(within / len(dept_resolved) * 100, 1)
            d_avg_h = round(
                sum(
                    (_parse_dt(i.get("resolved_at") or now.isoformat()) - _parse_dt(i["created_at"])).total_seconds() / 3600
                    for i in dept_resolved
                ) / len(dept_resolved), 1
            )

        dept_stats[dept] = {
            "department": dept,
            "total": len(dept_incs),
            "active": len(dept_active),
            "resolved": len(dept_resolved),
            "overdue": dept_overdue,
            "sla_compliance_pct": d_compliance,
            "avg_resolution_h": d_avg_h,
        }

    return {
        "total_incidents": len(incidents),
        "active_incidents": len(active),
        "resolved_incidents": len(resolved),
        "overdue_count": overdue_count,
        "escalated_count": sum(1 for i in incidents if i.get("escalation_level", 0) >= 1),
        "sla_compliance_pct": compliance_pct,
        "avg_resolution_hours": avg_resolution_h,
        "critical_active": sum(1 for i in active if i.get("severity") == "critical"),
        "high_active": sum(1 for i in active if i.get("severity") == "high"),
        "department_performance": list(dept_stats.values()),
        "sla_rules": SLA_HOURS,
    }

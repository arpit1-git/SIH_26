"""
Predictive Analytics & AI Policy Simulator Service for JanVaani Phase 8
"""

import random
from typing import Dict, Any, List


class PredictiveAnalyticsService:
    def __init__(self):
        self.wards = [
            {"id": "W001", "name": "Ward 1 — Connaught Place & Central", "base_risk": 45, "infrastructure_score": 88},
            {"id": "W002", "name": "Ward 2 — Karol Bagh & Market", "base_risk": 78, "infrastructure_score": 62},
            {"id": "W003", "name": "Ward 3 — Yamuna Bank & Lowland", "base_risk": 92, "infrastructure_score": 45},
            {"id": "W004", "name": "Ward 4 — Rohini Sector 1-10", "base_risk": 55, "infrastructure_score": 76},
            {"id": "W005", "name": "Ward 5 — Dwarka Sub-City", "base_risk": 35, "infrastructure_score": 91},
            {"id": "W006", "name": "Ward 6 — Okhla & Industrial Area", "base_risk": 82, "infrastructure_score": 54},
            {"id": "W007", "name": "Ward 7 — Chandni Chowk & Old City", "base_risk": 89, "infrastructure_score": 42},
            {"id": "W008", "name": "Ward 8 — Hauz Khas & South Ward", "base_risk": 40, "infrastructure_score": 85},
        ]

    def get_predictive_risk_data(self) -> Dict[str, Any]:
        """Returns 7-day predicted risk index, monsoon vulnerability alerts, and ward forecasts."""
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        # 7-day risk curve
        risk_trend = [
            {"day": day, "predicted_risk_score": round(65 + (i * 3.2) % 25, 1), "complaint_velocity_forecast": 40 + (i * 7) % 35}
            for i, day in enumerate(days)
        ]

        ward_forecasts = []
        for w in self.wards:
            predicted_surge = round(w["base_risk"] * 1.15, 1)
            grade = (
                "A+" if w["infrastructure_score"] >= 88 else
                "A" if w["infrastructure_score"] >= 80 else
                "B" if w["infrastructure_score"] >= 70 else
                "C" if w["infrastructure_score"] >= 55 else "D"
            )
            ward_forecasts.append({
                "ward_id": w["id"],
                "ward_name": w["name"],
                "base_risk_score": w["base_risk"],
                "predicted_risk_score": min(99, predicted_surge),
                "monsoon_vulnerability_level": "High" if w["base_risk"] >= 75 else "Medium" if w["base_risk"] >= 50 else "Low",
                "infrastructure_grade": grade,
                "infrastructure_score": w["infrastructure_score"],
                "top_vulnerability": "Stormwater Drainage" if "Lowland" in w["name"] or "Karol" in w["name"] else "Solid Waste" if "Old City" in w["name"] or "Industrial" in w["name"] else "Potholes & Roads",
            })

        return {
            "city_overall_risk_index": 72.4,
            "forecast_period": "Next 7 Days",
            "monsoon_alert": "High risk of localized waterlogging in Ward 3 and Ward 7 due to incoming rainfall predictions.",
            "7_day_trend": risk_trend,
            "ward_forecasts": ward_forecasts,
        }

    def get_ward_performance(self) -> Dict[str, Any]:
        """Returns ward-by-ward governance leaderboard and SLA compliance scorecards."""
        leaderboard = []
        for idx, w in enumerate(sorted(self.wards, key=lambda x: x["infrastructure_score"], reverse=True), 1):
            total_incidents = random.randint(45, 180)
            overdue = random.randint(2, int(total_incidents * 0.25))
            compliance = round(((total_incidents - overdue) / total_incidents) * 100, 1)
            
            grade = (
                "A+" if compliance >= 90 else
                "A" if compliance >= 80 else
                "B" if compliance >= 70 else
                "C" if compliance >= 60 else "D"
            )

            leaderboard.append({
                "rank": idx,
                "ward_id": w["id"],
                "ward_name": w["name"],
                "grade": grade,
                "sla_compliance_pct": compliance,
                "total_incidents": total_incidents,
                "overdue_incidents": overdue,
                "avg_resolution_time_hours": round(random.uniform(4.5, 28.0), 1),
                "citizen_satisfaction_rating": round(random.uniform(3.4, 4.9), 1),
                "infrastructure_index": w["infrastructure_score"],
            })

        return {
            "total_wards_tracked": len(leaderboard),
            "top_performing_ward": leaderboard[0]["ward_name"],
            "needs_attention_ward": leaderboard[-1]["ward_name"],
            "city_avg_compliance_pct": round(sum(l["sla_compliance_pct"] for l in leaderboard) / len(leaderboard), 1),
            "leaderboard": leaderboard,
        }

    def simulate_policy(
        self,
        sanitation_budget_increase_pct: float = 0,
        drainage_budget_increase_pct: float = 0,
        road_budget_increase_pct: float = 0,
        extra_field_teams: int = 0,
        pre_monsoon_clearing: bool = False
    ) -> Dict[str, Any]:
        """Simulates AI Policy impact on civic risk reduction and SLA improvements."""
        # Calculate impact factor
        budget_impact = (sanitation_budget_increase_pct * 0.25) + (drainage_budget_increase_pct * 0.35) + (road_budget_increase_pct * 0.20)
        team_impact = extra_field_teams * 2.5
        clearing_impact = 18.0 if pre_monsoon_clearing else 0.0

        total_risk_reduction_pct = min(48.0, round(budget_impact + team_impact + clearing_impact, 1))
        projected_sla_boost_pct = min(35.0, round(total_risk_reduction_pct * 0.65, 1))
        estimated_roi_multiplier = round(1.5 + (total_risk_reduction_pct / 20.0), 2)
        projected_prevented_incidents = int(total_risk_reduction_pct * 8.5)

        return {
            "simulation_inputs": {
                "sanitation_budget_increase_pct": sanitation_budget_increase_pct,
                "drainage_budget_increase_pct": drainage_budget_increase_pct,
                "road_budget_increase_pct": road_budget_increase_pct,
                "extra_field_teams": extra_field_teams,
                "pre_monsoon_clearing": pre_monsoon_clearing,
            },
            "projected_outcomes": {
                "risk_reduction_pct": total_risk_reduction_pct,
                "sla_compliance_boost_pct": projected_sla_boost_pct,
                "prevented_incidents_count": projected_prevented_incidents,
                "estimated_roi": f"{estimated_roi_multiplier}x",
                "recommended_focus_ward": "Ward 3 — Yamuna Bank & Lowland" if drainage_budget_increase_pct > 15 else "Ward 2 — Karol Bagh & Market",
                "ai_summary": f"Applying these policy adjustments is projected to reduce city-wide civic risk by {total_risk_reduction_pct}% and prevent approximately {projected_prevented_incidents} high-severity incidents over the next month."
            }
        }


predictive_service = PredictiveAnalyticsService()

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Brain,
  Sliders,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Building,
  RefreshCw,
  Zap,
  MapPin,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  Loader2,
  DollarSign,
  Users,
  Droplets,
  CheckCircle2,
  Target
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskTrendDay {
  day: string;
  predicted_risk_score: number;
  complaint_velocity_forecast: number;
  rainfall_probability_pct: number;
}

interface WardForecast {
  ward_id: string;
  ward_name: string;
  base_risk_score: number;
  predicted_risk_score: number;
  monsoon_vulnerability_level: string;
  infrastructure_grade: string;
  infrastructure_score: number;
  top_vulnerability: string;
  h3_index: string;
  latitude: number;
  longitude: number;
}

interface Blackspot {
  blackspot_id: string;
  location_name: string;
  category: string;
  recurrence_count_90d: number;
  risk_score: number;
  primary_cause: string;
  recommended_remediation: string;
  last_incident_date: string;
  affected_radius_meters: number;
}

interface WardLeaderboardItem {
  rank: number;
  ward_id: string;
  ward_name: string;
  grade: string;
  sla_compliance_pct: number;
  total_incidents: number;
  overdue_incidents: number;
  avg_resolution_time_hours: number;
  citizen_satisfaction_rating: number;
  infrastructure_index: number;
}

interface SimulationOutcomes {
  risk_reduction_pct: number;
  sla_compliance_boost_pct: number;
  prevented_incidents_count: number;
  estimated_roi: string;
  recommended_focus_ward: string;
  ai_summary: string;
}

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<"forecast" | "blackspots" | "simulator" | "leaderboard">("forecast");
  const [loading, setLoading] = useState(true);

  // Data states
  const [riskData, setRiskData] = useState<any | null>(null);
  const [blackspotData, setBlackspotData] = useState<any | null>(null);
  const [performanceData, setPerformanceData] = useState<any | null>(null);

  // Simulator states
  const [sanitationBudget, setSanitationBudget] = useState<number>(15);
  const [drainageBudget, setDrainageBudget] = useState<number>(25);
  const [roadBudget, setRoadBudget] = useState<number>(10);
  const [extraTeams, setExtraTeams] = useState<number>(4);
  const [preMonsoonClearing, setPreMonsoonClearing] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationOutcomes | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRisk, resBlackspots, resPerf] = await Promise.all([
        fetch("/api/admin/predictions"),
        fetch("/api/admin/predictions/recurring"),
        fetch("/api/admin/performance"),
      ]);

      if (resRisk.ok) setRiskData(await resRisk.json());
      if (resBlackspots.ok) setBlackspotData(await resBlackspots.json());
      if (resPerf.ok) setPerformanceData(await resPerf.json());
    } catch (e) {
      console.error("Failed to load prediction data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/admin/predictions/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sanitation_budget_increase_pct: sanitationBudget,
          drainage_budget_increase_pct: drainageBudget,
          road_budget_increase_pct: roadBudget,
          extra_field_teams: extraTeams,
          pre_monsoon_clearing: preMonsoonClearing,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data.projected_outcomes);
      }
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setSimulating(false);
    }
  }, [sanitationBudget, drainageBudget, roadBudget, extraTeams, preMonsoonClearing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-500/20 border border-cyan-500/30">
              <Brain className="w-7 h-7 text-cyan-400" />
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Predictive Civic Intelligence
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            XGBoost 30-Day Risk Forecasting, H3 Spatial Hotspots & Interactive AI Policy Simulator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2.5 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* ── Monsoon Alert Banner ────────────────────────────────────── */}
      {riskData?.monsoon_alert && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-red-950/50 to-amber-950/40 border border-rose-500/40 flex items-center gap-3"
        >
          <Flame className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
          <div className="text-sm font-semibold text-rose-200">
            {riskData.monsoon_alert}
          </div>
        </motion.div>
      )}

      {/* ── Tab Switcher Navigation ──────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "forecast"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          7-Day Risk & H3 Hotspots
        </button>

        <button
          onClick={() => setActiveTab("blackspots")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "blackspots"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Chronic Blackspots ({blackspotData?.total_chronic_blackspots || 4})
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "simulator"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sliders className="w-4 h-4" />
          AI Policy & Budget Simulator
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "leaderboard"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ward Governance Leaderboard
        </button>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-16 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: 7-Day Risk Forecast & H3 Hotspots */}
          {activeTab === "forecast" && (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* 7-Day Trend Visualizer */}
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      7-Day XGBoost City-Wide Risk Curve
                    </h2>
                    <p className="text-xs text-slate-400">
                      Predictive surge velocity and rainfall correlation forecast
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
                    Index: {riskData?.city_overall_risk_index}/100 Risk
                  </span>
                </div>

                {/* Simulated Chart Bars */}
                <div className="grid grid-cols-7 gap-3 pt-4 items-end h-48">
                  {riskData?.["7_day_trend"]?.map((item: RiskTrendDay, idx: number) => {
                    const heightPct = Math.max(25, (item.predicted_risk_score / 100) * 100);
                    const isSurge = item.predicted_risk_score >= 75;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-cyan-300">
                          {item.predicted_risk_score}
                        </span>
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-xl transition-all duration-500 ${
                            isSurge
                              ? "bg-gradient-to-t from-rose-600 to-amber-500 border border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                              : "bg-gradient-to-t from-cyan-600 to-teal-400 border border-cyan-400/30"
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-300">{item.day}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          ☔ {item.rainfall_probability_pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ward Risk Forecast Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  Ward Vulnerability Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {riskData?.ward_forecasts?.map((w: WardForecast) => (
                    <div
                      key={w.ward_id}
                      className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {w.ward_id}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            w.monsoon_vulnerability_level === "High"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {w.monsoon_vulnerability_level} Risk
                        </span>
                      </div>

                      <div className="font-bold text-sm text-white line-clamp-1">
                        {w.ward_name}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center py-2 bg-slate-950/60 rounded-xl border border-white/5">
                        <div>
                          <div className="text-[10px] text-slate-400">Base Risk</div>
                          <div className="text-sm font-bold text-slate-300">
                            {w.base_risk_score}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">30d Forecast</div>
                          <div className="text-sm font-extrabold text-cyan-400">
                            {w.predicted_risk_score}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500">Top Risk Driver:</span>{" "}
                        <span className="text-slate-300 font-medium">{w.top_vulnerability}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: Chronic Blackspots & Root Cause */}
          {activeTab === "blackspots" && (
            <motion.div
              key="blackspots"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blackspotData?.blackspots?.map((b: Blackspot) => (
                  <div
                    key={b.blackspot_id}
                    className="glass-card rounded-3xl p-6 border border-rose-500/30 space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-rose-400 bg-rose-500/20 px-3 py-1 rounded-lg border border-rose-500/40">
                        {b.blackspot_id} — {b.recurrence_count_90d}x Repeat Incidents
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        Risk {b.risk_score}/100
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{b.location_name}</h3>
                      <div className="text-xs text-slate-400 mt-0.5 capitalize">
                        Category: <span className="text-slate-200 font-semibold">{b.category}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2 text-xs">
                      <div className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Root Cause Diagnosis
                      </div>
                      <p className="text-slate-300 leading-relaxed">{b.primary_cause}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        AI Recommended Long-Term Remediation
                      </div>
                      <p className="text-emerald-200/90 leading-relaxed">
                        {b.recommended_remediation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: Interactive AI Policy & Budget Simulator */}
          {activeTab === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Controls Column */}
              <div className="lg:col-span-6 glass-card rounded-3xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    AI Governance & Budget Controls
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Adjust resource allocation parameters to simulate city-wide risk impact
                  </p>
                </div>

                {/* Slider 1: Sanitation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      Sanitation Budget Boost
                    </span>
                    <span className="text-amber-400 font-mono">+{sanitationBudget}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={sanitationBudget}
                    onChange={(e) => setSanitationBudget(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Slider 2: Drainage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                      Drainage & Stormwater Budget Boost
                    </span>
                    <span className="text-cyan-400 font-mono">+{drainageBudget}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={drainageBudget}
                    onChange={(e) => setDrainageBudget(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Slider 3: Field Teams */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Additional Field Response Teams
                    </span>
                    <span className="text-emerald-400 font-mono">+{extraTeams} Teams</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={extraTeams}
                    onChange={(e) => setExtraTeams(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                {/* Pre-monsoon Desilting Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div>
                    <div className="text-sm font-bold text-white">
                      Pre-Monsoon Hydro-jetting & Desilting
                    </div>
                    <div className="text-xs text-slate-400">
                      Clear high-priority outfall channels prior to monsoon surge
                    </div>
                  </div>
                  <button
                    onClick={() => setPreMonsoonClearing(!preMonsoonClearing)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      preMonsoonClearing ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                        preMonsoonClearing ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Simulation Outcome Display */}
              <div className="lg:col-span-6 space-y-6">
                <div className="glass-card rounded-3xl p-6 border border-amber-500/40 bg-gradient-to-b from-amber-950/20 to-slate-950 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-400" />
                      Projected Simulation Results
                    </h3>
                    {simulating && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
                  </div>

                  {simulationResult && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">
                            Risk Reduction
                          </div>
                          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                            -{simulationResult.risk_reduction_pct}%
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">
                            Prevented Incidents
                          </div>
                          <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                            {simulationResult.prevented_incidents_count}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">
                            SLA Compliance Boost
                          </div>
                          <div className="text-2xl font-extrabold text-amber-400 mt-1">
                            +{simulationResult.sla_compliance_boost_pct}%
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">
                            Projected ROI Multiplier
                          </div>
                          <div className="text-2xl font-extrabold text-purple-400 mt-1">
                            {simulationResult.estimated_roi}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2 text-xs">
                        <div className="font-bold text-amber-300">AI Policy Summary</div>
                        <p className="text-slate-300 leading-relaxed">
                          {simulationResult.ai_summary}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Ward Leaderboard */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="glass-card rounded-3xl p-6 space-y-4"
            >
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Ward Governance & SLA Compliance Leaderboard
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-semibold">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Ward Name</th>
                      <th className="py-3 px-3">Grade</th>
                      <th className="py-3 px-3">SLA Compliance</th>
                      <th className="py-3 px-3">Total Incidents</th>
                      <th className="py-3 px-3">Avg Resolution</th>
                      <th className="py-3 px-3">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {performanceData?.leaderboard?.map((w: WardLeaderboardItem) => (
                      <tr key={w.ward_id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-400">
                          #{w.rank}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{w.ward_name}</td>
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                            {w.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                          {w.sla_compliance_pct}%
                        </td>
                        <td className="py-3 px-3 text-slate-300">{w.total_incidents}</td>
                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {w.avg_resolution_time_hours}h
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">
                          ★ {w.citizen_satisfaction_rating}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

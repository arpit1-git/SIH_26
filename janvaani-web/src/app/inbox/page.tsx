"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import {
  Zap,
  Flame,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Building2,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface PriorityIncident {
  incident_id: string;
  issue_type: string;
  category: string;
  severity: string;
  level: string;
  risk_score: number;
  civic_impact_score: number;
  complaint_velocity: number;
  is_velocity_surge: boolean;
  critical_facility_alert: boolean;
  location_name: string;
  address?: string;
  complaint_count: number;
  support_count: number;
  status: string;
  assigned_department?: string;
  assigned_team?: string;
  created_at: string;
  explanation_bullets?: string[];
  facilities?: any[];
}

export default function PriorityInboxPage() {
  const [incidents, setIncidents] = useState<PriorityIncident[]>([]);
  const [summary, setSummary] = useState<any>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    velocity_surges: 0,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIncident, setSelectedIncident] = useState<PriorityIncident | null>(null);

  useEffect(() => {
    fetchPriorityInbox();
  }, [filterLevel, filterCategory, sortBy]);

  const fetchPriorityInbox = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel !== "all") params.append("level", filterLevel);
      if (filterCategory !== "all") params.append("category", filterCategory);
      params.append("sort_by", sortBy);
      params.append("limit", "100");

      const res = await fetch(`/api/admin/incidents/priority?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load priority inbox", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const term = searchQuery.toLowerCase();
    return (
      inc.location_name.toLowerCase().includes(term) ||
      inc.issue_type.toLowerCase().includes(term) ||
      inc.incident_id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Municipal Priority Inbox</h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>LIVE AI TRIAGE</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous priority dispatch queue driven by real-time civic risk, velocity spikes, and facility proximity (PRD §33).
          </p>
        </div>

        <button
          onClick={fetchPriorityInbox}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Summary KPI Badges (PRD §32 & §33) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterLevel("critical")}
          className={`glass-panel p-4 rounded-2xl border cursor-pointer transition ${
            filterLevel === "critical"
              ? "border-rose-500 bg-rose-500/10"
              : "border-white/10 hover:border-rose-500/40"
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">Critical Urgency</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white">{summary.critical}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
        </div>

        <div
          onClick={() => setFilterLevel("high")}
          className={`glass-panel p-4 rounded-2xl border cursor-pointer transition ${
            filterLevel === "high"
              ? "border-amber-500 bg-amber-500/10"
              : "border-white/10 hover:border-amber-500/40"
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">High Priority</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white">{summary.high}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
        </div>

        <div
          onClick={() => setFilterLevel("medium")}
          className={`glass-panel p-4 rounded-2xl border cursor-pointer transition ${
            filterLevel === "medium"
              ? "border-yellow-500 bg-yellow-500/10"
              : "border-white/10 hover:border-yellow-500/40"
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-yellow-400 font-bold block">Medium</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white">{summary.medium}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          </div>
        </div>

        <div
          onClick={() => setFilterLevel("low")}
          className={`glass-panel p-4 rounded-2xl border cursor-pointer transition ${
            filterLevel === "low"
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-white/10 hover:border-emerald-500/40"
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Low Routine</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-white">{summary.low}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>Velocity Surges</span>
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-cyan-300">{summary.velocity_surges}</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/20 px-1.5 py-0.5 rounded">
              &gt;2.0/hr
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident ID, location or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Levels</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Categories</option>
            <option value="waste">Solid Waste</option>
            <option value="waterlogging">Waterlogging</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
          >
            <option value="priority">Sort: Risk Score (0-100)</option>
            <option value="impact">Sort: Civic Impact Score</option>
            <option value="velocity">Sort: Complaint Velocity (Influx)</option>
            <option value="reports">Sort: Total Citizen Reports</option>
          </select>
        </div>
      </div>

      {/* Main Table / Queue */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Priority & ID</th>
                <th className="py-3.5 px-4">Issue & Category</th>
                <th className="py-3.5 px-4">Location & Facilities</th>
                <th className="py-3.5 px-4">Impact & Velocity</th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching incidents found in priority triage queue.
                  </td>
                </tr>
              ) : (
                filtered.map((inc) => (
                  <tr
                    key={inc.incident_id}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    {/* Priority & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <RiskBadge level={inc.level || inc.severity} score={inc.risk_score} size="sm" />
                        <div>
                          <span className="font-mono font-bold text-white block">{inc.incident_id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(inc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Issue & Category */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <SeverityChip issueType={inc.issue_type} size="sm" />
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">
                          {inc.category}
                        </span>
                      </div>
                    </td>

                    {/* Location & Facilities */}
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-200 truncate">{inc.location_name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inc.critical_facility_alert && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🏥 Facility Alert
                            </span>
                          )}
                          {inc.is_velocity_surge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> Surge (+{inc.complaint_velocity}/h)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Impact & Velocity */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-cyan-300">
                          <span>Impact: {inc.civic_impact_score}/100</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          <span>{inc.complaint_count} reports • {inc.support_count} upvotes</span>
                        </div>
                      </div>
                    </td>

                    {/* Status & Action */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
                          {inc.status}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {inc.assigned_team || "Pending Assign"}
                        </span>
                      </div>
                    </td>

                    {/* Quick Link */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/incidents/${inc.incident_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-white/10 transition inline-flex items-center"
                        title="View Full Incident File"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Explainability Drawer (PRD §17 & §33) */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-white/10 h-full overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedIncident.incident_id}
                </span>
                <h3 className="text-base font-bold text-white">AI Prioritization Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Risk Priority Score</span>
                <div className="text-2xl font-black text-amber-400">{selectedIncident.risk_score}/100</div>
                <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                  {selectedIncident.level} LEVEL
                </span>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Civic Impact Exposure</span>
                <div className="text-2xl font-black text-cyan-400">{selectedIncident.civic_impact_score}/100</div>
                <span className="text-[10px] font-mono text-slate-400">
                  ⚡ {selectedIncident.complaint_velocity} reports/hr
                </span>
              </div>
            </div>

            {/* Why Is This Critical? */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                <span>Explainable Prioritization Factors</span>
              </h4>

              <div className="space-y-2">
                {(selectedIncident.explanation_bullets || [
                  `${selectedIncident.complaint_count} citizen complaints logged with active community upvotes.`,
                  "Located within 400m perimeter of essential emergency infrastructure.",
                  "Transit route obstruction risk on primary municipal road corridor.",
                ]).map((bullet, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-slate-200 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <Link
                href={`/incidents/${selectedIncident.incident_id}`}
                className="flex-1 py-3 text-center rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Open Full Incident Page
              </Link>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

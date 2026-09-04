"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import {
  ShieldAlert,
  Building2,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RefreshCw,
  X,
  ChevronRight,
  Activity,
  Flame,
  HardHat,
  BarChart3,
  ArrowUpRight,
  Radio,
  Wifi,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  complaint_count: number;
  support_count: number;
  status: string;
  assigned_department?: string;
  assigned_team?: string;
  created_at: string;
}

interface SLAStats {
  total_active: number;
  overdue_count: number;
  compliance_pct: number;
  avg_resolution_h: number;
  dept_breakdown: Record<string, { total: number; overdue: number; compliance_pct: number }>;
}

interface PerformanceStats extends SLAStats {
  open: number;
  assigned: number;
  in_progress: number;
  workers_available: number;
  workers_on_duty: number;
  workers_in_transit: number;
}

interface Worker {
  worker_id: string;
  name: string;
  team: string;
  status: string;
  assigned_incident_id?: string;
  current_task_status?: string;
  current_incident_severity?: string;
  current_incident_risk_score?: number;
  current_incident_location?: string;
}

interface AssignModal {
  incident: PriorityIncident;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Sanitation & Solid Waste",
  "Stormwater Drainage & Flood Control",
  "Roads & Infrastructure",
];
const TEAMS = ["Team-Alpha", "Team-Bravo", "Team-Charlie", "Team-Delta"];

const statusColors: Record<string, string> = {
  open: "text-slate-400 bg-slate-800",
  assigned: "text-blue-400 bg-blue-900/40",
  in_progress: "text-amber-400 bg-amber-900/40",
  completed: "text-emerald-400 bg-emerald-900/40",
  resolved: "text-emerald-400 bg-emerald-900/40",
  escalated: "text-red-400 bg-red-900/40",
};

const workerStatusColors: Record<string, { dot: string; label: string }> = {
  available: { dot: "bg-emerald-400", label: "text-emerald-400" },
  on_duty: { dot: "bg-amber-400", label: "text-amber-400" },
  in_transit: { dot: "bg-blue-400", label: "text-blue-400" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-extrabold font-mono">{value}</div>
        <div className="text-xs text-slate-400 font-medium">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function WorkerCard({ worker }: { worker: Worker }) {
  const sc = workerStatusColors[worker.status] ?? { dot: "bg-slate-400", label: "text-slate-400" };
  return (
    <div className="glass-card rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{worker.name}</div>
          <div className="text-xs text-slate-400">{worker.team}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full animate-pulse ${sc.dot}`} />
          <span className={`text-xs font-medium capitalize ${sc.label}`}>
            {worker.status?.replace("_", " ") ?? ""}
          </span>
        </div>
      </div>
      {worker.current_incident_location && (
        <div className="text-[11px] text-slate-400 truncate border-t border-white/5 pt-2">
          📍 {worker.current_incident_location}
        </div>
      )}
      {worker.current_task_status && (
        <div className="text-[10px] font-mono text-amber-400/70 capitalize">
          {(worker.current_task_status || "").replace(/_/g, " ")}
        </div>
      )}
      {!worker.current_incident_location && (
        <div className="text-[11px] text-slate-500 border-t border-white/5 pt-2">
          No active assignment
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [incidents, setIncidents] = useState<PriorityIncident[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [assignModal, setAssignModal] = useState<AssignModal | null>(null);
  const [assignForm, setAssignForm] = useState({ department: "", team: "", authority: "", worker_id: "" });
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [incsRes, perfRes, workersRes] = await Promise.all([
        fetch("/api/admin/incidents/priority?limit=50"),
        fetch("/api/admin/performance"),
        fetch("/api/admin/workers"),
      ]);
      if (incsRes.ok) {
        const d = await incsRes.json();
        setIncidents(d.incidents || []);
      }
      if (perfRes.ok) setPerformance(await perfRes.json());
      if (workersRes.ok) {
        const d = await workersRes.json();
        setWorkers(d.workers || []);
      }
    } catch (e) {
      console.error("Command center fetch error", e);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleAssign = async () => {
    if (!assignModal) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/incidents/${assignModal.incident.incident_id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      if (res.ok) {
        setAssignSuccess(`Incident ${assignModal.incident.incident_id} assigned successfully!`);
        setTimeout(() => {
          setAssignModal(null);
          setAssignSuccess(null);
          setAssignForm({ department: "", team: "", authority: "", worker_id: "" });
          fetchAll();
        }, 1500);
      }
    } catch (e) {
      console.error("Assign error", e);
    } finally {
      setAssigning(false);
    }
  };

  const critical = incidents.filter((i) => i.level === "critical").length;
  const high = incidents.filter((i) => i.level === "high").length;
  const medium = incidents.filter((i) => i.level === "medium").length;
  const low = incidents.filter((i) => i.level === "low").length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-red-600/30 to-orange-500/20 border border-red-500/30">
              <ShieldAlert className="w-7 h-7 text-red-400" />
            </span>
            Municipal Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live operational dashboard — Phase 7 Municipal Workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchAll}
            className="glass-button rounded-full p-2 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/escalation"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Escalation Queue
          </Link>
        </div>
      </div>

      {/* ── Live Risk Summary Strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1 border border-red-500/20 glow-critical col-span-1">
          <Flame className="w-5 h-5 text-red-400" />
          <div className="text-3xl font-extrabold text-red-400 font-mono">{critical}</div>
          <div className="text-[10px] text-red-300/70 font-semibold">🔴 CRITICAL</div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1 border border-orange-500/20 col-span-1">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <div className="text-3xl font-extrabold text-orange-400 font-mono">{high}</div>
          <div className="text-[10px] text-orange-300/70 font-semibold">🟠 HIGH</div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1 col-span-1">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <div className="text-3xl font-extrabold text-yellow-400 font-mono">{medium}</div>
          <div className="text-[10px] text-yellow-300/70 font-semibold">🟡 MEDIUM</div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex flex-col items-center gap-1 col-span-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{low}</div>
          <div className="text-[10px] text-emerald-300/70 font-semibold">🟢 LOW</div>
        </div>

        {performance && (
          <>
            <SummaryCard
              icon={HardHat}
              label="Available Workers"
              value={performance.workers_available}
              color="bg-emerald-900/40 text-emerald-400"
            />
            <SummaryCard
              icon={Activity}
              label="On Duty / Transit"
              value={`${performance.workers_on_duty + performance.workers_in_transit}`}
              color="bg-amber-900/40 text-amber-400"
            />
            <SummaryCard
              icon={BarChart3}
              label="SLA Compliance"
              value={`${performance.compliance_pct ?? "--"}%`}
              color="bg-blue-900/40 text-blue-400"
              sub={`${performance.overdue_count} overdue`}
            />
          </>
        )}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Priority Incident Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Priority Incidents
            </h2>
            <Link href="/inbox" className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              Full Inbox <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
              No active incidents
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.slice(0, 12).map((inc, i) => (
                <motion.div
                  key={inc.incident_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card-hover rounded-xl p-4 flex items-center gap-4 cursor-pointer group"
                  onClick={() => {
                    setAssignModal({ incident: inc });
                    setAssignForm({
                      department: inc.assigned_department ?? "",
                      team: inc.assigned_team ?? "",
                      authority: "",
                      worker_id: "",
                    });
                  }}
                >
                  <div className="w-8 text-center text-xs text-slate-500 font-mono shrink-0">
                    #{i + 1}
                  </div>
                  <RiskBadge level={inc.level as RiskLevel} score={inc.risk_score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold font-mono text-amber-400">
                        {inc.incident_id}
                      </span>
                      <SeverityChip severity={inc.severity} />
                      {inc.is_velocity_surge && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-300 rounded-full border border-red-500/30">
                          ⚡ Surge
                        </span>
                      )}
                      {inc.critical_facility_alert && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-900/40 text-orange-300 rounded-full border border-orange-500/30">
                          🏥 Facility
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{inc.location_name}</div>
                    {inc.assigned_department && (
                      <div className="text-[10px] text-blue-400 mt-0.5">
                        → {inc.assigned_department}
                        {inc.assigned_team && ` · ${inc.assigned_team}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                        statusColors[inc.status] ?? "text-slate-400 bg-slate-800"
                      }`}
                    >
                      {(inc.status || "").replace("_", " ")}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Workers + SLA */}
        <div className="space-y-6">
          {/* Workers Grid */}
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-cyan-400" />
              Field Teams
            </h2>
            {workers.length === 0 ? (
              <div className="glass-card rounded-xl p-4 text-slate-500 text-xs text-center">
                No workers found
              </div>
            ) : (
              <div className="space-y-2">
                {workers.map((w) => (
                  <WorkerCard key={w.worker_id} worker={w} />
                ))}
              </div>
            )}
            <Link
              href="/field"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold glass-button text-slate-300 hover:text-white"
            >
              <HardHat className="w-4 h-4" />
              Open Field Worker Interface
            </Link>
          </div>

          {/* SLA Dept Breakdown */}
          {performance?.dept_breakdown && (
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                SLA by Department
              </h2>
              <div className="space-y-3">
                {Object.entries(performance.dept_breakdown).map(([dept, stats]) => (
                  <div key={dept} className="glass-card rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-slate-200 leading-tight">{dept}</div>
                      <div className="text-xs font-mono text-purple-400">{stats.compliance_pct}%</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-400 transition-all duration-700"
                        style={{ width: `${stats.compliance_pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {stats.total} total · {stats.overdue} overdue
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 max-w-md w-full shadow-2xl border border-white/15"
            >
              {assignSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  <p className="text-emerald-400 font-semibold text-center">{assignSuccess}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-lg">Assign Incident</h3>
                      <p className="text-xs text-slate-400 font-mono">{assignModal.incident.incident_id}</p>
                    </div>
                    <button onClick={() => setAssignModal(null)} className="glass-button rounded-full p-1.5">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
                    <span className="font-semibold text-amber-400">{(assignModal.incident.issue_type || "").replace(/_/g, " ")}</span>
                    {" — "}{assignModal.incident.location_name}
                    <div className="mt-1">
                      <RiskBadge level={assignModal.incident.level as RiskLevel} score={assignModal.incident.risk_score} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Department *</label>
                      <select
                        value={assignForm.department}
                        onChange={(e) => setAssignForm((f) => ({ ...f, department: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select department…</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Team *</label>
                      <select
                        value={assignForm.team}
                        onChange={(e) => setAssignForm((f) => ({ ...f, team: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Select team…</option>
                        {TEAMS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Authority / Ward Officer</label>
                      <input
                        type="text"
                        value={assignForm.authority}
                        onChange={(e) => setAssignForm((f) => ({ ...f, authority: e.target.value }))}
                        placeholder="Name of officer…"
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Assign Worker (optional)</label>
                      <select
                        value={assignForm.worker_id}
                        onChange={(e) => setAssignForm((f) => ({ ...f, worker_id: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">No specific worker…</option>
                        {workers
                          .filter((w) => w.status === "available")
                          .map((w) => (
                            <option key={w.worker_id} value={w.worker_id}>
                              {w.name} ({w.team})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setAssignModal(null)}
                      className="flex-1 py-2.5 rounded-xl glass-button text-sm text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssign}
                      disabled={!assignForm.department || !assignForm.team || assigning}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition hover:brightness-110"
                    >
                      {assigning ? "Assigning…" : "Confirm Assignment"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import {
  AlertTriangle,
  Clock,
  ChevronUp,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldAlert,
  Loader2,
  BarChart3,
  ArrowUpRight,
  Building2,
  Flame,
  Timer,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface EscalatedIncident {
  incident_id: string;
  issue_type: string;
  category: string;
  severity: string;
  risk_score: number;
  location_name: string;
  status: string;
  escalation_level: number;
  is_overdue: boolean;
  hours_overdue: number;
  sla_deadline: string;
  sla_hours: number;
  sla_time_remaining_h: number | null;
  sla_breach_pct: number;
  complaint_count: number;
  created_at: string;
}

interface SLAStats {
  total_active: number;
  overdue_count: number;
  compliance_pct: number;
  avg_resolution_h: number;
  dept_breakdown: Record<
    string,
    { total: number; overdue: number; compliance_pct: number; avg_resolution_h: number }
  >;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const escalationLevelMeta = [
  { label: "L0 — Normal", color: "text-slate-400 bg-slate-800" },
  { label: "L1 — Elevated", color: "text-yellow-400 bg-yellow-900/40 border border-yellow-500/30" },
  { label: "L2 — Supervisor", color: "text-orange-400 bg-orange-900/40 border border-orange-500/30" },
  { label: "L3 — Authority", color: "text-red-400 bg-red-900/40 border border-red-500/30 animate-pulse" },
];

function EscalationBadge({ level }: { level: number }) {
  const m = escalationLevelMeta[level] ?? escalationLevelMeta[0];
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.color}`}>
      {m.label}
    </span>
  );
}

function OverdueBadge({ hours }: { hours: number }) {
  const color =
    hours > 24 ? "text-red-400 bg-red-900/40 border-red-500/30" :
    hours > 8  ? "text-orange-400 bg-orange-900/40 border-orange-500/30" :
                 "text-yellow-400 bg-yellow-900/40 border-yellow-500/30";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${color} flex items-center gap-1`}>
      <Timer className="w-3 h-3" />
      {hours.toFixed(1)}h overdue
    </span>
  );
}

function SLABar({
  value,
  max = 100,
  color = "from-purple-500 to-blue-400",
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  label?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>{label}</span>
          <span className="font-mono">{value.toFixed(1)}{max === 100 ? "%" : "h"}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Escalate Modal ──────────────────────────────────────────────────────────

function EscalateModal({
  incident,
  onClose,
  onSuccess,
}: {
  incident: EscalatedIncident;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/incidents/${incident.incident_id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error("Escalate error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card rounded-2xl p-6 max-w-md w-full border border-red-500/20"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <ChevronUp className="w-12 h-12 text-red-400" />
            <p className="text-red-300 font-semibold text-center">
              Incident escalated successfully
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg text-red-300">Escalate Incident</h3>
                <p className="text-xs text-slate-400 font-mono">{incident.incident_id}</p>
              </div>
              <button onClick={onClose} className="glass-button rounded-full p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-sm text-slate-300 space-y-1">
              <div>
                <span className="font-semibold text-red-300">
                  {(incident.issue_type || "").replace(/_/g, " ")}
                </span>{" "}
                — {incident.location_name}
              </div>
              <EscalationBadge level={incident.escalation_level} />
              {incident.is_overdue && <OverdueBadge hours={incident.hours_overdue} />}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">
                Reason for escalation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe why this needs escalation…"
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl glass-button text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white hover:brightness-110 transition disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Escalate →"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EscalationPage() {
  const [escalated, setEscalated] = useState<EscalatedIncident[]>([]);
  const [slaStats, setSlaStats] = useState<SLAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [escalateTarget, setEscalateTarget] = useState<EscalatedIncident | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [escRes, slaRes] = await Promise.all([
        fetch("/api/admin/escalation"),
        fetch("/api/admin/sla"),
      ]);
      if (escRes.ok) {
        const d = await escRes.json();
        setEscalated(d.incidents || []);
      }
      if (slaRes.ok) setSlaStats(await slaRes.json());
    } catch (e) {
      console.error("Escalation fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const criticalEscalated = escalated.filter((i) => i.escalation_level >= 2).length;

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-red-700/30 to-orange-500/20 border border-red-500/30">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </span>
            SLA & Escalation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Overdue incidents, SLA compliance, and escalation management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            className="glass-button rounded-full p-2 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/command-center"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold glass-button text-slate-300 hover:text-white"
          >
            ← Command Center
          </Link>
        </div>
      </div>

      {/* ── SLA Summary Cards ─────────────────────────────────────────── */}
      {slaStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <div className="text-2xl font-extrabold font-mono">{slaStats.compliance_pct}%</div>
            <div className="text-xs text-slate-400">SLA Compliance</div>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <Timer className="w-5 h-5 text-red-400" />
            <div className="text-2xl font-extrabold font-mono text-red-400">{slaStats.overdue_count}</div>
            <div className="text-xs text-slate-400">Overdue Incidents</div>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <Flame className="w-5 h-5 text-orange-400" />
            <div className="text-2xl font-extrabold font-mono text-orange-400">{criticalEscalated}</div>
            <div className="text-xs text-slate-400">L2+ Escalated</div>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div className="text-2xl font-extrabold font-mono">{slaStats.avg_resolution_h}h</div>
            <div className="text-xs text-slate-400">Avg Resolution Time</div>
          </div>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Escalation Table */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Escalation Queue
            {escalated.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-900/40 text-red-300 rounded-full font-semibold border border-red-500/30">
                {escalated.length}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : escalated.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="text-lg font-bold text-emerald-400">All Clear</div>
              <p className="text-sm text-slate-400">No overdue or escalated incidents.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {escalated.map((inc, i) => (
                <motion.div
                  key={inc.incident_id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card rounded-xl p-4 border ${
                    inc.escalation_level >= 2
                      ? "border-red-500/25"
                      : inc.is_overdue
                      ? "border-orange-500/20"
                      : "border-white/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <RiskBadge
                      level={
                        (inc.risk_score >= 81
                          ? "critical"
                          : inc.risk_score >= 56
                          ? "high"
                          : inc.risk_score >= 31
                          ? "medium"
                          : "low") as RiskLevel
                      }
                      score={inc.risk_score}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-amber-400 font-semibold text-sm">
                          {inc.incident_id}
                        </span>
                        <SeverityChip severity={inc.severity} />
                        <EscalationBadge level={inc.escalation_level} />
                        {inc.is_overdue && <OverdueBadge hours={inc.hours_overdue} />}
                      </div>
                      <div className="text-sm font-medium capitalize">
                        {(inc.issue_type || "").replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{inc.location_name}</div>

                      {/* SLA Breach Bar */}
                      {inc.is_overdue && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>SLA breach severity</span>
                            <span>{Math.min(100, inc.sla_breach_pct).toFixed(0)}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                              style={{ width: `${Math.min(100, inc.sla_breach_pct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Link
                        href={`/incidents/${inc.incident_id}`}
                        className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        View <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => setEscalateTarget(inc)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-red-900/30 text-red-300 border border-red-500/30 hover:bg-red-900/50 transition font-medium flex items-center gap-1"
                      >
                        <ChevronUp className="w-3 h-3" />
                        Escalate
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* SLA Department Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            SLA by Department
          </h2>

          {slaStats?.dept_breakdown ? (
            <div className="space-y-3">
              {Object.entries(slaStats.dept_breakdown).map(([dept, stats]) => (
                <div key={dept} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="text-sm font-medium leading-tight">{dept}</div>
                  <SLABar
                    value={stats.compliance_pct}
                    label="Compliance"
                    color="from-purple-500 to-blue-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{stats.total} incidents</span>
                    <span className="text-red-400">{stats.overdue} overdue</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-4 text-slate-500 text-xs">
              No SLA data available
            </div>
          )}

          {/* Escalation Level Legend */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Escalation Levels
            </div>
            <div className="space-y-2">
              {escalationLevelMeta.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.color}`}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 border-t border-white/5 pt-2">
              SLA deadlines: Critical 4h · High 12h · Medium 24h · Low 72h
            </p>
          </div>
        </div>
      </div>

      {/* ── Escalate Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {escalateTarget && (
          <EscalateModal
            incident={escalateTarget}
            onClose={() => setEscalateTarget(null)}
            onSuccess={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import {
  HardHat,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Navigation,
  Zap,
  AlertTriangle,
  Layers,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FieldIncident {
  incident_id: string;
  issue_type: string;
  category: string;
  severity: string;
  risk_score: number;
  location_name: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  segmentation_mask_url?: string;
  affected_area_estimate?: number;
  recommended_actions: string[];
  status: string;
  created_at: string;
}

interface Worker {
  worker_id: string;
  name: string;
  team: string;
  status: string;
  assigned_incident_id?: string;
  current_task_status?: string;
  current_incident?: FieldIncident;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FLOW = ["assigned", "accepted", "on_the_way", "in_progress", "completed"];

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  assigned:    { label: "Assigned",      icon: Layers,      color: "text-blue-400" },
  accepted:    { label: "Accepted",      icon: CheckCircle2, color: "text-cyan-400" },
  on_the_way:  { label: "On the Way",    icon: Navigation,  color: "text-amber-400" },
  in_progress: { label: "In Progress",   icon: Zap,         color: "text-orange-400" },
  completed:   { label: "Completed",     icon: CheckCircle2, color: "text-emerald-400" },
};

const DEMO_WORKERS = [
  { id: "W001", label: "Raju Sharma — Team Alpha" },
  { id: "W002", label: "Priya Mehta — Team Bravo" },
  { id: "W003", label: "Vikram Singh — Team Alpha" },
  { id: "W004", label: "Deepa Nair — Team Charlie" },
  { id: "W005", label: "Arjun Patel — Team Delta" },
  { id: "W006", label: "Sunita Rao — Team Bravo" },
];

// ─── Status Stepper ──────────────────────────────────────────────────────────

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => {
        const meta = STATUS_META[s];
        const Icon = meta.icon;
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isPending = i > currentIdx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500"
                    : isCurrent
                    ? `bg-amber-500/20 border-amber-400 ${meta.color}`
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Icon className={`w-4 h-4 ${isCurrent ? meta.color : "text-slate-600"}`} />
                )}
              </div>
              <span
                className={`text-[9px] text-center leading-tight font-medium ${
                  isCurrent ? "text-amber-400" : isDone ? "text-emerald-400" : "text-slate-600"
                }`}
              >
                {meta.label}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-4 transition-all ${
                  isDone ? "bg-emerald-500" : "bg-slate-700"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FieldWorkerPage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("W001");
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceMsg, setAdvanceMsg] = useState<string | null>(null);

  const fetchWorker = useCallback(async (id: string) => {
    setLoading(true);
    setAdvanceMsg(null);
    try {
      const res = await fetch(`/api/field/workers/${id}`);
      if (res.ok) setWorker(await res.json());
    } catch (e) {
      console.error("Field fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorker(selectedWorkerId);
  }, [selectedWorkerId, fetchWorker]);

  const advanceStatus = async () => {
    if (!worker) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/field/workers/${worker.worker_id}/advance-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setAdvanceMsg(`Status advanced to: ${data.new_task_status?.replace(/_/g, " ") ?? "updated"}`);
        setTimeout(() => {
          setAdvanceMsg(null);
          fetchWorker(worker.worker_id);
        }, 1200);
      }
    } catch (e) {
      console.error("Advance error", e);
    } finally {
      setAdvancing(false);
    }
  };

  const currentStatus = worker?.current_task_status ?? "assigned";
  const incident = worker?.current_incident;
  const isCompleted = currentStatus === "completed";
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(currentStatus) + 1];

  return (
    <div className="space-y-8 pb-12 max-w-2xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-600/30 to-yellow-500/20 border border-amber-500/30">
            <HardHat className="w-7 h-7 text-amber-400" />
          </span>
          Field Worker Interface
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Active task assignment, status workflow, and recommended actions
        </p>
      </div>

      {/* ── Worker Selector ──────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5">
        <label className="text-xs text-slate-400 mb-2 block font-medium">Select Worker / Log In As</label>
        <select
          value={selectedWorkerId}
          onChange={(e) => setSelectedWorkerId(e.target.value)}
          className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
        >
          {DEMO_WORKERS.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : !worker ? (
        <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
          Worker not found
        </div>
      ) : (
        <>
          {/* ── Worker Info ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-slate-950 shrink-0">
              {worker.name?.[0] ?? "?"}
            </div>
            <div className="flex-1">
              <div className="font-bold">{worker.name}</div>
              <div className="text-xs text-slate-400">{worker.team}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  worker.status === "available"
                    ? "bg-emerald-400"
                    : worker.status === "on_duty"
                    ? "bg-amber-400"
                    : "bg-blue-400"
                }`}
              />
              <span className="text-xs font-medium capitalize text-slate-300">
                {worker.status?.replace("_", " ") ?? ""}
              </span>
            </div>
          </motion.div>

          {/* ── Assignment Card ─────────────────────────────────────── */}
          {!incident ? (
            <div className="glass-card rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-lg font-bold text-emerald-400">No Active Assignment</div>
              <p className="text-sm text-slate-400">
                You currently have no task assigned. Await the next assignment from Command Center.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* Image Header */}
              <div className="relative h-48 bg-slate-800">
                {incident.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={incident.image_url}
                    alt="Incident"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Layers className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-amber-400 font-bold text-lg">
                      {incident.incident_id}
                    </span>
                    <SeverityChip severity={incident.severity} />
                    <RiskBadge
                      level={(incident.risk_score >= 81 ? "critical" : incident.risk_score >= 56 ? "high" : incident.risk_score >= 31 ? "medium" : "low") as RiskLevel}
                      score={incident.risk_score}
                    />
                  </div>
                  <div className="text-sm text-white font-semibold mt-1">
                    {(incident.issue_type || "").replace(/_/g, " ").toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{incident.location_name}</div>
                    {incident.latitude && incident.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"
                      >
                        <Navigation className="w-3 h-3" /> Navigate →
                      </a>
                    )}
                  </div>
                </div>

                {/* Affected Area */}
                {incident.affected_area_estimate && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="text-sm">
                      Estimated affected area:{" "}
                      <span className="font-bold text-orange-400">
                        {incident.affected_area_estimate} m²
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Stepper */}
                <div className="pt-2 border-t border-white/5">
                  <div className="text-xs text-slate-400 mb-3 font-medium">Current Status</div>
                  <StatusStepper currentStatus={currentStatus} />
                </div>

                {/* Recommended Actions */}
                {incident.recommended_actions?.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-xs text-slate-400 mb-3 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Recommended Actions
                    </div>
                    <ol className="space-y-2">
                      {incident.recommended_actions.map((action, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Advance Status CTA */}
                <div className="border-t border-white/5 pt-4">
                  {advanceMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-3 p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-sm text-center"
                    >
                      ✅ {advanceMsg}
                    </motion.div>
                  )}

                  {isCompleted ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">
                        Task Complete — Awaiting AI Verification
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={advanceStatus}
                      disabled={advancing}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {advancing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          Advance to:{" "}
                          {nextStatus
                            ? STATUS_META[nextStatus]?.label
                            : "Complete"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Refresh */}
          <button
            onClick={() => fetchWorker(selectedWorkerId)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm glass-button text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        </>
      )}
    </div>
  );
}

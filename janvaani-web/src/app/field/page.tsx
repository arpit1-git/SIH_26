"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Upload,
  Camera,
  Compass,
  Check,
  Award,
  AlertCircle,
  FileCheck
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
  before_image_url?: string;
  after_image_url?: string;
  segmentation_mask_url?: string;
  affected_area_estimate?: number;
  recommended_actions: string[];
  status: string;
  verification_status?: string;
  verification_reduction_pct?: number;
  verification_confidence?: number;
  outcome_label?: string;
  outcome_emoji?: string;
  created_at: string;
}

interface Worker {
  worker_id: string;
  name: string;
  team: string;
  status: string;
  latitude?: number;
  longitude?: number;
  assigned_incident_id?: string;
  current_task_status?: string;
  current_incident?: FieldIncident;
}

interface RouteStep {
  instruction: string;
  distance_km: number;
  duration_min: number;
  location: [number, number];
}

interface RouteSummary {
  total_distance_km: number;
  total_duration_min: number;
  provider: string;
}

interface RouteData {
  success: boolean;
  solver: string;
  worker_location: [number, number];
  total_stops: number;
  route_summary: RouteSummary;
  navigation_steps: RouteStep[];
  ordered_incidents: FieldIncident[];
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

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function FieldWorkerPage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("W001");
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceMsg, setAdvanceMsg] = useState<string | null>(null);

  // Routing State
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);
  const [showRouteDrawer, setShowRouteDrawer] = useState(false);

  // After Evidence State
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const fetchWorker = useCallback(async (id: string) => {
    setLoading(true);
    setAdvanceMsg(null);
    setVerificationResult(null);
    try {
      const res = await fetch(`/api/field/workers/${id}`);
      if (res.ok) setWorker(await res.json());
    } catch (e) {
      console.error("Field worker fetch error", e);
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
        setAdvanceMsg(`Status advanced to: ${data.current_status?.replace(/_/g, " ") ?? "updated"}`);
        setTimeout(() => {
          setAdvanceMsg(null);
          fetchWorker(worker.worker_id);
        }, 1200);
      }
    } catch (e) {
      console.error("Advance status error", e);
    } finally {
      setAdvancing(false);
    }
  };

  const computeRoute = async () => {
    if (!worker) return;
    setFetchingRoute(true);
    try {
      const res = await fetch(`/api/field/workers/${worker.worker_id}/route`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
        setShowRouteDrawer(true);
      }
    } catch (e) {
      console.error("Compute route error", e);
    } finally {
      setFetchingRoute(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const submitAfterEvidence = async () => {
    if (!worker?.current_incident) return;
    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      if (afterFile) {
        formData.append("file", afterFile);
      }

      const res = await fetch(
        `/api/field/incidents/${worker.current_incident.incident_id}/after-evidence`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        setTimeout(() => {
          fetchWorker(worker.worker_id);
        }, 2000);
      }
    } catch (e) {
      console.error("After evidence error", e);
    } finally {
      setUploadingEvidence(false);
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
          Field Worker Portal
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          O-SRM Routing, OR-Tools Multi-Stop Optimization & Computer Vision Verification
        </p>
      </div>

      {/* ── Worker Selector ──────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5">
        <label className="text-xs text-slate-400 mb-2 block font-medium">Select Active Worker / Duty Shift</label>
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
            className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-slate-950 shrink-0">
                {worker.name?.[0] ?? "?"}
              </div>
              <div>
                <div className="font-bold text-white text-base">{worker.name}</div>
                <div className="text-xs text-slate-400">{worker.team}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={computeRoute}
                disabled={fetchingRoute}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition flex items-center gap-1.5"
              >
                {fetchingRoute ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                )}
                Route & TSP
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10">
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
            </div>
          </motion.div>

          {/* ── Route Navigation Drawer / Modal ────────────────────── */}
          <AnimatePresence>
            {showRouteDrawer && routeData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-slate-900/90 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-cyan-300 text-sm">
                      Navigation & TSP Dispatch Route ({routeData.solver})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowRouteDrawer(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 font-medium uppercase">Distance</div>
                    <div className="text-lg font-bold text-amber-400">
                      {routeData.route_summary?.total_distance_km} km
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 font-medium uppercase">ETA</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {routeData.route_summary?.total_duration_min} min
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                    <div className="text-[10px] text-slate-400 font-medium uppercase">Provider</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1">
                      {routeData.route_summary?.provider}
                    </div>
                  </div>
                </div>

                {/* Turn by Turn Instructions */}
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    Street Navigation Guidance
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {routeData.navigation_steps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-xs flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          {step.instruction}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0">
                          {step.distance_km} km ({step.duration_min}m)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    <div className="text-sm font-medium text-white">{incident.location_name}</div>
                    {incident.latitude && incident.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${incident.latitude},${incident.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"
                      >
                        <Navigation className="w-3 h-3" /> Navigate via Google Maps →
                      </a>
                    )}
                  </div>
                </div>

                {/* Affected Area */}
                {incident.affected_area_estimate && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="text-sm text-slate-300">
                      Estimated affected area:{" "}
                      <span className="font-bold text-orange-400">
                        {incident.affected_area_estimate} m²
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Stepper */}
                <div className="pt-2 border-t border-white/5">
                  <div className="text-xs text-slate-400 mb-3 font-medium">Current Workflow Status</div>
                  <StatusStepper currentStatus={currentStatus} />
                </div>

                {/* Recommended Actions */}
                {incident.recommended_actions?.length > 0 && (
                  <div className="border-t border-white/5 pt-4">
                    <div className="text-xs text-slate-400 mb-3 font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Recommended SOP Actions
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

                {/* Advance Status & Evidence Upload CTA */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  {advanceMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 text-sm text-center"
                    >
                      ✅ {advanceMsg}
                    </motion.div>
                  )}

                  {isCompleted ? (
                    <div className="space-y-4">
                      {/* After Evidence Upload Form */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-bold text-amber-300">
                            Submit After-Cleanup Evidence Photo
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Upload clear photo evidence of the site after completion for AI Computer Vision verification.
                        </p>

                        <div className="flex items-center gap-3">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-slate-950/60 hover:border-amber-400 transition text-xs font-semibold text-slate-300">
                            <Upload className="w-4 h-4 text-amber-400" />
                            {afterFile ? afterFile.name : "Select or Take Photo"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {previewUrl && (
                          <div className="relative h-36 rounded-xl overflow-hidden border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt="After Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <button
                          onClick={submitAfterEvidence}
                          disabled={uploadingEvidence}
                          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:brightness-110 transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {uploadingEvidence ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <FileCheck className="w-4 h-4" />
                              Submit & Run Computer Vision Verification
                            </>
                          )}
                        </button>
                      </div>

                      {/* Verification Results Display */}
                      {verificationResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                              <span>{verificationResult.outcome_emoji}</span>
                              {verificationResult.outcome_label}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                              {(verificationResult.verification_confidence * 100).toFixed(0)}% AI Confidence
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                              <div className="text-[10px] text-slate-400">Area Reduction</div>
                              <div className="text-base font-extrabold text-emerald-400">
                                {verificationResult.verification_reduction_pct}%
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                              <div className="text-[10px] text-slate-400">Current Status</div>
                              <div className="text-xs font-bold text-cyan-300 capitalize mt-1">
                                {verificationResult.status}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-emerald-200/90 text-center font-medium">
                            {verificationResult.message}
                          </p>
                        </motion.div>
                      )}
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
                          Advance Status to:{" "}
                          {nextStatus
                            ? STATUS_META[nextStatus]?.label
                            : "Complete Task"}
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
            Refresh Worker Duty Status
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExplainableScoreCard, FactorBreakdown } from "@/components/ui/ExplainableScoreCard";
import { NearbyFacilitiesCard, FacilityItem } from "@/components/ui/NearbyFacilitiesCard";
import { RiskBadge, RiskLevel } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import {
  MapPin,
  Clock,
  ThumbsUp,
  MessageSquare,
  Share2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  Zap,
  RefreshCw,
  Building,
} from "lucide-react";

interface CommentItem {
  comment_id?: string;
  id?: string;
  author_name: string;
  text: string;
  created_at: string;
}

interface RecommendedActionItem {
  step: number;
  title: string;
  action: string;
  department: string;
  priority: string;
}

interface IncidentDetail {
  incident_id: string;
  issue_type: string;
  category: string;
  severity: string;
  level: string;
  risk_score: number;
  civic_impact_score: number;
  evidence_score: number;
  evidence_confidence?: {
    label: string;
    tier: string;
    color: string;
    description: string;
  };
  latitude: number;
  longitude: number;
  location_name: string;
  address?: string;
  ward_number?: number;
  complaint_count: number;
  support_count: number;
  like_count: number;
  complaint_velocity: number;
  recurrence_count: number;
  is_hotspot?: boolean;
  assigned_authority?: string;
  assigned_department?: string;
  assigned_team?: string;
  status: string;
  sla_deadline?: string;
  image_url: string;
  segmentation_mask_url?: string;
  affected_area_estimate?: number;
  created_at: string;
  updated_at: string;
  explanation_bullets?: string[];
  nearby_facilities?: FacilityItem[];
  recommended_actions?: RecommendedActionItem[];
  comments?: CommentItem[];
}

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = (params?.id as string) || "JV-1042";

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [supported, setSupported] = useState<boolean>(false);
  const [supportLoading, setSupportLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [explanationData, setExplanationData] = useState<any>(null);

  useEffect(() => {
    fetchIncidentData();
    fetchExplanation();
  }, [incidentId]);

  const fetchIncidentData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}`);
      if (res.ok) {
        const data = await res.json();
        setIncident(data);
      }
    } catch (err) {
      console.error("Failed to load incident details", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExplanation = async () => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/explanation`);
      if (res.ok) {
        const data = await res.json();
        setExplanationData(data);
      }
    } catch (err) {
      console.error("Failed to load explainability data", err);
    }
  };

  const handleSupport = async () => {
    if (supported || supportLoading || !incident) return;
    setSupportLoading(true);

    // Optimistic UI update
    setIncident((prev) =>
      prev
        ? {
            ...prev,
            support_count: prev.support_count + 1,
            risk_score: Math.min(100, prev.risk_score + 2.5),
            civic_impact_score: Math.min(100, prev.civic_impact_score + 3.0),
            complaint_velocity: Number((prev.complaint_velocity + 0.3).toFixed(1)),
          }
        : prev
    );
    setSupported(true);

    try {
      const res = await fetch(`/api/incidents/${incidentId}/support`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        if (result.new_risk_score) {
          setIncident((prev) =>
            prev
              ? {
                  ...prev,
                  risk_score: result.new_risk_score,
                  civic_impact_score: result.new_civic_impact,
                  level: result.level,
                }
              : prev
          );
        }
        fetchExplanation();
      }
    } catch (err) {
      console.error("Support failed", err);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/incidents/${incidentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newCommentText.trim(),
          author_name: authorName.trim() || "Local Resident",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setIncident((prev) =>
          prev
            ? {
                ...prev,
                comments: [...(prev.comments || []), result.comment],
              }
            : prev
        );
        setNewCommentText("");
      }
    } catch (err) {
      console.error("Add comment failed", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading && !incident) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading Civic Incident {incidentId}...</p>
      </div>
    );
  }

  const fallbackIncident: IncidentDetail = {
    incident_id: incidentId,
    issue_type: "waterlogging",
    category: "waterlogging",
    severity: "critical",
    level: "critical",
    risk_score: 94.0,
    civic_impact_score: 91.0,
    evidence_score: 0.94,
    evidence_confidence: {
      label: "High Confidence",
      tier: "high",
      color: "emerald",
      description: "Strong computer vision detection cross-validated with historical blackspot records.",
    },
    latitude: 28.6139,
    longitude: 77.209,
    location_name: "MG Road Arterial Underpass, Ward 12",
    complaint_count: 18,
    support_count: 42,
    like_count: 15,
    complaint_velocity: 3.2,
    recurrence_count: 5,
    is_hotspot: true,
    assigned_authority: "Municipal Corporation Central Zone",
    assigned_department: "Stormwater Drainage & Flood Control",
    assigned_team: "Rapid Emergency Response Squad #2",
    status: "open",
    image_url: "/ui_themes/water1.jpg",
    segmentation_mask_url: "/api/ai/mock-mask?type=waterlogging&seed=42",
    affected_area_estimate: 85.0,
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    explanation_bullets: [
      "18 independent citizen complaints logged in the last 45 minutes with active community support.",
      "Accelerating report velocity: influx rate of 3.2 reports/hour (+320% surge rate).",
      "Severe surface water accumulation (85 m²) causing vehicular stalling on arterial transit corridor.",
      "Emergency hazard: Major Trauma Hospital located within 320m perimeter.",
      "Flagged as a Chronic Blackspot with 5 prior flooding incidents in the last 90 days.",
    ],
    nearby_facilities: [
      { facility_type: "hospital", name: "Central District Trauma Hospital", distance_meters: 320.0 },
      { facility_type: "school", name: "Govt Senior Secondary Model School", distance_meters: 180.0 },
      { facility_type: "arterial_road", name: "Main Arterial Transit Ring Road", distance_meters: 50.0 },
      { facility_type: "storm_drain", name: "Primary Outfall Stormwater Channel #4", distance_meters: 120.0 },
    ],
  };

  const inc = incident || fallbackIncident;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-1.5 rounded-xl bg-white/5 border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "Link Copied!" : "Share Incident"}</span>
          </button>

          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Priority Inbox</span>
          </Link>
        </div>
      </div>

      {/* Incident Hero Header (PRD §26) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                {inc.incident_id}
              </span>
              <SeverityChip issueType={inc.issue_type} size="md" />
              <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold bg-white/10 text-slate-200 border border-white/10 uppercase">
                Status: {inc.status}
              </span>
              {inc.is_hotspot && (
                <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  ⚠️ Chronic Blackspot ({inc.recurrence_count}x in 90d)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {inc.issue_type.replace(/_/g, " ").toUpperCase()} at {inc.location_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{inc.location_name}</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Reported {new Date(inc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </span>
              <span className="flex items-center gap-1 text-cyan-400 font-mono font-semibold">
                <span>⚡ {inc.complaint_velocity} reports/hr influx</span>
              </span>
            </div>
          </div>

          {/* Citizen Support CTA ("I am also affected") */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={handleSupport}
              disabled={supported || supportLoading}
              className={`px-6 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2 transform active:scale-95 ${
                supported
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 glow-theme"
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${supported ? "text-white" : "text-slate-950"}`} />
              <span>{supported ? "Support Registered!" : "I Am Also Affected"}</span>
              <span className="px-2 py-0.5 rounded-full bg-black/20 text-[11px] font-mono font-bold">
                {inc.support_count}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Escalates municipal priority without creating duplicate tickets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Media Viewer + AI Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Visual Evidence & Segmentation (PRD §11 & §26) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Visual Evidence & Instance Segmentation</h3>
              </div>

              {/* Mask Overlay Toggle Button */}
              <button
                onClick={() => setShowMask(!showMask)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition flex items-center gap-1.5 ${
                  showMask
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Mask: {showMask ? "ON" : "OFF"}</span>
              </button>
            </div>

            {/* Dual Layer Image Container */}
            <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
              {/* Base Image */}
              <Image
                src={inc.image_url || "/ui_themes/waste1.jpg"}
                alt={inc.issue_type}
                fill
                unoptimized
                className="object-cover"
              />

              {/* Segmentation Mask Overlay */}
              {showMask && inc.segmentation_mask_url && (
                <div className="absolute inset-0 z-10 pointer-events-none mix-blend-screen opacity-90 transition-opacity duration-300">
                  <Image
                    src={inc.segmentation_mask_url}
                    alt="Segmentation Mask"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              {/* Footprint badge overlay */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-slate-200">
                <span className="font-mono text-amber-400 font-bold">~{inc.affected_area_estimate || 45} m²</span>
                <span className="text-slate-400 text-[11px]">Affected Surface Area</span>
              </div>
            </div>

            {/* Evidence Reliability Badge (PRD §21) */}
            {inc.evidence_confidence && (
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/10 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-100">{inc.evidence_confidence.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {Math.round(inc.evidence_score * 100)}% Model Confidence
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{inc.evidence_confidence.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Critical Facilities (PRD §19) */}
          <NearbyFacilitiesCard facilities={inc.nearby_facilities || []} />

          {/* Recommended Municipal Actions (PRD §34) */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Recommended Municipal Operational Actions</h3>
                  <p className="text-[11px] text-slate-400">AI Decision Support for Municipal Response Teams (PRD §34)</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Decision Support
              </span>
            </div>

            <div className="space-y-3">
              {(explanationData?.recommended_actions || inc.recommended_actions || []).map(
                (act: RecommendedActionItem, index: number) => (
                  <div
                    key={index}
                    className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {act.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-100">{act.title}</h5>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 uppercase">
                          {act.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{act.action}</p>
                      <span className="text-[10px] text-amber-400/80 font-mono block">Dept: {act.department}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Explainable AI Breakdown & Community Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Explainable AI Scoring Card (PRD §15–§17) */}
          <ExplainableScoreCard
            riskScore={inc.risk_score}
            civicImpactScore={inc.civic_impact_score}
            severityLevel={inc.level || inc.severity}
            summary={
              explanationData?.summary ||
              `Incident ${inc.incident_id} is prioritized at ${inc.risk_score}/100 Risk and ${inc.civic_impact_score}/100 Civic Impact due to multi-signal civic escalation at ${inc.location_name}.`
            }
            bullets={explanationData?.explanation_bullets || inc.explanation_bullets || []}
            factors={explanationData?.factor_breakdowns || []}
            velocity={inc.complaint_velocity}
          />

          {/* Assigned Municipal Team Card */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Assigned Municipal Authority</h3>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-200 font-semibold">{inc.assigned_department || "Sanitation & Solid Waste"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Team:</span>
                <span className="text-amber-400 font-mono font-semibold">{inc.assigned_team || "Rapid Squad #1"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zone / Ward:</span>
                <span className="text-slate-200">Ward {inc.ward_number || 12} (Central Zone)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-slate-400">SLA Window:</span>
                <span className="text-emerald-400 font-mono font-bold">Within 2 Hours</span>
              </div>
            </div>
          </div>

          {/* Community Discussion & Comments Section */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Community Activity & Comments</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {(inc.comments || []).length} Comments
              </span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              <input
                type="text"
                placeholder="Your Name (Optional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share details or updates on this problem..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(inc.comments || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No comments yet. Be the first to share an update.
                </p>
              ) : (
                (inc.comments || []).map((c, i) => (
                  <div key={i} className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-200">{c.author_name || "Resident"}</span>
                      <span className="font-mono text-[10px]">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

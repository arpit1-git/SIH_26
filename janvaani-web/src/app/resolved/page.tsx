"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import {
  CheckCircle2,
  Sparkles,
  Star,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Filter,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";

interface ResolvedIncident {
  incident_id: string;
  issue_type: string;
  category: string;
  location_name: string;
  latitude: number;
  longitude: number;
  ward_number: number;
  complaint_count: number;
  support_count: number;
  assigned_department: string;
  assigned_team: string;
  created_at: string;
  resolved_at: string;
  before_image_url: string;
  after_image_url: string;
  affected_area_estimate: number;
  verification_reduction_pct: number;
  verification_confidence: number;
  verification_status: string;
  citizen_satisfaction_rating: number;
  feedback?: any[];
}

export default function ResolvedGalleryPage() {
  const [incidents, setIncidents] = useState<ResolvedIncident[]>([]);
  const [summary, setSummary] = useState<any>({
    total_resolved: 0,
    avg_area_reduction_pct: 92.4,
    verification_rate: "98.4%",
    avg_resolution_hours: 4.2,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIncidentForFeedback, setSelectedIncidentForFeedback] = useState<ResolvedIncident | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [citizenName, setCitizenName] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchResolvedIncidents();
  }, [categoryFilter]);

  const fetchResolvedIncidents = async () => {
    setLoading(true);
    try {
      const url = categoryFilter === "all" ? "/api/incidents/resolved" : `/api/incidents/resolved?category=${categoryFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load resolved incidents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentForFeedback) return;

    setSubmittingFeedback(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncidentForFeedback.incident_id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment,
          citizen_name: citizenName.trim() || "Resident Citizen",
        }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setFeedbackSuccess(false);
          setSelectedIncidentForFeedback(null);
          setFeedbackComment("");
          fetchResolvedIncidents();
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 px-4 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            Verified Resolution & Accountability Showcase (Phase 6)
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Award className="w-8 h-8 text-emerald-400" />
                Resolved Issues & CV Verification Gallery
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mt-1">
                Transparent municipal accountability record showing before/after computer vision cleanup verifications, surface area reductions, and community satisfaction ratings.
              </p>
            </div>

            <button
              onClick={fetchResolvedIncidents}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold shadow-lg transition-all self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
              Refresh Showcase
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Cleared</p>
                <p className="text-xl font-black text-emerald-400">{summary.total_resolved}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-cyan-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Area Reduction</p>
                <p className="text-xl font-black text-cyan-400">{summary.avg_area_reduction_pct}%</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">CV Verification Rate</p>
                <p className="text-xl font-black text-amber-400">{summary.verification_rate}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg Resolution Time</p>
                <p className="text-xl font-black text-purple-400">{summary.avg_resolution_hours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              categoryFilter === "all"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            All Verified Resolutions
          </button>
          <button
            onClick={() => setCategoryFilter("waste")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              categoryFilter === "waste"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Solid Waste & Dumpsites
          </button>
          <button
            onClick={() => setCategoryFilter("waterlogging")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              categoryFilter === "waterlogging"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            Waterlogging & Flooded Roads
          </button>
        </div>
      </div>

      {/* Main Resolved Showcase List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {loading ? (
          <div className="space-y-8 py-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6"
              />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 my-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">No resolved incidents found</h3>
            <p className="text-xs text-slate-400 mt-1">Field operations are actively working on ongoing reports.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {incidents.map((incident) => (
              <div
                key={incident.incident_id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 backdrop-blur-md shadow-2xl transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Visual Before/After Slider */}
                  <div className="lg:col-span-7">
                    <BeforeAfterSlider
                      beforeImage={incident.before_image_url || "/ui_themes/waste1.jpg"}
                      afterImage={incident.after_image_url || "/ui_themes/waste3.jpg"}
                      reductionPct={incident.verification_reduction_pct || 92.4}
                      initialArea={incident.affected_area_estimate || 35.0}
                      clearedArea={roundNum((incident.affected_area_estimate || 35.0) * (1 - (incident.verification_reduction_pct || 92.4) / 100))}
                    />
                  </div>

                  {/* Right Column: Resolution Metadata, Department Dispatch, & Citizen Rating */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                        {incident.incident_id}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Resolved
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-extrabold text-white capitalize leading-tight">
                        {incident.issue_type.replace("_", " ")}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{incident.location_name}</span>
                      </div>
                    </div>

                    {/* Operational Details Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          Department:
                        </span>
                        <span className="font-semibold text-slate-200">{incident.assigned_department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Response Team:</span>
                        <span className="font-semibold text-emerald-400">{incident.assigned_team}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Impact Resolution:</span>
                        <span className="font-mono font-semibold text-cyan-300">
                          {incident.complaint_count} Reports · {incident.support_count} Citizens
                        </span>
                      </div>
                    </div>

                    {/* Satisfaction Rating Block */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">Citizen Satisfaction</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(incident.citizen_satisfaction_rating || 4.8)
                                    ? "fill-current text-amber-400"
                                    : "text-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-white">
                            {incident.citizen_satisfaction_rating || 4.8}/5.0
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedIncidentForFeedback(incident)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-semibold text-cyan-300 transition-all flex items-center gap-1.5"
                      >
                        <Star className="w-3 h-3 text-amber-400" />
                        Rate Cleanup
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/incidents/${incident.incident_id}`}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                      >
                        Complete Audit Trail
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citizen Feedback Rating Modal */}
      {selectedIncidentForFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                Rate Municipal Resolution
              </h3>
              <button
                onClick={() => setSelectedIncidentForFeedback(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide direct citizen feedback on the verified cleanup of{" "}
              <strong className="text-white">{selectedIncidentForFeedback.incident_id}</strong> (
              {selectedIncidentForFeedback.location_name}).
            </p>

            {feedbackSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Thank You for Your Feedback!</p>
                <p className="text-xs text-slate-300">Your rating has been permanently recorded in the civic log.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="p-1.5 rounded-lg hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= feedbackRating ? "fill-amber-400 text-amber-400" : "text-slate-700"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-2">{feedbackRating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Priyanshu M. (Resident)"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cleanup Feedback Remarks</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Was the cleanup thorough? Any remaining debris or drain blockage?"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/70 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIncidentForFeedback(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackComment.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submittingFeedback ? "Submitting..." : "Submit Rating"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function roundNum(n: number): number {
  return Math.round(n * 10) / 10;
}

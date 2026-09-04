"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Flame,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Share2,
  Heart,
  ExternalLink,
  MapPin,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Check,
  Zap,
} from "lucide-react";

interface NewsBulletin {
  id: string;
  incident_id: string;
  type: "alert" | "trending" | "resolved" | "hotspot";
  badge: string;
  badge_color: "rose" | "amber" | "emerald" | "purple";
  headline: string;
  summary_ai: string;
  location_name: string;
  timestamp: string;
  image_url: string;
  before_image_url?: string;
  after_image_url?: string;
  reduction_pct?: number;
  metrics?: Record<string, any>;
  likes_count: number;
  shares_count: number;
  status: string;
}

export default function CivicNewsPage() {
  const [bulletins, setBulletins] = useState<NewsBulletin[]>([]);
  const [summary, setSummary] = useState<any>({
    total_bulletins: 0,
    critical_alerts: 0,
    trending_surges: 0,
    resolved_spotlights: 0,
    chronic_hotspots: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [filterType]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const url = filterType === "all" ? "/api/news" : `/api/news?bulletin_type=${filterType}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBulletins(data.bulletins || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load civic news", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (bId: string) => {
    setLikedMap((prev) => ({ ...prev, [bId]: !prev[bId] }));
    setBulletins((prev) =>
      prev.map((b) => {
        if (b.id === bId) {
          return {
            ...b,
            likes_count: likedMap[bId] ? b.likes_count - 1 : b.likes_count + 1,
          };
        }
        return b;
      })
    );

    try {
      await fetch(`/api/news/${bId}/like`, { method: "POST" });
    } catch (err) {
      console.error("Failed to like bulletin", err);
    }
  };

  const handleShare = async (bulletin: NewsBulletin) => {
    const shareData = {
      title: bulletin.headline,
      text: bulletin.summary_ai,
      url: `${window.location.origin}/incidents/${bulletin.incident_id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        await fetch(`/api/news/${bulletin.id}/share`, { method: "POST" });
      } catch {
        // Fallback to clipboard
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      setCopiedId(bulletin.id);
      setTimeout(() => setCopiedId(null), 2500);
      try {
        await fetch(`/api/news/${bulletin.id}/share`, { method: "POST" });
      } catch {}
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "Recent";
    }
  };

  const getBadgeStyle = (color: string) => {
    switch (color) {
      case "rose":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/40";
      case "amber":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-950/40";
      case "emerald":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/40";
      case "purple":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-purple-950/40";
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 px-4 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            Autonomous AI Civic Broadcast & Social Pulse (Phase 6)
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-cyan-400" />
                AI Civic News & Social Feed
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mt-1">
                Real-time human-readable civic bulletins automatically compiled from computer vision detections, community velocity surges, and certified cleanup verifications.
              </p>
            </div>

            <button
              onClick={fetchNews}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold shadow-lg transition-all self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
              Refresh Feed
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Emergency Alerts</p>
                <p className="text-xl font-black text-rose-400">{summary.critical_alerts}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Trending Surges</p>
                <p className="text-xl font-black text-amber-400">{summary.trending_surges}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Verified Cleared</p>
                <p className="text-xl font-black text-emerald-400">{summary.resolved_spotlights}</p>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-md shadow-lg flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Chronic Blackspots</p>
                <p className="text-xl font-black text-purple-400">{summary.chronic_hotspots}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              filterType === "all"
                ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            All Civic Updates
          </button>
          <button
            onClick={() => setFilterType("alert")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              filterType === "alert"
                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Critical Alerts 🚨
          </button>
          <button
            onClick={() => setFilterType("trending")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              filterType === "trending"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Trending Surges 📈
          </button>
          <button
            onClick={() => setFilterType("resolved")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              filterType === "resolved"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Resolved Spotlights ✨
          </button>
          <button
            onClick={() => setFilterType("hotspot")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
              filterType === "hotspot"
                ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20 font-bold"
                : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
            Blackspot Advisories ⚠️
          </button>
        </div>
      </div>

      {/* Main Bulletins Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-5 bg-slate-800 rounded-md w-1/3" />
                  <div className="h-6 bg-slate-800 rounded-md w-3/4" />
                  <div className="h-16 bg-slate-800/60 rounded-md w-full" />
                </div>
                <div className="h-10 bg-slate-800/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : bulletins.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 my-8">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">No bulletins for this filter</h3>
            <p className="text-xs text-slate-400 mt-1">Check back soon as autonomous civic AI compiles new reports.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bulletins.map((bulletin) => (
              <article
                key={bulletin.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/90 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Media Banner */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={bulletin.image_url}
                      alt={bulletin.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                    {/* Top Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-md ${getBadgeStyle(
                          bulletin.badge_color
                        )}`}
                      >
                        {bulletin.badge}
                      </span>
                    </div>

                    {/* Relative Timestamp */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 font-medium backdrop-blur-md">
                      {formatRelativeTime(bulletin.timestamp)}
                    </div>

                    {/* Location Tag */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs text-slate-200 truncate">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate drop-shadow">{bulletin.location_name}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-cyan-400 font-semibold">{bulletin.incident_id}</span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" />
                        AI-Generated Summary
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                      {bulletin.headline}
                    </h2>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {bulletin.summary_ai}
                    </p>

                    {/* Metrics Strip */}
                    {bulletin.metrics && (
                      <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                        {bulletin.metrics.risk_score && (
                          <span className="px-2 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                            Risk: <strong className="text-rose-400">{bulletin.metrics.risk_score}</strong>
                          </span>
                        )}
                        {bulletin.metrics.velocity_rate && (
                          <span className="px-2 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 font-mono">
                            Surge: <strong className="text-amber-400">{bulletin.metrics.velocity_rate}</strong>
                          </span>
                        )}
                        {bulletin.reduction_pct && (
                          <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono">
                            Cleared: <strong>{bulletin.reduction_pct}%</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-5 py-3.5 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(bulletin.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        likedMap[bulletin.id]
                          ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${likedMap[bulletin.id] ? "fill-current text-rose-400" : ""}`}
                      />
                      <span>{bulletin.likes_count}</span>
                    </button>

                    <button
                      onClick={() => handleShare(bulletin)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-all"
                    >
                      {copiedId === bulletin.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{bulletin.shares_count || "Share"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/incidents/${bulletin.incident_id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

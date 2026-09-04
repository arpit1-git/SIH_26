"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { IncidentCard, IncidentData } from "@/components/ui/IncidentCard";
import {
  PlusCircle,
  MapPin,
  Flame,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Cpu,
  TrendingUp,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Newspaper,
  Compass,
} from "lucide-react";

export default function Home() {
  const { currentTheme } = useTheme();
  const [stats, setStats] = useState({
    activeIncidents: 42,
    citizensImpacted: "18,400+",
    resolvedToday: 15,
    criticalPriority: 7,
  });

  // Recent Civic Incidents Feed
  const recentIncidents: IncidentData[] = [
    {
      id: "JV-1042",
      issueType: "waterlogging",
      severity: "critical",
      riskScore: 94,
      locationName: "MG Road Arterial Underpass, Ward 12",
      imageUrl: "/ui_themes/water1.jpg",
      supportCount: 42,
      commentCount: 18,
      createdAt: "12 mins ago",
    },
    {
      id: "JV-1038",
      issueType: "illegal_dumping",
      severity: "high",
      riskScore: 78,
      locationName: "Central Market Gate 4, Sector 7",
      imageUrl: "/ui_themes/waste2.jpg",
      supportCount: 29,
      commentCount: 9,
      createdAt: "45 mins ago",
    },
    {
      id: "JV-1029",
      issueType: "overflowing_bin",
      severity: "medium",
      riskScore: 48,
      locationName: "Bus Terminal Commercial Plaza",
      imageUrl: "/ui_themes/waste3.jpg",
      supportCount: 14,
      commentCount: 4,
      createdAt: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative pt-8 pb-12 flex flex-col items-center text-center space-y-6">
        {/* Active Theme Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-white/20 text-xs font-semibold"
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping"
            style={{ backgroundColor: currentTheme.accentColor }}
          />
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-200">Active Theme: {currentTheme.name}</span>
          <span className="text-[10px] font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded">
            {currentTheme.category.toUpperCase()}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          key={currentTheme.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl text-white leading-tight"
        >
          JANVAANI — <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400">See It. Report It. Resolve It.</span>
        </motion.h1>

        {/* Sub-tagline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          {currentTheme.description}
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-2xl glow-theme transition-transform transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report Civic Problem Now</span>
          </Link>

          <Link
            href="/heatmap"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-bold glass-button text-white shadow-xl hover:bg-white/15"
          >
            <MapPin className="w-5 h-5 text-cyan-400" />
            <span>Explore Civic Heatmap</span>
          </Link>
        </div>
      </section>

      {/* ── LIVE STATS STRIP ────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-white/10">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-white">{stats.activeIncidents}</div>
            <div className="text-xs text-slate-400 font-medium">Active Incidents</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-white/10">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-white">{stats.citizensImpacted}</div>
            <div className="text-xs text-slate-400 font-medium">Citizens Affected</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-white/10">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-white">{stats.resolvedToday}</div>
            <div className="text-xs text-slate-400 font-medium">Resolved Today</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-red-500/30 bg-red-500/10">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 shrink-0 glow-critical">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-red-400">{stats.criticalPriority}</div>
            <div className="text-xs text-red-300 font-semibold uppercase tracking-wide">Critical Right Now</div>
          </div>
        </div>
      </section>

      {/* ── 5 PORTAL ENTRY CARDS ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-amber-400" />
          <span>Civic Intelligence Portals</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/report" className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group border-amber-500/30">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 w-fit group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">Report Issue</h3>
              <p className="text-xs text-slate-400 mt-1">6-step zero-login reporting wizard with AI analysis preview.</p>
            </div>
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <span>Start Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/complaints" className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 w-fit group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">Explore Feed</h3>
              <p className="text-xs text-slate-400 mt-1">Public stream of reported civic issues with community upvoting.</p>
            </div>
            <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
              <span>View Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/heatmap" className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">Geospatial Map</h3>
              <p className="text-xs text-slate-400 mt-1">Interactive H3 hexagon density map & nearby emergency facilities.</p>
            </div>
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
              <span>Open Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/resolved" className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 w-fit group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">Resolved Gallery</h3>
              <p className="text-xs text-slate-400 mt-1">Before/after computer vision verified resolution showcase.</p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span>View Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link href="/admin" className="glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4 group">
            <div className="p-3 rounded-xl bg-red-500/20 text-red-400 w-fit group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors">Command Center</h3>
              <p className="text-xs text-slate-400 mt-1">Municipal priority triage inbox & field team dispatch.</p>
            </div>
            <div className="text-xs font-semibold text-red-400 flex items-center gap-1">
              <span>Admin Access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS LIFECYCLE ────────────────────────────────────── */}
      <section className="glass-panel p-8 rounded-3xl space-y-6 border border-white/10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-white">How JANVAANI Works</h2>
          <p className="text-xs text-slate-400">From citizen photo capture to AI computer vision verification in 5 steps.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
          {[
            { step: "01", title: "Snap & Report", desc: "Citizen uploads photo/video + voice description without requiring login." },
            { step: "02", title: "AI Analysis", desc: "Computer vision detects issue class, estimates area in m², and generates mask." },
            { step: "03", title: "Smart Merge", desc: "Nearby complaints merge automatically & XGBoost calculates priority score." },
            { step: "04", title: "Field Dispatch", desc: "Municipal command center assigns team with OSRM optimized routing." },
            { step: "05", title: "CV Verification", desc: "Before & after photos are compared via pixel reduction analysis to confirm closure." },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-3">
              <span className="text-2xl font-extrabold font-mono text-amber-400">{item.step}</span>
              <div>
                <h4 className="font-bold text-white text-sm">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECENT INCIDENTS SHOWCASE ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>Active Civic Incidents</span>
          </h2>
          <Link href="/complaints" className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentIncidents.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      </section>
    </div>
  );
}

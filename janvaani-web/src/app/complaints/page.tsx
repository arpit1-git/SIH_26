"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IncidentCard, IncidentData } from "@/components/ui/IncidentCard";
import { RiskLevel } from "@/components/ui/RiskBadge";
import { Search, Filter, RefreshCw, PlusCircle, Layers } from "lucide-react";

export default function ComplaintsFeedPage() {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/incidents?limit=50");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.incidents || [];
        const mapped: IncidentData[] = list.map((item: any) => ({
          id: item.incident_id,
          issueType: item.issue_type,
          severity: item.level || item.severity,
          riskScore: item.risk_score,
          locationName: item.location_name || item.address || "Civic Location",
          imageUrl: item.image_url || "/ui_themes/waste1.jpg",
          supportCount: item.support_count || 0,
          commentCount: item.comment_count || (item.comments ? item.comments.length : 0),
          createdAt: new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setIncidents(mapped);
      }
    } catch {
      // Fallback mock data
      setIncidents([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch = inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || inc.issueType.toLowerCase().includes(searchQuery.toLowerCase()) || inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || inc.severity.toLowerCase() === filterSeverity.toLowerCase();
    const isWater = inc.issueType.includes("water") || inc.issueType.includes("drain") || inc.issueType.includes("flood");
    const matchesCategory = filterCategory === "all" || (filterCategory === "waterlogging" ? isWater : !isWater);
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Public Complaints Feed</h1>
          <p className="text-xs text-slate-400">Live stream of reported civic issues prioritized by computer vision scoring.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition"
          >
            <span>Priority Inbox</span>
          </Link>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg glow-theme transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Problem</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by location, issue type or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
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

          <button
            onClick={fetchIncidents}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Incidents Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading live complaints feed...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 text-xs rounded-2xl">
          No civic incidents match your current search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((inc) => (
            <Link key={inc.id} href={`/incidents/${inc.id}`} className="block h-full">
              <IncidentCard incident={inc} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

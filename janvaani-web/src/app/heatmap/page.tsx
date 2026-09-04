"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { SeverityChip } from "@/components/ui/SeverityChip";
import { ScoreRing } from "@/components/ui/ScoreRing";
import {
  MapPin,
  Layers,
  Filter,
  Flame,
  Hospital,
  GraduationCap,
  Navigation,
  AlertTriangle,
  ChevronRight,
  X,
  ThumbsUp,
  Clock,
  Sparkles,
  TrendingUp,
  Cpu,
  RefreshCw,
} from "lucide-react";

interface IncidentFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    incident_id: string;
    issue_type: string;
    category: string;
    severity: string;
    risk_score: number;
    civic_impact_score: number;
    location_name: string;
    ward_number: number;
    complaint_count: number;
    support_count: number;
    complaint_velocity: number;
    recurrence_count: number;
    is_hotspot: boolean;
    status: string;
    image_url: string;
    segmentation_mask_url?: string;
    affected_area_estimate: number;
    h3_index: string;
  };
}

interface HotspotItem {
  incident_id: string;
  location_name: string;
  issue_type: string;
  category: string;
  risk_score: number;
  severity: string;
  complaint_count: number;
  support_count: number;
  complaint_velocity: number;
  recurrence_count: number;
  is_hotspot: boolean;
  lat: number;
  lng: number;
  image_url: string;
  nearest_hospital_dist: string;
  nearest_school_dist: string;
}

export default function HeatmapPage() {
  const [features, setFeatures] = useState<IncidentFeature[]>([]);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [showHotspotsOnly, setShowHotspotsOnly] = useState<boolean>(false);
  const [showFacilities, setShowFacilities] = useState<boolean>(true);

  // Active Selected Incident
  const [selectedIncident, setSelectedIncident] = useState<IncidentFeature["properties"] | null>(null);

  // Map viewport center (defaults to Delhi / sample bounds)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  useEffect(() => {
    fetchHeatmapData();
    fetchHotspots();
  }, [selectedCategory, selectedSeverity]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/map/heatmap", window.location.origin);
      if (selectedCategory !== "all") url.searchParams.set("category", selectedCategory);
      if (selectedSeverity !== "all") url.searchParams.set("severity", selectedSeverity);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setFeatures(json.features || []);
        if (json.features && json.features.length > 0 && !selectedIncident) {
          setSelectedIncident(json.features[0].properties);
        }
      }
    } catch {
      console.error("Failed to load heatmap data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHotspots = async () => {
    try {
      const res = await fetch("/api/map/hotspots?limit=10");
      if (res.ok) {
        const json = await res.json();
        setHotspots(json.hotspots || []);
      }
    } catch {
      console.error("Failed to load hotspots");
    }
  };

  const filteredFeatures = features.filter((f) => {
    if (showHotspotsOnly && !f.properties.is_hotspot) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-8 h-8 text-amber-400" />
            <span>Geospatial Civic Heatmap</span>
          </h1>
          <p className="text-xs text-slate-400">
            H3 Hexagon Density Analysis & Proximity Risk Intelligence
          </p>
        </div>

        {/* Live Legend */}
        <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase">Risk:</span>
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse glow-critical" /> Critical
          </span>
          <span className="flex items-center gap-1 text-orange-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Med
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
          </span>
        </div>
      </div>

      {/* Filter Control Strip */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Issue Categories</option>
            <option value="waste">Solid Waste Blackspots</option>
            <option value="waterlogging">Monsoon Waterlogging</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (81–100)</option>
            <option value="high">High (56–80)</option>
            <option value="medium">Medium (31–55)</option>
          </select>

          {/* Hotspot Toggle */}
          <button
            onClick={() => setShowHotspotsOnly(!showHotspotsOnly)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showHotspotsOnly
                ? "bg-red-500/20 border-red-400 text-red-300 shadow-md glow-critical"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Chronic Hotspots Only</span>
          </button>

          {/* Facilities Overlay Toggle */}
          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showFacilities
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Nearby Emergency Facilities</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>{filteredFeatures.length} Incident Cells Loaded</span>
          <button
            onClick={fetchHeatmapData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            title="Refresh Map Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Map Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Center 2 Columns: Interactive Canvas Map */}
        <div className="lg:col-span-2 relative h-[560px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl bg-slate-950">
          {/* Basemap Dark Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Radial Heat Gradient Circles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-red-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
          </div>

          {/* Simulated H3 Grid Cell Points */}
          <div className="absolute inset-0 p-8 overflow-hidden">
            {filteredFeatures.map((f, i) => {
              const isSelected = selectedIncident?.incident_id === f.properties.incident_id;
              const isCrit = f.properties.severity === "critical";

              // Map coordinates to percentage positions relative to center
              const posX = 50 + (f.geometry.coordinates[0] - mapCenter.lng) * 2200;
              const posY = 50 - (f.geometry.coordinates[1] - mapCenter.lat) * 2200;

              const clampedX = Math.max(8, Math.min(92, posX));
              const clampedY = Math.max(8, Math.min(92, posY));

              let pinColor = "#22c55e";
              if (isCrit) pinColor = "#ef4444";
              else if (f.properties.severity === "high") pinColor = "#f97316";
              else if (f.properties.severity === "medium") pinColor = "#eab308";

              return (
                <button
                  key={f.properties.incident_id || i}
                  onClick={() => setSelectedIncident(f.properties)}
                  style={{
                    left: `${clampedX}%`,
                    top: `${clampedY}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform ${
                    isSelected ? "scale-125 z-30" : "hover:scale-115 z-10"
                  }`}
                >
                  {/* Hexagon / Pulse Ring */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[10px] text-slate-950 shadow-lg transition-all ${
                      isCrit ? "glow-critical" : ""
                    }`}
                    style={{
                      backgroundColor: pinColor,
                      border: isSelected ? "2px solid #ffffff" : "1.5px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    {Math.round(f.properties.risk_score)}
                  </div>

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-40 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded shadow-xl whitespace-nowrap border border-white/10 pointer-events-none">
                    {f.properties.location_name}
                  </div>
                </button>
              );
            })}

            {/* Facility Overlay Markers */}
            {showFacilities && (
              <>
                <div
                  style={{ left: "42%", top: "35%" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-600/80 text-white shadow-lg border border-white/20 flex items-center gap-1 text-[10px] font-semibold"
                  title="Apex Trauma Hospital"
                >
                  <Hospital className="w-3 h-3" />
                  <span className="hidden sm:inline">Trauma Hospital</span>
                </div>

                <div
                  style={{ left: "68%", top: "62%" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600/80 text-white shadow-lg border border-white/20 flex items-center gap-1 text-[10px] font-semibold"
                  title="Kendriya Vidyalaya School"
                >
                  <GraduationCap className="w-3 h-3" />
                  <span className="hidden sm:inline">Public School</span>
                </div>
              </>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
            <button
              onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
              className="w-8 h-8 rounded-xl glass-button text-white font-bold flex items-center justify-center text-sm shadow-md"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(10, z - 1))}
              className="w-8 h-8 rounded-xl glass-button text-white font-bold flex items-center justify-center text-sm shadow-md"
            >
              -
            </button>
          </div>

          {/* Map Sub-label */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/10">
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>Center: {mapCenter.lat.toFixed(4)}° N, {mapCenter.lng.toFixed(4)}° E · Zoom {zoomLevel}x</span>
          </div>
        </div>

        {/* Right 1 Column: Selected Incident Detail Card */}
        <div className="h-[560px] flex flex-col">
          {selectedIncident ? (
            <motion.div
              key={selectedIncident.incident_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 rounded-3xl border border-white/15 flex-1 flex flex-col justify-between space-y-4 overflow-y-auto"
            >
              {/* Media Header */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0">
                <Image
                  src={selectedIncident.image_url || "/ui_themes/waste1.jpg"}
                  alt={selectedIncident.issue_type}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <RiskBadge level={selectedIncident.severity} score={selectedIncident.risk_score} size="sm" />
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-amber-400 border border-amber-500/30">
                    {selectedIncident.incident_id}
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 text-xs text-white font-semibold truncate">
                  {selectedIncident.location_name}
                </div>
              </div>

              {/* Middle Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SeverityChip issueType={selectedIncident.issue_type} size="sm" />
                  <span className="text-xs font-mono text-cyan-400">
                    Ward #{selectedIncident.ward_number}
                  </span>
                </div>

                {/* Score & Recurrence Strip */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Priority Triage</div>
                    <div className="text-xs text-slate-200">
                      <span className="font-bold text-amber-300">{selectedIncident.complaint_count}</span> Reports · <span className="font-bold text-cyan-300">{selectedIncident.support_count}</span> Upvotes
                    </div>
                    {selectedIncident.recurrence_count > 0 && (
                      <div className="text-[10px] text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Recurring Blackspot ({selectedIncident.recurrence_count}x in 90d)</span>
                      </div>
                    )}
                  </div>
                  <ScoreRing score={selectedIncident.risk_score} size={60} strokeWidth={6} label="Risk" />
                </div>

                {/* Proximity Risk Indicators */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase">Emergency Proximity Exposure</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1.5">
                      <Hospital className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Hospital: 320 m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>School: 180 m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                <Link
                  href={`/report`}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs text-center transition"
                >
                  Report at this Spot
                </Link>
                <Link
                  href={`/complaints`}
                  className="py-2.5 px-4 rounded-xl glass-button text-slate-200 text-xs font-semibold hover:text-white"
                >
                  View Feed
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-white/15 flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <MapPin className="w-10 h-10 text-slate-600 mb-2" />
              <span>Select any hotspot or incident cell on the map to view real-time civic intelligence details.</span>
            </div>
          )}
        </div>
      </div>

      {/* Chronic Hotspots Drawer Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Top 10 Chronic Civic Hotspots (90-Day History)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Ranked by Recurrence & Proximity Risk</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotspots.slice(0, 6).map((hs) => (
            <div
              key={hs.incident_id}
              onClick={() => {
                setMapCenter({ lat: hs.lat, lng: hs.lng });
                const matched = features.find((f) => f.properties.incident_id === hs.incident_id);
                if (matched) setSelectedIncident(matched.properties);
              }}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <RiskBadge level={hs.severity} score={hs.risk_score} size="sm" />
                  <span className="text-[10px] font-mono text-slate-400">{hs.incident_id}</span>
                </div>
                <div className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                  {hs.location_name}
                </div>
                <div className="text-[10px] text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{hs.recurrence_count} Recurring Reports in 90 Days</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

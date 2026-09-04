"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Eye,
  CheckCircle2,
  Activity,
  ShieldAlert,
  Compass,
  Maximize2,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Globe,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

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
    severity: string; // "critical" | "high" | "medium" | "low"
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

// Mercator Helper: Convert Lat/Lng to Global Pixel Point at Zoom level
function latLngToPoint(lat: number, lng: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Inverse Mercator Helper: Convert Global Pixel Point back to Lat/Lng
function pointToLatLng(x: number, y: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  };
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
  
  // Default map style to Dark Satellite (User's preferred theme image)
  const [mapStyle, setMapStyle] = useState<"satellite" | "dark" | "street">("satellite");

  // Active Selected Incident
  const [selectedIncident, setSelectedIncident] = useState<IncidentFeature["properties"] | null>(null);

  // Map viewport center (Delhi coordinates center default)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [zoomLevel, setZoomLevel] = useState<number>(12);

  // Map Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startCenterPt: { x: number; y: number } } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHeatmapData();
    fetchHotspots();
  }, [selectedCategory, selectedSeverity]);

  // Gentle, low-sensitivity wheel scroll zoom listener
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let accumulatedDelta = 0;
    let lastZoomTime = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      accumulatedDelta += e.deltaY;
      const now = Date.now();

      // Require significant wheel scroll distance (160px) AND a minimum 250ms cooldown between zoom steps
      if (Math.abs(accumulatedDelta) >= 160 && now - lastZoomTime > 250) {
        if (accumulatedDelta < 0) {
          setZoomLevel((z) => Math.min(18, z + 1));
        } else if (accumulatedDelta > 0) {
          setZoomLevel((z) => Math.max(3, z - 1));
        }
        accumulatedDelta = 0;
        lastZoomTime = now;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

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

  // Calculate Map Center Global Pixel Point
  const centerPoint = latLngToPoint(mapCenter.lat, mapCenter.lng, zoomLevel);

  // Smooth, Damped Mouse Drag Handlers (Reduced Drag Sensitivity)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startCenterPt = latLngToPoint(mapCenter.lat, mapCenter.lng, zoomLevel);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startCenterPt,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    // Damping factor (0.45) to reduce drag sensitivity for smooth, controlled panning
    const DRAG_DAMPING = 0.45;
    const dx = (e.clientX - dragStartRef.current.x) * DRAG_DAMPING;
    const dy = (e.clientY - dragStartRef.current.y) * DRAG_DAMPING;

    const targetX = dragStartRef.current.startCenterPt.x - dx;
    const targetY = dragStartRef.current.startCenterPt.y - dy;

    const newCenter = pointToLatLng(targetX, targetY, zoomLevel);
    setMapCenter(newCenter);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Helper function to return Hazard Colors & Icons for Map Pins
  const getHazardPinConfig = (severity: string, score: number) => {
    const sev = severity.toLowerCase();
    if (sev === "critical" || score >= 81) {
      return {
        bg: "bg-red-600 text-white font-black",
        border: "border-red-400 shadow-red-600/50",
        ring: "ring-4 ring-red-500/40",
        glow: "animate-pulse glow-critical",
        icon: Flame,
        label: "CRITICAL HAZARD",
        badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
      };
    }
    if (sev === "high" || score >= 56) {
      return {
        bg: "bg-orange-500 text-slate-950 font-extrabold",
        border: "border-orange-400 shadow-orange-500/40",
        ring: "ring-2 ring-orange-500/30",
        glow: "",
        icon: AlertTriangle,
        label: "HIGH HAZARD",
        badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      };
    }
    if (sev === "medium" || score >= 31) {
      return {
        bg: "bg-amber-400 text-slate-950 font-extrabold",
        border: "border-amber-300 shadow-amber-500/30",
        ring: "ring-2 ring-amber-400/30",
        glow: "",
        icon: Activity,
        label: "MEDIUM HAZARD",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }
    return {
      bg: "bg-emerald-500 text-slate-950 font-extrabold",
      border: "border-emerald-400 shadow-emerald-500/30",
      ring: "ring-2 ring-emerald-500/30",
      glow: "",
      icon: CheckCircle2,
      label: "LOW HAZARD",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    };
  };

  // Generate Clean Map Tile URLs with ZERO Watermark!
  const getTileUrls = () => {
    const tiles = [];
    const scale = Math.pow(2, zoomLevel);
    const centerTileX = Math.floor(((mapCenter.lng + 180) / 360) * scale);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const centerTileY = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
    );

    const range = zoomLevel <= 5 ? 4 : zoomLevel <= 9 ? 3 : 2;

    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const tileX = (centerTileX + x + Math.floor(scale)) % Math.floor(scale);
        const tileY = centerTileY + y;

        if (tileY >= 0 && tileY < scale) {
          const sub = ["a", "b", "c", "d"][Math.abs(tileX + tileY) % 4];
          let tileUrl = "";
          if (mapStyle === "satellite") {
            // ArcGIS World Imagery (Dark Terrain Theme)
            tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${tileY}/${tileX}`;
          } else if (mapStyle === "dark") {
            // CARTO CDN Free Dark Matter (Clean, No Watermark)
            tileUrl = `https://${sub}.basemaps.cartocdn.com/dark_all/${zoomLevel}/${tileX}/${tileY}.png`;
          } else {
            tileUrl = `https://${sub}.tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`;
          }

          const tilePxX = (centerTileX + x) * 256;
          const tilePxY = (centerTileY + y) * 256;

          tiles.push({
            key: `tile-${zoomLevel}-${x}-${y}-${tileX}-${tileY}`,
            url: tileUrl,
            tilePxX,
            tilePxY,
          });
        }
      }
    }
    return tiles;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              Geospatial Intelligence
            </span>
            <span className="text-xs text-slate-400 font-mono">H3 Index & Local Map Pins</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
            <MapPin className="w-8 h-8 text-amber-400" />
            <span>Local Map Incident & Hazard Heatmap</span>
          </h1>
        </div>

        {/* Hazard Severity Color Scale Legend */}
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Hazard Level:</span>
          <span className="flex items-center gap-1 text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse glow-critical" /> Critical (Red)
          </span>
          <span className="flex items-center gap-1 text-orange-400 font-semibold px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High (Orange)
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-medium px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Med (Yellow)
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (Green)
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
            <option value="waste">Solid Waste & Illegal Dumping</option>
            <option value="waterlogging">Monsoon Waterlogging & Floods</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Hazard Levels</option>
            <option value="critical">🔴 Critical Hazard (81–100)</option>
            <option value="high">🟠 High Hazard (56–80)</option>
            <option value="medium">🟡 Medium Hazard (31–55)</option>
            <option value="low">🟢 Low Hazard (0–30)</option>
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

          {/* Map Style Theme Switcher */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-400/40 text-xs text-amber-300 font-bold focus:outline-none"
          >
            <option value="satellite">🛰️ Dark Satellite Terrain (Preferred)</option>
            <option value="dark">🌙 CARTO Dark Matter (Clean)</option>
            <option value="street">🗺️ OpenStreetMap Standard</option>
          </select>

          {/* Quick Location Jumpers */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => {
                setMapCenter({ lat: 28.6139, lng: 77.2090 });
                setZoomLevel(12);
              }}
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-200 text-[11px] font-medium"
            >
              Delhi
            </button>
            <button
              onClick={() => {
                setMapCenter({ lat: 20.5937, lng: 78.9629 });
                setZoomLevel(5);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold"
            >
              🇮🇳 India View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="text-slate-200 font-bold">{filteredFeatures.length}</span> Local Pins Plotted
          <button
            onClick={fetchHeatmapData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            title="Refresh Map Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Interactive Local Map Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Draggable & Wheel-Zoomable Clean Map Canvas with Hazard Pins */}
        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`lg:col-span-2 relative h-[600px] rounded-3xl overflow-hidden glass-panel border border-white/15 shadow-2xl bg-slate-950 select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {/* Dark Satellite Map Basemap Layer (Matches User's Reference Screenshot) */}
          <div className="absolute inset-0 pointer-events-none opacity-85 overflow-hidden">
            <div className="relative w-full h-full">
              {getTileUrls().map((t) => (
                <img
                  key={t.key}
                  src={t.url}
                  alt="Map Tile"
                  className="absolute w-[256px] h-[256px] object-cover pointer-events-none"
                  style={{
                    left: `calc(50% + ${t.tilePxX - centerPoint.x}px)`,
                    top: `calc(50% + ${t.tilePxY - centerPoint.y}px)`,
                    filter: mapStyle === "satellite" ? "brightness(0.72) contrast(1.28) saturate(0.85)" : "none",
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.opacity = "0";
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dark Vector Grid Overlay Lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Ambient Glows for Critical Cluster Areas */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-red-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
          </div>

          {/* LOCAL MAP HAZARD PINS LAYER (STUCK 100% TO STREET CORNERS WHILE DRAGGING) */}
          <div className="absolute inset-0 overflow-hidden">
            {filteredFeatures.map((f, i) => {
              const lng = f.geometry.coordinates[0];
              const lat = f.geometry.coordinates[1];

              const pt = latLngToPoint(lat, lng, zoomLevel);
              const offsetX = pt.x - centerPoint.x;
              const offsetY = pt.y - centerPoint.y;

              const isSelected = selectedIncident?.incident_id === f.properties.incident_id;
              const pinConfig = getHazardPinConfig(f.properties.severity, f.properties.risk_score);
              const HazardIcon = pinConfig.icon;

              return (
                <div
                  key={`pin-${f.properties.incident_id || 'inc'}-${i}`}
                  style={{
                    left: `calc(50% + ${offsetX}px)`,
                    top: `calc(50% + ${offsetY}px)`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 z-20 ${
                    isSelected ? "scale-125 z-40" : "hover:scale-115"
                  }`}
                >
                  {/* Outer Pulsing Aura Ring for Critical Hazard */}
                  {f.properties.severity === "critical" && (
                    <div className="absolute -inset-2.5 rounded-full bg-red-600/40 animate-ping pointer-events-none" />
                  )}

                  {/* Hazard Pin Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIncident(f.properties);
                      setMapCenter({ lat, lng });
                    }}
                    className={`relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-2xl border transition-all cursor-pointer ${pinConfig.bg} ${pinConfig.border} ${pinConfig.ring} ${pinConfig.glow}`}
                  >
                    <HazardIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono text-xs font-black tracking-tight">
                      {Math.round(f.properties.risk_score)}
                    </span>

                    {/* Interactive Tooltip Card on Hover */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-1 z-50 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap pointer-events-none backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">{f.properties.incident_id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${pinConfig.badgeBg}`}>
                          {pinConfig.label}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-100">{f.properties.location_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>Category: {f.properties.category.toUpperCase()}</span>
                        <span>·</span>
                        <span>Ward #{f.properties.ward_number}</span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Emergency Facilities Markers */}
            {showFacilities && zoomLevel >= 11 && (
              <>
                <div
                  style={{ left: "42%", top: "35%" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-red-600 text-white shadow-xl border border-white/30 flex items-center gap-1.5 text-xs font-bold z-10"
                  title="Apex Trauma Center & Emergency Hospital"
                >
                  <Hospital className="w-4 h-4 text-red-200" />
                  <span>Apex Trauma Hospital</span>
                </div>

                <div
                  style={{ left: "68%", top: "62%" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white shadow-xl border border-white/30 flex items-center gap-1.5 text-xs font-bold z-10"
                  title="Kendriya Vidyalaya Public School"
                >
                  <GraduationCap className="w-4 h-4 text-blue-200" />
                  <span>Public School Complex</span>
                </div>
              </>
            )}
          </div>

          {/* Floating Map Viewport Controls */}
          <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-30">
            <button
              onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
              className="w-9 h-9 rounded-xl glass-button text-white font-bold flex items-center justify-center text-sm shadow-xl hover:bg-white/20 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(3, z - 1))}
              className="w-9 h-9 rounded-xl glass-button text-white font-bold flex items-center justify-center text-sm shadow-xl hover:bg-white/20 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setMapCenter({ lat: 28.6139, lng: 77.2090 });
                setZoomLevel(12);
              }}
              className="w-9 h-9 rounded-xl glass-button text-amber-400 font-bold flex items-center justify-center text-sm shadow-xl hover:bg-white/20 transition-all"
              title="Recenter Map"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>

          {/* Map Status & Sensitivity Controls Notice Footbar */}
          <div className="absolute bottom-5 left-5 z-30 flex items-center gap-3 text-[11px] font-mono text-slate-300 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 shadow-xl">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>
                Center: <strong className="text-white">{mapCenter.lat.toFixed(4)}° N, {mapCenter.lng.toFixed(4)}° E</strong> · Zoom <strong>{zoomLevel}x</strong>
              </span>
            </div>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="hidden sm:inline-block text-emerald-400 font-semibold">
              ✨ Smooth Damped Dragging · Wheel Mouse Zoom
            </span>
          </div>
        </div>

        {/* Right 1 Column: Selected Report Hazard & Intelligence Card */}
        <div className="h-[600px] flex flex-col">
          {selectedIncident ? (
            <motion.div
              key={selectedIncident.incident_id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-5 rounded-3xl border border-white/15 flex-1 flex flex-col justify-between space-y-4 overflow-y-auto"
            >
              {/* Media & Hazard Badge Header */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow-lg">
                <Image
                  src={selectedIncident.image_url || "/ui_themes/waste1.jpg"}
                  alt={selectedIncident.issue_type}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <RiskBadge level={selectedIncident.severity} score={selectedIncident.risk_score} size="sm" />
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 border border-amber-500/30 shadow-md">
                    {selectedIncident.incident_id}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-xs text-white font-bold truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{selectedIncident.location_name}</span>
                </div>
              </div>

              {/* Middle Metrics & AI Segmentation Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SeverityChip issueType={selectedIncident.issue_type} size="sm" />
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                    Ward #{selectedIncident.ward_number}
                  </span>
                </div>

                {/* Score & Hazard Triage Strip */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between shadow-inner">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Hazard Triage Score</div>
                    <div className="text-xs text-slate-200">
                      <span className="font-bold text-amber-300">{selectedIncident.complaint_count}</span> Reports · <span className="font-bold text-cyan-300">{selectedIncident.support_count}</span> Supports
                    </div>
                    {selectedIncident.recurrence_count > 0 && (
                      <div className="text-[10px] text-red-400 font-bold flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>Chronic Blackspot ({selectedIncident.recurrence_count}x in 90 days)</span>
                      </div>
                    )}
                  </div>
                  <ScoreRing score={selectedIncident.risk_score} size={62} strokeWidth={6} label="Risk" />
                </div>

                {/* Proximity Risk Indicators */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Emergency Facility Exposure</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1.5 font-medium">
                      <Hospital className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Hospital: 320 m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1.5 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>School: 180 m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-2 border-t border-white/10">
                <Link
                  href="/report"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs text-center shadow-lg shadow-amber-500/20 transition-all"
                >
                  Report at this Spot
                </Link>
                <Link
                  href="/complaints"
                  className="py-2.5 px-4 rounded-xl glass-button text-slate-200 text-xs font-semibold hover:text-white transition-all"
                >
                  View Feed
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-white/15 flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <MapPin className="w-10 h-10 text-slate-600 mb-2" />
              <span>Select any local hazard pin on the map to view real-time civic intelligence details.</span>
            </div>
          )}
        </div>
      </div>

      {/* Chronic Hotspots Drawer Table */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Top Chronic Civic Hotspots (Ranked by Hazard Severity)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Mapped to Local Coordinates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotspots.slice(0, 6).map((hs, i) => {
            const pinConfig = getHazardPinConfig(hs.severity, hs.risk_score);
            return (
              <div
                key={`hs-${hs.incident_id || 'item'}-${i}`}
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
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>{hs.recurrence_count} Recurring Reports (90 Days)</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

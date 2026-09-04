"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  reductionPct?: number;
  initialArea?: number;
  clearedArea?: number;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Reported Evidence (Before)",
  afterLabel = "Verified Resolution (After)",
  reductionPct = 92.4,
  initialArea,
  clearedArea,
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [mode, setMode] = useState<"slider" | "toggle">("slider");
  const [activeToggle, setActiveToggle] = useState<"before" | "after">("after");

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header with Mode Toggle & AI Verification Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-white">AI Cleanup Verification</h4>
            <p className="text-xs text-slate-400">Computer Vision Before vs After comparison</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMode("slider")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mode === "slider" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Split Slider
            </button>
            <button
              onClick={() => setMode("toggle")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mode === "toggle" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              Toggle View
            </button>
          </div>

          <div className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            {reductionPct}% Cleared
          </div>
        </div>
      </div>

      {/* Main Visual Display */}
      {mode === "slider" ? (
        <div className="relative w-full h-80 rounded-xl overflow-hidden select-none border border-slate-800 bg-slate-950 shadow-inner group">
          {/* AFTER IMAGE (Base Layer) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={afterImage}
              alt="After resolution"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium backdrop-blur-md">
              {afterLabel}
            </div>
          </div>

          {/* BEFORE IMAGE (Clipped Layer) */}
          <div
            className="absolute inset-0 h-full overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={beforeImage}
              alt="Before resolution"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: "100%", height: "100%", minWidth: "100%" }}
            />
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium backdrop-blur-md">
              {beforeLabel}
            </div>
          </div>

          {/* Slider Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] cursor-ew-resize pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg text-xs font-bold">
              ↔
            </div>
          </div>

          {/* Range input for smooth drag */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
            <img
              src={activeToggle === "before" ? beforeImage : afterImage}
              alt={activeToggle}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border ${
                activeToggle === "before"
                  ? "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
              }`}
            >
              {activeToggle === "before" ? beforeLabel : afterLabel}
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveToggle("before")}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                activeToggle === "before"
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              View Before (Initial Issue)
            </button>
            <button
              onClick={() => setActiveToggle("after")}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                activeToggle === "after"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              View After (Verified Resolution)
            </button>
          </div>
        </div>
      )}

      {/* Surface Metric Chips */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 text-center">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Initial Hazard</p>
          <p className="text-sm font-bold text-rose-400 mt-0.5">{initialArea || "35.0"} m²</p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Residual Footprint</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">{clearedArea || "2.1"} m²</p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Surface Cleared</p>
          <p className="text-sm font-bold text-cyan-400 mt-0.5">+{reductionPct}%</p>
        </div>
      </div>
    </div>
  );
}

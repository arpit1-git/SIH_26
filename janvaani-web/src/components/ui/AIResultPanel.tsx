"use client";

import React, { useState } from "react";
import Image from "next/image";
import { EvidenceConfidenceBadge } from "./EvidenceConfidenceBadge";
import { Eye, Box, Layers, Cpu, Clock, Maximize2 } from "lucide-react";

export interface AIDetectionData {
  issueType: string;
  confidence: number;
  severityInitial: string;
  detections: Array<{
    label: string;
    confidence: number;
    bbox: number[];
    affected_area_estimate: number;
  }>;
  segmentationMaskUrl: string;
  evidenceScore: number;
  processingTimeMs: number;
  originalImageUrl: string;
}

interface AIResultPanelProps {
  data: AIDetectionData;
}

export const AIResultPanel: React.FC<AIResultPanelProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"original" | "detection" | "segmentation">("detection");

  const primaryDetection = data.detections[0] || {
    label: data.issueType,
    confidence: data.confidence,
    bbox: [50, 50, 350, 250],
    affected_area_estimate: 24.5,
  };

  return (
    <div className="rounded-2xl glass-panel p-4 space-y-4 border border-amber-500/20">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>AI Computer Vision Analysis</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Mock AIService
              </span>
            </h4>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {data.processingTimeMs} ms processing
              </span>
            </div>
          </div>
        </div>

        <EvidenceConfidenceBadge score={data.evidenceScore} />
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
        <button
          onClick={() => setActiveTab("original")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "original"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Original Photo</span>
        </button>

        <button
          onClick={() => setActiveTab("detection")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "detection"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>YOLO Detections</span>
        </button>

        <button
          onClick={() => setActiveTab("segmentation")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === "segmentation"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Segmentation Overlay</span>
        </button>
      </div>

      {/* Visual Canvas Viewer */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10">
        {/* Base Photo */}
        <Image
          src={data.originalImageUrl || "/ui_themes/waste1.jpg"}
          alt="Original evidence"
          fill
          className="object-cover"
        />

        {/* Tab 2: Bounding Box Overlay */}
        {activeTab === "detection" && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute border-2 border-amber-400 bg-amber-400/20 rounded-lg shadow-lg flex flex-col justify-between p-2"
              style={{
                left: "15%",
                top: "20%",
                width: "65%",
                height: "60%",
              }}
            >
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold self-start shadow-md">
                <span>{primaryDetection.label.toUpperCase()}</span>
                <span>{Math.round(primaryDetection.confidence * 100)}%</span>
              </div>

              <div className="text-[10px] font-mono text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs self-end">
                Area: {primaryDetection.affected_area_estimate} m²
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mock Mask Overlay */}
        {activeTab === "segmentation" && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-80">
            <Image
              src={data.segmentationMaskUrl || "/api/ai/mock-mask?type=waste"}
              alt="Segmentation mask overlay"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Detection Stats Footer Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-medium">Issue Class</div>
          <div className="font-semibold text-amber-300 mt-0.5 capitalize">
            {data.issueType.replace(/_/g, " ")}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-medium">Confidence</div>
          <div className="font-semibold text-emerald-400 mt-0.5 font-mono">
            {Math.round(data.confidence * 100)}%
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-medium">Affected Area</div>
          <div className="font-semibold text-cyan-300 mt-0.5 font-mono">
            {primaryDetection.affected_area_estimate} m²
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-slate-400 text-[10px] uppercase font-medium">Initial Severity</div>
          <div className="font-semibold text-red-400 mt-0.5 uppercase">
            {data.severityInitial}
          </div>
        </div>
      </div>
    </div>
  );
};

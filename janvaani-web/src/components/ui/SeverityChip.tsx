"use client";

import React from "react";
import { Trash2, Droplets, AlertOctagon, Flame, ShieldAlert } from "lucide-react";

interface SeverityChipProps {
  issueType?: string;
  severity?: string;
  size?: "sm" | "md";
}

export const SeverityChip: React.FC<SeverityChipProps> = ({ issueType, severity, size = "md" }) => {
  const val = issueType || severity || "general";
  const normType = val.toLowerCase();

  const isWater = normType.includes("water") || normType.includes("flood") || normType.includes("drain");
  
  const Icon = isWater ? Droplets : normType.includes("hazard") ? ShieldAlert : Trash2;
  const colorClass = isWater
    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
    : "bg-amber-500/15 border-amber-500/30 text-amber-300";

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  const formattedName = val
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border font-medium ${colorClass} ${sizeClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{formattedName}</span>
    </span>
  );
};

"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

export type RiskLevel = "critical" | "high" | "medium" | "low";

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = "md",
}) => {
  const normLevel = (level || "medium").toLowerCase() as RiskLevel;

  const config = {
    critical: {
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      glow: "glow-critical",
      label: "Critical",
      icon: AlertTriangle,
    },
    high: {
      bg: "bg-orange-500/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      glow: "glow-high",
      label: "High",
      icon: AlertCircle,
    },
    medium: {
      bg: "bg-amber-500/20",
      border: "border-amber-500/50",
      text: "text-amber-400",
      glow: "",
      label: "Medium",
      icon: Info,
    },
    low: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/50",
      text: "text-emerald-400",
      glow: "",
      label: "Low",
      icon: CheckCircle2,
    },
  }[normLevel] || {
    bg: "bg-slate-500/20",
    border: "border-slate-500/50",
    text: "text-slate-400",
    glow: "",
    label: normLevel,
    icon: Info,
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  }[size];

  const IconComp = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide backdrop-blur-md uppercase ${config.bg} ${config.border} ${config.text} ${config.glow} ${sizeClasses}`}
    >
      {showIcon && <IconComp className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="ml-1 opacity-80 border-l border-current/30 pl-1 font-mono">
          {Math.round(score)}
        </span>
      )}
    </span>
  );
};

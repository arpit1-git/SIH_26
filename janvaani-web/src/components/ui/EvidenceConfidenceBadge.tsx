"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface EvidenceConfidenceBadgeProps {
  score: number;
}

export const EvidenceConfidenceBadge: React.FC<EvidenceConfidenceBadgeProps> = ({ score }) => {
  const normScore = Math.min(1, Math.max(0, score));
  const pct = Math.round(normScore * 100);

  if (normScore >= 0.75) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>High AI Trust ({pct}%)</span>
      </span>
    );
  }

  if (normScore >= 0.5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>Moderate Trust ({pct}%)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400">
      <ShieldX className="w-3.5 h-3.5 shrink-0" />
      <span>Manual Review Flagged ({pct}%)</span>
    </span>
  );
};

"use client";

import React from "react";
import { Cpu, TrendingUp, AlertTriangle, ShieldCheck, Zap, HelpCircle } from "lucide-react";

export interface FactorBreakdown {
  factor: string;
  contribution_pct: number;
  description: string;
  badge: string;
}

export interface ExplainableScoreCardProps {
  riskScore: number;
  civicImpactScore: number;
  severityLevel: string;
  summary: string;
  bullets: string[];
  factors?: FactorBreakdown[];
  velocity?: number;
}

export const ExplainableScoreCard: React.FC<ExplainableScoreCardProps> = ({
  riskScore,
  civicImpactScore,
  severityLevel,
  summary,
  bullets,
  factors = [],
  velocity = 1.0,
}) => {
  const getBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "high":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -right-16 -top-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Responsive Civic AI Scoring</h3>
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${getBadgeColor(severityLevel)}`}>
                {severityLevel} PRIORITY
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Signal XGBoost prioritization and civic risk triage (PRD §15–17)</p>
          </div>
        </div>

        {/* Dual Gauges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Civic Risk</span>
              <span className="text-sm font-extrabold text-amber-400">{riskScore}/100</span>
            </div>
            <div className="w-2 h-8 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="w-full bg-gradient-to-t from-amber-500 to-rose-500 absolute bottom-0 transition-all duration-1000"
                style={{ height: `${riskScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Civic Impact</span>
              <span className="text-sm font-extrabold text-cyan-400">{civicImpactScore}/100</span>
            </div>
            <div className="w-2 h-8 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 absolute bottom-0 transition-all duration-1000"
                style={{ height: `${civicImpactScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Reason Callout */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-amber-500/20 text-xs text-slate-200 flex items-start gap-3">
        <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300 block mb-1">AI Triage Summary</span>
          <p className="leading-relaxed text-slate-300">{summary}</p>
        </div>
      </div>

      {/* Why Is This Critical? Bullet Points */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-rose-400" />
          <span>Why Is This {severityLevel.toUpperCase()}? (Explainable Factors)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bullets.map((bullet, idx) => (
            <div
              key={idx}
              className="bg-white/5 hover:bg-white/[0.08] transition-colors p-3.5 rounded-2xl border border-white/10 flex items-start gap-2.5 text-xs text-slate-200"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              <span className="leading-relaxed">{bullet}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Factor Signal Weights Breakdown */}
      {factors && factors.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-white/10">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Signal Weight Contribution Breakdown</span>
          </h4>

          <div className="space-y-2">
            {factors.map((f, i) => (
              <div key={i} className="bg-slate-900/70 p-3 rounded-xl border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{f.factor}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10 font-mono">
                      {f.badge}
                    </span>
                  </div>
                  <span className="font-mono text-amber-400 font-bold">+{f.contribution_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                    style={{ width: `${Math.min(100, f.contribution_pct * 4)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">{f.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

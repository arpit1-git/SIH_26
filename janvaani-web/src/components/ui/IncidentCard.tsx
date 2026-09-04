"use client";

import React from "react";
import Image from "next/image";
import { RiskBadge, RiskLevel } from "./RiskBadge";
import { SeverityChip } from "./SeverityChip";
import { MapPin, ThumbsUp, MessageSquare, Clock, Cpu } from "lucide-react";

export interface IncidentData {
  id: string;
  issueType: string;
  severity: RiskLevel | string;
  riskScore: number;
  locationName: string;
  imageUrl: string;
  supportCount: number;
  commentCount: number;
  createdAt: string;
  evidenceScore?: number;
}

interface IncidentCardProps {
  incident: IncidentData;
  onSelect?: (id: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onSelect }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(incident.id)}
      className="glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full group"
    >
      {/* Media Header */}
      <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
        <Image
          src={incident.imageUrl || "/ui_themes/waste1.jpg"}
          alt={incident.issueType}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <RiskBadge level={incident.severity} score={incident.riskScore} size="sm" />
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30">
            <Cpu className="w-3 h-3" />
            <span>AI Verified</span>
          </span>
        </div>

        {/* Bottom Location */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-1 text-slate-300 font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{incident.locationName}</span>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <SeverityChip issueType={incident.issueType} size="sm" />
            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {incident.createdAt}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2">
            {incident.issueType.replace(/_/g, " ").toUpperCase()} — Reported at {incident.locationName}
          </h4>
        </div>

        {/* Footer Metrics */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300 hover:text-white transition font-medium">
              <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>{incident.supportCount} Upvotes</span>
            </span>
            <span className="flex items-center gap-1 text-slate-300 hover:text-white transition font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>{incident.commentCount}</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 uppercase">{incident.id}</span>
        </div>
      </div>
    </div>
  );
};

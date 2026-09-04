"use client";

import React from "react";
import { Building2, GraduationCap, Cross, Navigation, ShieldAlert, Waves } from "lucide-react";

export interface FacilityItem {
  facility_type: string;
  name: string;
  distance_meters: number;
}

export interface NearbyFacilitiesCardProps {
  facilities: FacilityItem[];
}

export const NearbyFacilitiesCard: React.FC<NearbyFacilitiesCardProps> = ({ facilities = [] }) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "hospital":
        return <Cross className="w-4 h-4 text-rose-400" />;
      case "school":
        return <GraduationCap className="w-4 h-4 text-amber-400" />;
      case "storm_drain":
      case "drain":
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case "arterial_road":
      case "transit":
        return <Navigation className="w-4 h-4 text-emerald-400" />;
      default:
        return <Building2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getThreatBadge = (dist: number, type: string) => {
    if (dist <= 150) {
      return {
        label: "Direct Threat Zone (<150m)",
        bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    } else if (dist <= 350) {
      return {
        label: "Adjacent Buffer (<350m)",
        bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    } else {
      return {
        label: "Outer Perimeter",
        bg: "bg-slate-500/20 text-slate-300 border-slate-500/40",
      };
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Nearby Critical Facility Intelligence</h3>
            <p className="text-[11px] text-slate-400">Contextual proximity exposure for municipal triage (PRD §19)</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
          {facilities.length} Monitored Facilities
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facilities.map((fac, idx) => {
          const badge = getThreatBadge(fac.distance_meters, fac.facility_type);
          return (
            <div
              key={idx}
              className="bg-slate-900/70 p-3.5 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    {getIcon(fac.facility_type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      {fac.facility_type.replace(/_/g, " ")}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-100 line-clamp-1">{fac.name}</h5>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                <span className="font-mono text-cyan-300 font-bold">{Math.round(fac.distance_meters)} meters away</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

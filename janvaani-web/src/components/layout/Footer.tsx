"use client";

import React from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, Heart, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-white/10 mt-auto py-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: Platform Info */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>JANVAANI</span>
          </div>
          <p className="text-slate-400 max-w-md leading-relaxed text-xs">
            Next-Generation Autonomous Civic Intelligence & Emergency Action System. Empowering citizens to report waste blackspots and monsoon waterlogging with explainable computer vision scoring.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-amber-300 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Smart India Hackathon 2026
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-cyan-300 font-medium">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              Build-First Architecture
            </span>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2">
          <div className="text-white font-semibold text-xs tracking-wider uppercase">Portal Navigation</div>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link href="/" className="hover:text-amber-400 transition">Home Portal</Link></li>
            <li><Link href="/report" className="hover:text-amber-400 transition">Report Civic Problem</Link></li>
            <li><Link href="/complaints" className="hover:text-amber-400 transition">Civic Feed</Link></li>
            <li><Link href="/heatmap" className="hover:text-amber-400 transition">Geospatial Heatmap</Link></li>
            <li><Link href="/admin" className="hover:text-amber-400 transition">Municipal Command Center</Link></li>
          </ul>
        </div>

        {/* Col 3: AI Disclaimer */}
        <div className="space-y-2">
          <div className="text-white font-semibold text-xs tracking-wider uppercase">AI Transparency</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            JANVAANI utilizes an abstract <code className="text-amber-300">AIService</code> interface. Currently operating on <span className="text-emerald-400 font-semibold">MockAIService</span> with pluggable support for <span className="text-cyan-400 font-semibold">YOLO26-Seg</span> computer vision weights.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
        <div>© 2026 JANVAANI Civic Tech. All rights reserved.</div>
        <div className="flex items-center gap-1">
          <span>Engineered with</span>
          <Heart className="w-3 h-3 text-red-500 fill-current inline" />
          <span>for SIH 2026</span>
        </div>
      </div>
    </footer>
  );
};

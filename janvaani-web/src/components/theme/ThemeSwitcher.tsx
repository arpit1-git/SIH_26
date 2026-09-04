"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { THEMES } from "@/lib/themes";
import { Palette, Play, Pause, ChevronRight, Sparkles, Layers } from "lucide-react";

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, isAutoRotate, setThemeById, toggleAutoRotate } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Compact Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full glass-button text-xs font-medium text-slate-200 hover:text-white shadow-lg"
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: currentTheme.accentColor }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-300" />
        <span className="max-w-[130px] truncate hidden sm:inline">{currentTheme.name}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold text-slate-300 bg-white/10">
          {currentTheme.category === "waste" ? "Waste" : "Water"}
        </span>
      </button>

      {/* Expanded Modal Selector */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 z-50 rounded-2xl glass-panel p-4 shadow-2xl border border-white/15"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">Dynamic UI Themes</h4>
                </div>
                <button
                  onClick={toggleAutoRotate}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition"
                  title={isAutoRotate ? "Pause auto-rotation" : "Enable 8s auto-rotation"}
                >
                  {isAutoRotate ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-400" />
                      <span>Auto (8s)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>

              {/* Theme Grid */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {/* Waste Section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold tracking-wider uppercase text-amber-400">
                    <Layers className="w-3 h-3" />
                    <span>Waste Management Themes</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {THEMES.filter((t) => t.category === "waste").map((theme) => {
                      const isActive = theme.id === currentTheme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setThemeById(theme.id);
                            setIsOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl text-left transition ${
                            isActive
                              ? "bg-white/15 border border-amber-500/50 shadow-md"
                              : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0">
                            <Image src={theme.image} alt={theme.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate">{theme.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{theme.tagline}</div>
                          </div>
                          {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Waterlogging Section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold tracking-wider uppercase text-cyan-400">
                    <Layers className="w-3 h-3" />
                    <span>Waterlogging & Monsoon Themes</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {THEMES.filter((t) => t.category === "waterlogging").map((theme) => {
                      const isActive = theme.id === currentTheme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setThemeById(theme.id);
                            setIsOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl text-left transition ${
                            isActive
                              ? "bg-white/15 border border-cyan-500/50 shadow-md"
                              : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className="relative w-12 h-9 rounded-lg overflow-hidden shrink-0">
                            <Image src={theme.image} alt={theme.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate">{theme.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{theme.tagline}</div>
                          </div>
                          {isActive && <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

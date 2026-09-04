"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import {
  PlusCircle,
  ShieldAlert,
  HardHat,
  AlertTriangle,
  Cpu,
  ChevronDown,
  Building2,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [municipalOpen, setMunicipalOpen] = useState(false);

  const navLinks = [
    { name: "Explore", href: "/" },
    { name: "Report", href: "/report" },
    { name: "Feed", href: "/complaints" },
    { name: "Heatmap", href: "/heatmap" },
    { name: "Inbox", href: "/inbox" },
    { name: "News", href: "/news" },
    { name: "Resolved", href: "/resolved" },
  ];

  const municipalLinks = [
    { name: "Command Center", href: "/command-center", icon: ShieldAlert },
    { name: "Field Worker", href: "/field", icon: HardHat },
    { name: "SLA & Escalation", href: "/escalation", icon: AlertTriangle },
  ];

  const isMunicipalActive = municipalLinks.some((l) => pathname === l.href);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              <span>JANVAANI</span>
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                AI 2.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">
              Civic Intelligence System
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Municipal dropdown separator */}
          <div className="w-px h-4 bg-white/15 mx-1" />

          {/* Municipal dropdown */}
          <div className="relative">
            <button
              onClick={() => setMunicipalOpen((p) => !p)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                isMunicipalActive
                  ? "bg-red-500/80 text-white shadow-md font-semibold"
                  : "text-red-300 hover:text-white hover:bg-red-500/20 border border-red-500/30"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Municipal
              <ChevronDown
                className={`w-3 h-3 transition-transform ${municipalOpen ? "rotate-180" : ""}`}
              />
            </button>

            {municipalOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMunicipalOpen(false)}
                />
                <div className="absolute top-full right-0 mt-2 z-50 glass-card rounded-xl overflow-hidden border border-red-500/20 min-w-[200px] shadow-2xl">
                  {municipalLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMunicipalOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 text-xs font-medium transition hover:bg-white/5 ${
                          isActive ? "text-red-300 bg-red-900/20" : "text-slate-300"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-red-400" : "text-slate-500"
                          }`}
                        />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Right Actions: Theme Switcher + CTA */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          <Link
            href="/report"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg glow-theme transition-all transform hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

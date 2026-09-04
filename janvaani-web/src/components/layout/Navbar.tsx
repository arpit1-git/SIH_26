"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { PlusCircle, Map, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Explore", href: "/" },
    { name: "Report Issue", href: "/report" },
    { name: "Complaints", href: "/complaints" },
    { name: "Heatmap", href: "/heatmap" },
    { name: "Priority Inbox", href: "/inbox" },
  ];

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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-md font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
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

"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export const ThemeBackground: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTheme.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={currentTheme.image}
            alt={currentTheme.name}
            fill
            priority
            className="object-cover object-center filter brightness-50 blur-[2px]"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Multi-stage Dark Gradient Overlays for High Contrast Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-slate-950/60" />
      
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
};

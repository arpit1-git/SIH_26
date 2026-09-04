"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { THEMES, ThemeConfig } from "@/lib/themes";

interface ThemeContextType {
  currentTheme: ThemeConfig;
  isAutoRotate: boolean;
  setThemeById: (id: number) => void;
  nextTheme: () => void;
  prevTheme: () => void;
  toggleAutoRotate: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);

  const currentTheme = THEMES[currentIndex];

  // Apply root CSS variables whenever theme changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--theme-accent", currentTheme.accentColor);
      document.documentElement.style.setProperty("--theme-glow", currentTheme.glowColor);
    }
  }, [currentTheme]);

  // Auto-rotate every 8 seconds if enabled
  useEffect(() => {
    if (!isAutoRotate) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % THEMES.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isAutoRotate]);

  const setThemeById = (id: number) => {
    const idx = THEMES.findIndex((t) => t.id === id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  };

  const nextTheme = () => {
    setCurrentIndex((prev) => (prev + 1) % THEMES.length);
  };

  const prevTheme = () => {
    setCurrentIndex((prev) => (prev - 1 + THEMES.length) % THEMES.length);
  };

  const toggleAutoRotate = () => {
    setIsAutoRotate((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        isAutoRotate,
        setThemeById,
        nextTheme,
        prevTheme,
        toggleAutoRotate,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

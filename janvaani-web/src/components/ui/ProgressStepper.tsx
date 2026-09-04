"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />

        {/* Active Track Line */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-cyan-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                onClick={() => onStepClick && isDone && onStepClick(step.id)}
                disabled={!isDone && !isCurrent}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : isCurrent
                    ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-lg glow-theme"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
              </button>

              <span
                className={`mt-2 text-[11px] font-medium hidden sm:block transition-colors ${
                  isCurrent ? "text-amber-400 font-semibold" : isDone ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

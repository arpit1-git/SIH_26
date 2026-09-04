"use client";

import React, { useState } from "react";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscribed }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = () => {
    if (isRecording) {
      // Stop recording & trigger fake transcription
      setIsRecording(false);
      setIsProcessing(true);

      setTimeout(() => {
        setIsProcessing(false);
        const mockTranscription =
          "Main road blocked near city hospital with heavy waterlogging and overflowing municipal waste bin. Vehicles unable to pass.";
        onTranscribed(mockTranscription);
      }, 1200);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 rounded-xl glass-panel border border-white/10 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isProcessing}
          className={`relative p-4 rounded-full transition-all ${
            isRecording
              ? "bg-red-500 text-white shadow-lg glow-critical scale-105"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          ) : isRecording ? (
            <Square className="w-6 h-6 fill-current" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <div>
          <div className="text-sm font-semibold text-slate-200">
            {isProcessing
              ? "Transcribing Audio..."
              : isRecording
              ? "Listening to Voice Report..."
              : "Voice Description"}
          </div>
          <div className="text-xs text-slate-400">
            {isRecording
              ? "Tap stop when finished speaking"
              : "Speak in Hindi, English, or Regional Language"}
          </div>
        </div>
      </div>

      {/* Animated Waveform indicator when recording */}
      {isRecording && (
        <div className="flex items-center gap-1 h-6">
          {[40, 85, 30, 95, 60, 100, 50, 75, 45, 90].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-amber-400 rounded-full animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

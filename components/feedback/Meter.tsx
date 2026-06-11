"use client";

import type { CSSProperties } from "react";

interface MeterProps {
  score: number; // 0..1
  label?: string;
}

export function Meter({ score, label }: MeterProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const angle = -90 + clamped * 180; // map 0..1 to -90..90

  const needleStyle: CSSProperties = {
    transform: `rotate(${angle}deg)`,
    transformOrigin: "bottom center",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-40 h-20 overflow-hidden">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9ca3af" />{/* grey */}
              <stop offset="50%" stopColor="#eab308" />{/* yellow */}
              <stop offset="100%" stopColor="#22c55e" />{/* green */}
            </linearGradient>
          </defs>
          {/* Arc background */}
          <path
            d="M10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth={14}
            strokeLinecap="round"
          />
        </svg>
        {/* Needle */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
          <div
            className="w-0.5 h-16 bg-stone-700 rounded-full"
            style={needleStyle}
          />
        </div>
      </div>
      {label && (
        <div className="text-[11px] font-ui text-stone-600 text-center">
          {label}
        </div>
      )}
      <div className="text-[11px] font-ui text-stone-500">
        {Math.round(clamped * 100)}%
      </div>
    </div>
  );
}


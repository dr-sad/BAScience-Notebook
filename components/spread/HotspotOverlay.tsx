"use client";

import { useState } from "react";
import type { Hotspot } from "@/data/spreads";

interface HotspotOverlayProps {
  hotspots: Hotspot[];
  page: "left" | "right";
}

export function HotspotOverlay({ hotspots, page }: HotspotOverlayProps) {
  const filtered = hotspots.filter((h) => h.page === page);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
      <div className="relative w-full h-full">
        {filtered.map((h) => (
          <button
            key={h.id}
            type="button"
            className="absolute border-2 border-dashed border-[#5b8fb9]/50 rounded bg-[#5b8fb9]/5 hover:bg-[#5b8fb9]/15 transition-colors cursor-pointer pointer-events-auto"
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            onClick={() => setActiveId(activeId === h.id ? null : h.id)}
            title={h.label}
            aria-label={h.label ?? "Interactive hotspot"}
          />
        ))}
        {filtered.map((h) =>
          activeId === h.id && h.label ? (
            <div
              key={`bubble-${h.id}`}
              className="absolute z-10 px-3 py-2 text-sm bg-white border border-[#5b8fb9] rounded-lg shadow-lg pointer-events-auto"
              style={{
                left: `${h.left}%`,
                top: `${h.top + h.height}%`,
                width: "max(120px, 80%)",
                maxWidth: "90%",
              }}
            >
              {h.label}
              <button
                type="button"
                className="block mt-1 text-xs text-[#5b8fb9] hover:underline"
                onClick={() => setActiveId(null)}
              >
                Close
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

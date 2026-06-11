"use client";

import { useCanopyGameOptional } from "./CanopyGameContext";

export function CanopyTutorialStartButton({ compact }: { compact?: boolean }) {
  const game = useCanopyGameOptional();

  if (!game) return null;

  const baseClasses =
    "rounded bg-[#f97316] px-3 py-1.5 font-ui text-sm font-semibold text-white shadow-md hover:bg-[#ea580c] hover:shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#1a5092] focus:ring-white";

  return (
    <button
      type="button"
      className={
        compact
          ? `${baseClasses} w-[130px] shrink-0 px-3 py-1.5 text-center whitespace-nowrap`
          : `${baseClasses} inline-flex items-center justify-center`
      }
      onClick={() => {
        game.startGame({ mode: "tutorial" });
      }}
    >
      Tutorial
    </button>
  );
}


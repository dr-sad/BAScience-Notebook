"use client";

import { useCanopyGameOptional } from "./CanopyGameContext";

interface CanopyGameStartButtonProps {
  /** Use when embedding inside a tight space (e.g. info box) */
  compact?: boolean;
}

export function CanopyGameStartButton({ compact }: CanopyGameStartButtonProps = {}) {
  const game = useCanopyGameOptional();
  if (!game) return null;
  return (
    <button
      type="button"
      onClick={() => game.startGame()}
      className={
        compact
          ? "w-[130px] shrink-0 rounded bg-[#36ae71] px-3 py-1.5 text-sm font-semibold text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg text-center whitespace-nowrap"
          : "rounded bg-[#36ae71] px-4 py-2 font-medium text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg"
      }
    >
      Me vs You
    </button>
  );
}

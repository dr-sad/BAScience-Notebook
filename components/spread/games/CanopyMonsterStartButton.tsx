"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  MONSTERS,
  MonsterId,
  useCanopyGameOptional,
} from "./CanopyGameContext";

export function CanopyMonsterStartButton() {
  const game = useCanopyGameOptional();
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterId>("grogg");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!game) return null;

  const handleStart = () => {
    game.startGame({
      mode: "human-vs-monster",
      monsterId: selectedMonster,
      player1Name: playerName.trim() || "Player 1",
    });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-[130px] shrink-0 rounded bg-[#7c3aed] px-3 py-1.5 text-sm font-semibold text-white shadow-md hover:bg-[#5b21b6] hover:shadow-lg whitespace-nowrap"
      >
        Me vs Monster
      </button>
      {open && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-sm rounded-lg bg-white p-4 shadow-lg font-ui text-sm">
            <h2 className="mb-3 text-base font-semibold text-stone-800">
              Me vs Monster
            </h2>
            <label className="mb-2 block text-stone-700">
              Your name:
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#36ae71]"
                placeholder="Player 1"
              />
            </label>
            <div className="mb-2 text-stone-700">Choose your monster:</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(Object.keys(MONSTERS) as MonsterId[]).map((id) => {
                const m = MONSTERS[id];
                const isSelected = id === selectedMonster;
                const stars = "★".repeat(m.stars) + "☆".repeat(3 - m.stars);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedMonster(id)}
                    className={`rounded border px-2 py-1 text-left text-xs shadow-md ${
                      isSelected
                        ? "border-[#36ae71] bg-[#e6f7ef] hover:shadow-lg"
                        : "border-stone-300 bg-white hover:bg-stone-50 hover:shadow-lg"
                    }`}
                  >
                    <div className="font-semibold" style={{ color: m.color }}>
                      {m.name}
                    </div>
                    <div className="text-[11px] text-stone-600">{stars}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-stone-300 px-3 py-1 text-xs text-stone-700 shadow-md hover:bg-stone-50 hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                className="rounded bg-[#36ae71] px-3 py-1 text-xs font-medium text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg"
              >
                Play
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


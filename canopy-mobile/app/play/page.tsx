"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import {
  CanopyGameProvider,
  useCanopyGameOptional,
  MONSTERS,
  type GameMode,
  type MonsterId,
} from "@/components/CanopyGameContext";
import { CanopyGame } from "@/components/CanopyGame";

function MeVsMonsterSetup({
  onStart,
}: {
  onStart: (playerName: string, monsterId: MonsterId) => void;
}) {
  const [playerName, setPlayerName] = useState("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterId>("grogg");

  const handleStart = () => {
    onStart(playerName.trim() || "Player 1", selectedMonster);
  };

  return (
    <div className="flex min-h-screen flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">Me vs Monster</h2>
      <label className="mb-3 block text-sm text-stone-700">
        Your name:
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#36ae71]"
          placeholder="Player 1"
        />
      </label>
      <p className="mb-2 text-sm text-stone-700">Choose your monster:</p>
      <div className="mb-6 grid grid-cols-2 gap-2">
        {(Object.keys(MONSTERS) as MonsterId[]).map((id) => {
          const m = MONSTERS[id];
          const isSelected = id === selectedMonster;
          const stars = "★".repeat(m.stars) + "☆".repeat(3 - m.stars);
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedMonster(id)}
              className={`rounded-xl border px-3 py-2 text-left text-sm shadow-sm ${
                isSelected
                  ? "border-[#36ae71] bg-[#e6f7ef] ring-2 ring-[#36ae71]"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
            >
              <div className="font-semibold" style={{ color: m.color }}>
                {m.name}
              </div>
              <div className="text-xs text-stone-600">{stars}</div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleStart}
        className="rounded-xl bg-[#36ae71] px-4 py-3 font-medium text-white shadow-md hover:bg-[#2d9660]"
      >
        Start game
      </button>
    </div>
  );
}

function PlayContent() {
  const searchParams = useSearchParams();
  const game = useCanopyGameOptional();
  const mode = (searchParams.get("mode") as GameMode | null) ?? "human-vs-human";
  const monsterId = searchParams.get("monster") as MonsterId | null;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!game || startedRef.current) return;
    if (mode === "human-vs-monster") return;
    startedRef.current = true;
    game.startGame({
      mode: mode === "tutorial" ? "tutorial" : "human-vs-human",
      monsterId: undefined,
    });
  }, [game, mode]);

  const showMeVsMonsterSetup =
    mode === "human-vs-monster" && game && !game.gameStarted;

  const handleMeVsMonsterStart = (playerName: string, chosenMonsterId: MonsterId) => {
    if (!game) return;
    game.startGame({
      mode: "human-vs-monster",
      monsterId: chosenMonsterId,
      player1Name: playerName,
    });
  };

  if (showMeVsMonsterSetup) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3 py-2">
          <Link
            href="/"
            className="rounded bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300"
          >
            Exit
          </Link>
          <span className="text-sm text-stone-500">Canopy</span>
          <span className="w-16" aria-hidden />
        </div>
        <main className="min-h-0 flex-1 overflow-auto">
          <MeVsMonsterSetup onStart={handleMeVsMonsterStart} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-3 py-2">
        <Link
          href="/"
          className="rounded bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300"
        >
          Exit
        </Link>
        <span className="text-sm text-stone-500">Canopy</span>
        <span className="w-16" aria-hidden />
      </div>
      <main className="min-h-0 flex-1 overflow-auto p-2">
        <CanopyGame />
      </main>
    </div>
  );
}

function PlayInner() {
  return (
    <CanopyGameProvider>
      <Suspense fallback={<div className="p-4 text-center text-stone-500">Loading…</div>}>
        <PlayContent />
      </Suspense>
    </CanopyGameProvider>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-stone-500">Loading…</div>}>
      <PlayInner />
    </Suspense>
  );
}

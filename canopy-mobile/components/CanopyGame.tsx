"use client";

import { MAX_ROUNDS, useCanopyGameOptional } from "./CanopyGameContext";

const ROWS = 16;
const COLS = 18;
const STARTER_ROW = 16;
const TOTAL_GRID_ROWS = STARTER_ROW + 1;

/** Starter circles in the bottom row: col index -> player (not clickable). */
const STARTER_COLS: { col: number; player: "player1" | "player2" }[] = [
  { col: 1, player: "player1" },
  { col: 11, player: "player1" },
  { col: 6, player: "player2" },
  { col: 16, player: "player2" },
];

export function CanopyGame() {
  const game = useCanopyGameOptional();
  if (!game) {
    return (
      <div className="canopy-game w-full max-w-full rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
        Load the Canopy spread to play.
      </div>
    );
  }

  const {
    board,
    player1SunPoints,
    player2SunPoints,
    player1Name,
    player2Name,
    player2Color,
    edges,
    turnPhase,
    round,
    sunlightAnimationActive,
    placeLeaf,
    doneWithTurn,
    onSunlightAnimationComplete,
    canPlace,
    canPlaceIgnoringTutorial,
    mode,
    tutorialArrows,
  } = game;

  const isPlacing =
    !sunlightAnimationActive &&
    (turnPhase === "player1-placing" || turnPhase === "player2-placing");

  const handleCellClick = (row: number, col: number) => {
    if (!isPlacing || !canPlace(row, col)) return;
    placeLeaf(row, col);
  };

  return (
    <div className="canopy-game w-full max-w-full overflow-hidden rounded border border-stone-200 bg-stone-50">
      {/* SUNLIGHT band */}
      <div
        className="flex items-center justify-center py-2 font-header text-lg uppercase tracking-wide text-red-700"
        style={{
          backgroundColor: "#ffe600",
          borderBottom: "3px solid #e8d76b",
        }}
      >
        SUNLIGHT
      </div>
      <div
        className="h-1 shrink-0"
        style={{
          backgroundColor: "#ffe600",
          marginTop: "-2px",
        }}
      />

      {/* Board wrapper with optional sunlight animation overlay */}
      <div className="w-full">
        <div className="relative">
          {/* Connecting lines overlay */}
          <svg
            className="pointer-events-none absolute inset-0 z-10"
            viewBox={`0 0 ${COLS} ${TOTAL_GRID_ROWS}`}
            preserveAspectRatio="none"
          >
            {mode === "tutorial" &&
              tutorialArrows &&
              tutorialArrows.map((cell, index) => {
                const cx = cell.col + 0.5;
                const cy = cell.row + 0.5;
                return (
                  <g
                    key={`arrow-${index}`}
                    className="canopy-tutorial-arrow"
                  >
                    {/* Tail */}
                    <line
                      x1={cx}
                      y1={cy - 1.1}
                      x2={cx}
                      y2={cy - 0.7}
                      stroke="#000000"
                      strokeWidth={0.15}
                      strokeLinecap="round"
                    />
                    {/* Arrow head */}
                    <polygon
                      points={`${cx},${cy - 0.1} ${cx - 0.35},${cy - 0.7} ${cx + 0.35},${cy - 0.7}`}
                      fill="#000000"
                    />
                  </g>
                );
              })}
            {STARTER_COLS.map((starter) => {
              const cx = starter.col + 0.5;
              const cy = STARTER_ROW + 0.5;
              const stroke =
                starter.player === "player1" ? "#e07c3c" : player2Color;
              return (
                <line
                  key={`starter-soil-${starter.col}`}
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={TOTAL_GRID_ROWS}
                  stroke={stroke}
                  strokeWidth={0.2}
                  strokeLinecap="round"
                />
              );
            })}
            {edges.map((edge, index) => (
              <line
                key={index}
                x1={edge.fromCol + 0.5}
                y1={edge.fromRow + 0.5}
                x2={edge.toCol + 0.5}
                y2={edge.toRow + 0.5}
                stroke={edge.player === "player1" ? "#e07c3c" : player2Color}
                strokeWidth={0.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${TOTAL_GRID_ROWS}, minmax(0, 1fr))`,
              aspectRatio: `${COLS} / ${TOTAL_GRID_ROWS}`,
              maxHeight: "560px",
              gap: 0,
            }}
          >
          {Array.from({ length: TOTAL_GRID_ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => {
              const cellClass =
                "flex items-center justify-center min-w-0 min-h-0";
              if (row < ROWS) {
                const owner = board[row][col];
                const valid = isPlacing && canPlace(row, col);

                // Determine faint hover fill based on current turn.
                // In tutorial steps, show hover for any base-legal grow (straight or diagonal),
                // even if clicks are restricted by the tutorial.
                let hoverFillClass = "";
                const isTutorialPlayer1Turn =
                  mode === "tutorial" && turnPhase === "player1-placing";

                const hoverIsPlaceable =
                  owner === null &&
                  isPlacing &&
                  (isTutorialPlayer1Turn
                    ? canPlaceIgnoringTutorial(row, col)
                    : valid);

                if (hoverIsPlaceable) {
                  if (turnPhase === "player1-placing") {
                    hoverFillClass = " hover:bg-[#f7c9a2]";
                  } else if (turnPhase === "player2-placing") {
                    hoverFillClass = " hover:bg-[#b3c7e4]";
                  }
                }

                return (
                  <div
                    key={`${row}-${col}`}
                    className={cellClass}
                    style={{
                      backgroundColor:
                        col % 2 === 0 ? "#fef9e6" : "#fff9d6",
                    }}
                  >
                    <button
                      type="button"
                      className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 border-green-600 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-400${
                        valid ? " cursor-pointer" : " cursor-default"
                      }${hoverFillClass}`}
                      style={{
                        backgroundColor:
                          owner === "player1"
                            ? "#e07c3c"
                            : owner === "player2"
                              ? player2Color
                              : undefined,
                        borderColor: owner ? "transparent" : undefined,
                        margin: "clamp(0.125rem, 1vw, 0.375rem)",
                      }}
                      onClick={() => handleCellClick(row, col)}
                      disabled={!valid}
                      aria-label={`Row ${row + 1}, column ${col + 1}${
                        owner ? `, ${owner}` : ", empty"
                      }${valid ? ", placeable" : ""}`}
                    />
                  </div>
                );
              }
              // Starter row
              const starter = STARTER_COLS.find((s) => s.col === col);
              if (starter) {
                return (
                  <div
                    key={`${row}-${col}`}
                    className={cellClass}
                    style={{
                      backgroundColor:
                        col % 2 === 0 ? "#fef9e6" : "#fff9d6",
                    }}
                  >
                    <div
                      className="h-[18px] w-[18px] shrink-0 rounded-full border-0"
                      style={{
                        backgroundColor:
                          starter.player === "player1"
                            ? "#e07c3c"
                            : player2Color,
                        margin: "clamp(0.125rem, 1vw, 0.375rem)",
                      }}
                      aria-hidden
                    />
                  </div>
                );
              }
              return (
                <div
                  key={`${row}-${col}`}
                  className={cellClass}
                  aria-hidden
                  style={{
                    backgroundColor:
                      col % 2 === 0 ? "#fef9e6" : "#fff9d6",
                  }}
                >
                  <div
                    className="h-[18px] w-[18px] shrink-0 rounded-full border-0 bg-transparent"
                    style={{
                      visibility: "hidden",
                      margin: "clamp(0.125rem, 1vw, 0.375rem)",
                    }}
                  />
                </div>
              );
            })
          )}
          </div>
          {sunlightAnimationActive && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ zIndex: 10 }}
              aria-hidden
            >
              <div
                className="absolute left-0 right-0 top-0 h-8 opacity-90"
                style={{
                  backgroundColor: "#ffe600",
                  boxShadow: "0 0 12px rgba(255,230,0,0.6)",
                  animation: "canopy-sunlight-sweep 1.25s ease-in-out forwards",
                }}
                onAnimationEnd={onSunlightAnimationComplete}
              />
            </div>
          )}
        </div>
      </div>

      {/* SOIL band */}
      <div
        className="flex items-center justify-center py-2 font-header text-lg uppercase tracking-wide"
        style={{
          backgroundColor: "#6b4423",
          color: "#a67c52",
          marginTop: "-1px",
        }}
      >
        SOIL
      </div>

      {/* Round, sun points, and Done — separate window below the board */}
      <div className="mt-5 px-1 pb-1">
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 font-ui text-sm shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="text-stone-600 font-medium">
              Round {round} of {MAX_ROUNDS}
            </span>
            <span className="text-stone-700">
              {player1Name}: <strong>{player1SunPoints}</strong> sun pts
            </span>
            <span className="text-stone-700">
              {player2Name}: <strong>{player2SunPoints}</strong> sun pts
            </span>
          </div>
          {isPlacing && (
            <button
              type="button"
              onClick={doneWithTurn}
              className="rounded bg-[#36ae71] px-3 py-1.5 font-medium text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

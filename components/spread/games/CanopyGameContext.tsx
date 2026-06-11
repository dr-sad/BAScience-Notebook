"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const ROWS = 16;
const COLS = 18;
const STARTER_ROW = 16;

export const MAX_ROUNDS = 10;

export type CellOwner = null | "player1" | "player2";

const STARTER_COLS: { col: number; player: "player1" | "player2" }[] = [
  { col: 1, player: "player1" },
  { col: 11, player: "player1" },
  { col: 6, player: "player2" },
  { col: 16, player: "player2" },
];

function createEmptyBoard(): CellOwner[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

type Board = CellOwner[][];

export type TurnPhase = "idle" | "player1-placing" | "player2-placing";

type GameMode = "human-vs-human" | "human-vs-monster" | "tutorial";

type TutorialStep =
  | null
  | "intro-starters"
  | "round1-player-placing"
  | "round1-opponent-placing"
  | "after-round1-opponent"
  | "after-round1-sunlight"
  | "after-round1-sunlight-explained"
  | "round2-pre"
  | "round2-player-diagonal"
  | "round2-opponent-diagonal"
  | "round2-sunlight"
  | "round3-pre"
  | "round3-player-placing"
  | "round3-opponent-placing"
  | "round3-sunlight"
  | "round4-pre"
  | "round4-player-placing"
  | "round4-opponent-placing"
  | "round4-sunlight"
  | "after-shade-explained"
  | "final-round-pre"
  | "final-round-player-placing"
  | "final-round-opponent-placing"
  | "final-round-sunlight"
  | "completed";

type TutorialCell = { row: number; col: number };

export type MonsterId = "grogg" | "lizzie" | "alex" | "winnie";

export const MONSTERS: Record<
  MonsterId,
  {
    name: string;
    stars: number;
    color: string;
  }
> = {
  grogg: { name: "Grogg", stars: 1, color: "#7c3aed" }, // purple
  lizzie: { name: "Lizzie", stars: 2, color: "#16a34a" }, // green
  alex: { name: "Alex", stars: 2, color: "#0f766e" }, // dark cyan
  winnie: { name: "Winnie", stars: 3, color: "#ec4899" }, // hot pink
};

type Edge = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  player: "player1" | "player2";
};

interface PopupState {
  message: string;
  open: boolean;
  variant: "info" | "result" | "name";
  /** Which player we are asking a name for, if any. */
  nameFor?: 1 | 2;
  /** Which turn phase to enter after closing an info popup. */
  nextPhaseAfterClose?: TurnPhase;
  /** Optional round label for Player 1 instruction popups. */
  roundLabel?: number;
  /** Whether to render the OK button (defaults to true). */
  hasOkButton?: boolean;
  /** Whether the backdrop should remain opaque and blocking (defaults to true). */
  backdropActive?: boolean;
}

interface StartGameOptions {
  mode?: GameMode;
  monsterId?: MonsterId;
  player1Name?: string;
}

interface CanopyGameState {
  gameStarted: boolean;
  isGameOver: boolean;
  currentPlayer: 1 | 2;
  mode: GameMode;
  monsterId: MonsterId | null;
  player1Name: string;
  player2Name: string;
  player2Color: string;
  player1SunPoints: number;
  player2SunPoints: number;
  board: CellOwner[][];
  edges: Edge[];
  popup: PopupState;
  turnPhase: TurnPhase;
  round: number;
  sunlightAnimationActive: boolean;
  tutorialStep: TutorialStep;
  tutorialAllowedCells: TutorialCell[] | null;
  tutorialArrows: TutorialCell[] | null;
  startGame: (options?: StartGameOptions) => void;
  closePopup: () => void;
  placeLeaf: (row: number, col: number) => void;
  doneWithTurn: () => void;
  onSunlightAnimationComplete: () => void;
  canPlace: (row: number, col: number) => boolean;
  canPlaceIgnoringTutorial: (row: number, col: number) => boolean;
  getPlaceCost: (row: number, col: number) => number;
}

const CanopyGameContext = createContext<CanopyGameState | null>(null);

function hasPlayerCircle(
  board: CellOwner[][],
  r: number,
  c: number,
  player: "player1" | "player2"
): boolean {
  if (r === STARTER_ROW) {
    return STARTER_COLS.some((s) => s.col === c && s.player === player);
  }
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
    return board[r][c] === player;
  }
  return false;
}

/** Count leaves with no filled circle due north (same column, rows above). Includes +2 for starter row per player. */
function countLeavesWithUnblockedSun(
  board: CellOwner[][],
  player: "player1" | "player2"
): number {
  let total = 0;

  // Count all leaves in the grid with nothing directly above them in the same column.
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== player) continue;
      let blocked = false;
      for (let i = 0; i < r; i++) {
        if (board[i][c] !== null) {
          blocked = true;
          break;
        }
      }
      if (!blocked) total++;
    }
  }

  // Also treat starter circles as potential leaves in sunlight:
  // a starter contributes a point only if there are no leaves above it
  // in its column.
  for (const starter of STARTER_COLS) {
    if (starter.player !== player) continue;
    const c = starter.col;
    let blocked = false;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c] !== null) {
        blocked = true;
        break;
      }
    }
    if (!blocked) total++;
  }

  return total;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

/** True if any player1 leaf has a player2 leaf above it in the same column (player2 is shading player1). */
function isPlayer1ShadedByPlayer2(board: Board): boolean {
  for (let c = 0; c < COLS; c++) {
    for (let r2 = 0; r2 < ROWS; r2++) {
      if (board[r2][c] !== "player1") continue;
      for (let r1 = 0; r1 < r2; r1++) {
        if (board[r1][c] === "player2") return true;
      }
    }
  }
  return false;
}

function getLegalMovesForPlayer(
  board: Board,
  player: "player1" | "player2",
  availableSunPoints: number
): { row: number; col: number; cost: number }[] {
  const moves: { row: number; col: number; cost: number }[] = [];
  if (availableSunPoints <= 0) return moves;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== null) continue;
      let cost = 0;
      if (hasPlayerCircle(board, row + 1, col, player)) {
        cost = 1;
      } else if (
        hasPlayerCircle(board, row + 1, col - 1, player) ||
        hasPlayerCircle(board, row + 1, col + 1, player)
      ) {
        cost = 2;
      }
      if (cost === 0 || cost > availableSunPoints) continue;
      moves.push({ row, col, cost });
    }
  }
  return moves;
}

function evaluateImmediateSun(board: Board): { p1: number; p2: number } {
  return {
    p1: countLeavesWithUnblockedSun(board, "player1"),
    p2: countLeavesWithUnblockedSun(board, "player2"),
  };
}

// True if a cell is in shade because there is any leaf (of either player)
// above it in the same column.
function isCellShaded(board: Board, row: number, col: number): boolean {
  for (let r = 0; r < row; r++) {
    if (board[r][col] !== null) {
      return true;
    }
  }
  return false;
}

function applyMoveToBoard(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  player: "player1" | "player2"
): Board {
  const next = cloneBoard(board);
  next[toRow][toCol] = player;
  return next;
}

function findParentForMove(
  board: Board,
  row: number,
  col: number,
  player: "player1" | "player2"
): { fromRow: number; fromCol: number } {
  let fromRow = -1;
  let fromCol = -1;
  if (hasPlayerCircle(board, row + 1, col, player)) {
    fromRow = row + 1;
    fromCol = col;
  } else if (hasPlayerCircle(board, row + 1, col - 1, player)) {
    fromRow = row + 1;
    fromCol = col - 1;
  } else if (hasPlayerCircle(board, row + 1, col + 1, player)) {
    fromRow = row + 1;
    fromCol = col + 1;
  }
  return { fromRow, fromCol };
}

export function CanopyGameProvider({ children }: { children: React.ReactNode }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [mode, setMode] = useState<GameMode>("human-vs-human");
  const [monsterId, setMonsterId] = useState<MonsterId | null>(null);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [player1SunPoints, setPlayer1SunPoints] = useState(2);
  const [player2SunPoints, setPlayer2SunPoints] = useState(2);
  const [board, setBoard] = useState<CellOwner[][]>(createEmptyBoard);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [popup, setPopup] = useState<PopupState>({
    message: "",
    open: false,
    variant: "info",
  });
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("idle");
  const [round, setRound] = useState(1);
  const [sunlightAnimationActive, setSunlightAnimationActive] = useState(false);
  const [nameInputValue, setNameInputValue] = useState("");
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(null);
  const [tutorialAllowedCells, setTutorialAllowedCells] =
    useState<TutorialCell[] | null>(null);
  const [tutorialArrows, setTutorialArrows] = useState<TutorialCell[] | null>(
    null
  );
  const [shadeSourceRound, setShadeSourceRound] = useState<number | null>(null);
  const popupMessageRef = useRef("");
  const boardRef = useRef<CellOwner[][]>(board);
  boardRef.current = board;
  const monsterMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const tutorialOpponentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const startGame = useCallback(
    (options?: StartGameOptions) => {
      const nextMode: GameMode = options?.mode ?? "human-vs-human";
      const selectedMonsterId: MonsterId | null =
        nextMode === "human-vs-monster" ? options?.monsterId ?? "grogg" : null;

      setMode(nextMode);
      setMonsterId(selectedMonsterId);

      const monsterMeta = selectedMonsterId ? MONSTERS[selectedMonsterId] : null;

      const providedName = options?.player1Name?.trim();
      const effectivePlayer1Name = providedName && providedName.length > 0 ? providedName : "Player 1";

      setGameStarted(true);
      setIsGameOver(false);
      setPlayer1Name(effectivePlayer1Name);
      setPlayer1SunPoints(2);
      setPlayer2SunPoints(2);
      setBoard(createEmptyBoard());
      setEdges([]);
      setCurrentPlayer(1);
      setRound(1);
      setSunlightAnimationActive(false);
      setNameInputValue("");
      setTurnPhase("idle");
      setTutorialStep(null);
      setTutorialAllowedCells(null);
      setTutorialArrows(null);
      setShadeSourceRound(null);

      if (nextMode === "human-vs-monster" && monsterMeta) {
        setPlayer2Name(monsterMeta.name);
        const instruction = `${effectivePlayer1Name}, choose a circle to grow a new leaf.`;
        popupMessageRef.current = instruction;
        setPopup({
          message: instruction,
          open: true,
          variant: "info",
          nameFor: undefined,
          roundLabel: 1,
          nextPhaseAfterClose: "player1-placing",
        });
      } else if (nextMode === "tutorial") {
        setPlayer2Name("Tutorial Opponent");
        popupMessageRef.current = "Player 1 (orange), what is your name?";
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "name",
          nameFor: 1,
          nextPhaseAfterClose: undefined,
        });
      } else {
        // Human vs human: ask for Player 1 name via popup if not provided
        if (!providedName) {
          setPlayer2Name("Player 2");
          popupMessageRef.current = "Player 1 (orange), what is your name?";
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "name",
            nameFor: 1,
            nextPhaseAfterClose: undefined,
          });
        } else {
          // Player 1 name was provided, continue directly to asking Player 2
          setPlayer2Name("Player 2");
          popupMessageRef.current = "Player 2 (blue), what is your name?";
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "name",
            nameFor: 2,
            nextPhaseAfterClose: undefined,
          });
        }
      }
    },
    []
  );

  const closePopup = useCallback(() => {
    // Tutorial-specific flow overrides generic close behavior
    if (mode === "tutorial") {
      if (tutorialStep === "intro-starters") {
        // After first explanation, hide arrows and show sun-points instruction popup
        setTutorialArrows(null);

        const message =
          "You have two leaves with sunlight shining on them, so you have 2 sun points. Use sun points to grow each of your plants straight upwards.";

        // Allow only the two cells directly above the orange starters
        const allowed: TutorialCell[] = STARTER_COLS.filter(
          (s) => s.player === "player1"
        ).map((s) => ({
          row: STARTER_ROW - 1,
          col: s.col,
        }));
        setTutorialAllowedCells(allowed);
        setTutorialStep("round1-player-placing");
        setTurnPhase("player1-placing");

        setPopup({
          message,
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: false,
          backdropActive: true,
        });

        // After 2s, fade the backdrop so the board is clickable
        setTimeout(() => {
          setPopup((current) => {
            if (!current.open || current.message !== message) return current;
            return { ...current, backdropActive: false };
          });
        }, 2000);
        return;
      }

      if (tutorialStep === "after-round1-sunlight-explained") {
        // After explaining sunlight scoring, advance to Round 2 and show heading popup
        setPopup((p) => ({ ...p, open: false }));
        const nextRound = 2;
        setRound(nextRound);
        setTutorialStep("round2-pre");
        popupMessageRef.current = "Round 2, choose a circle to grow a new leaf";
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "info",
          nameFor: undefined,
          roundLabel: nextRound,
          hasOkButton: true,
        });
        return;
      }

      if (tutorialStep === "after-round1-opponent") {
        // After explaining opponent's choices, run sunlight for Round 1
        setPopup((p) => ({ ...p, open: false }));
        setTutorialStep("after-round1-sunlight");
        setSunlightAnimationActive(true);
        return;
      }

      if (tutorialStep === "round2-pre") {
        // After Round 2 heading popup, delay then show diagonal instruction without OK
        setPopup((p) => ({ ...p, open: false }));

        setTimeout(() => {
          const message =
            "Plants can also grow diagonally. But this costs 2 sun points. Try it.";

          // Compute all diagonal-only targets for Player 1 (block straight-up moves)
          const boardSnapshot = boardRef.current;
          const diagonalTargets: TutorialCell[] = [];
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              if (boardSnapshot[r][c] !== "player1") continue;
              const upLeftRow = r - 1;
              const upRightRow = r - 1;
              const upLeftCol = c - 1;
              const upRightCol = c + 1;

              if (
                upLeftRow >= 0 &&
                upLeftCol >= 0 &&
                boardSnapshot[upLeftRow][upLeftCol] === null
              ) {
                diagonalTargets.push({ row: upLeftRow, col: upLeftCol });
              }
              if (
                upRightRow >= 0 &&
                upRightCol < COLS &&
                boardSnapshot[upRightRow][upRightCol] === null
              ) {
                diagonalTargets.push({ row: upRightRow, col: upRightCol });
              }
            }
          }

          setTutorialAllowedCells(diagonalTargets);
          setTutorialStep("round2-player-diagonal");
          setTurnPhase("player1-placing");
          setPopup({
            message,
            open: true,
            variant: "info",
            nameFor: undefined,
            hasOkButton: false,
            backdropActive: true,
          });

          // After 2s, fade the backdrop so the board is clickable
          setTimeout(() => {
            setPopup((current) => {
              if (!current.open || current.message !== message) return current;
              return { ...current, backdropActive: false };
            });
          }, 2000);
        }, 400);
        return;
      }

      if (tutorialStep === "round3-pre") {
        setPopup((p) => ({ ...p, open: false }));
        setTutorialStep("round3-player-placing");
        setTurnPhase("player1-placing");
        const message =
          "Now you have 3 sun points because at the end of round 2, the sunlight was able to reach 3 leaves. Try placing one or two new leaves.";
        setPopup({
          message,
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: false,
          backdropActive: true,
        });
        setTimeout(() => {
          setPopup((current) => {
            if (!current.open || current.message !== message) return current;
            return { ...current, backdropActive: false };
          });
        }, 2000);
        return;
      }

      if (tutorialStep === "round4-pre") {
        setPopup((p) => ({ ...p, open: false }));
        // Ensure Round 4 starts with the human player as the active player.
        setCurrentPlayer(1);
        setTutorialStep("round4-player-placing");
        setTurnPhase("player1-placing");
        return;
      }

      if (tutorialStep === "after-shade-explained") {
        setPopup((p) => ({ ...p, open: false }));
        setRound((r) => r + 1);
        setTutorialStep("final-round-pre");
        const nextR = round + 1;
        popupMessageRef.current = `Round ${nextR}, choose a circle to grow a new leaf.`;
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "info",
          nameFor: undefined,
          roundLabel: nextR,
          hasOkButton: true,
        });
        return;
      }

      if (tutorialStep === "final-round-pre") {
        setPopup((p) => ({ ...p, open: false }));
        // Ensure the final round starts with the human as the active player.
        setCurrentPlayer(1);
        setTutorialStep("final-round-player-placing");
        setTurnPhase("player1-placing");
        return;
      }
    }

    const nextPhase = popup.nextPhaseAfterClose;
    setPopup((p) => ({ ...p, open: false }));
    if (nextPhase) {
      setTurnPhase((phase) => (phase === "idle" ? nextPhase : phase));
    }
  }, [mode, popup, round, tutorialStep]);

  const submitPlayerName = useCallback(
    (rawName: string) => {
      const trimmed = rawName.trim();
      if (popup.variant !== "name" || popup.nameFor == null) return;

      if (popup.nameFor === 1) {
        if (mode === "human-vs-human") {
          const name = trimmed || "Player 1";
          setPlayer1Name(name);
          setNameInputValue("");
          popupMessageRef.current = "Player 2 (blue), what is your name?";
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "name",
            nameFor: 2,
            nextPhaseAfterClose: undefined,
          });
          return;
        }

        if (mode === "tutorial") {
          const name = trimmed || "Player 1";
          setPlayer1Name(name);
          setNameInputValue("");

          // Highlight the two orange starter circles with arrows
          const arrowCells: TutorialCell[] = STARTER_COLS.filter(
            (s) => s.player === "player1"
          ).map((s) => ({
            row: STARTER_ROW,
            col: s.col,
          }));
          setTutorialArrows(arrowCells);
          setTutorialStep("intro-starters");

          const message =
            "You and your opponent begin with two small plants. Your plants are orange. Each plant has a single leaf (circle).";
          setPopup({
            message,
            open: true,
            variant: "info",
            nameFor: undefined,
          });
          return;
        }

        return;
      }

      if (popup.nameFor === 2) {
        if (mode !== "human-vs-human") return;
        const name = trimmed || "Player 2";
        setPlayer2Name(name);
        setNameInputValue("");
        const instruction = `${player1Name}, choose a circle to grow a new leaf.`;
        popupMessageRef.current = instruction;
        setPopup({
          message: instruction,
          open: true,
          variant: "info",
          nameFor: undefined,
          roundLabel: 1,
          nextPhaseAfterClose: "player1-placing",
        });
      }
    },
    [popup, player1Name]
  );

  const getPlaceCost = useCallback(
    (row: number, col: number): number => {
      const player = currentPlayer === 1 ? "player1" : "player2";
      if (hasPlayerCircle(board, row + 1, col, player)) return 1;
      if (
        hasPlayerCircle(board, row + 1, col - 1, player) ||
        hasPlayerCircle(board, row + 1, col + 1, player)
      ) {
        return 2;
      }
      return 0;
    },
    [board, currentPlayer]
  );

  const canPlaceIgnoringTutorial = useCallback(
    (row: number, col: number): boolean => {
      if (!gameStarted || isGameOver) return false;
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      if (board[row][col] !== null) return false;

      const player = currentPlayer === 1 ? "player1" : "player2";
      const hasN = hasPlayerCircle(board, row + 1, col, player);
      const hasNW = hasPlayerCircle(board, row + 1, col - 1, player);
      const hasNE = hasPlayerCircle(board, row + 1, col + 1, player);
      if (!hasN && !hasNW && !hasNE) return false;
      const cost = getPlaceCost(row, col);
      const points =
        currentPlayer === 1 ? player1SunPoints : player2SunPoints;
      return points >= cost;
    },
    [
      board,
      currentPlayer,
      player1SunPoints,
      player2SunPoints,
      getPlaceCost,
      gameStarted,
      isGameOver,
    ]
  );

  const canPlace = useCallback(
    (row: number, col: number): boolean => {
      // Tutorial: restrict placement to the scripted allowed cells
      if (mode === "tutorial") {
        if (
          tutorialStep === "round1-player-placing" ||
          tutorialStep === "round2-player-diagonal"
        ) {
          if (!tutorialAllowedCells) return false;
          return tutorialAllowedCells.some(
            (cell) => cell.row === row && cell.col === col
          );
        }
        if (
          tutorialStep === "round3-player-placing" ||
          tutorialStep === "round4-player-placing" ||
          tutorialStep === "final-round-player-placing"
        ) {
          return canPlaceIgnoringTutorial(row, col);
        }
        // In all other tutorial steps, the player should not be able to place
        return false;
      }

      return canPlaceIgnoringTutorial(row, col);
    },
    [mode, tutorialAllowedCells, tutorialStep, canPlaceIgnoringTutorial]
  );

  const placeLeaf = useCallback(
    (row: number, col: number) => {
      if (!gameStarted || isGameOver) return;
      if (!canPlace(row, col)) return;
      const cost = getPlaceCost(row, col);
      const player = currentPlayer === 1 ? "player1" : "player2";

      // Tutorial: detect when the human places directly above an opponent leaf
      // (same column, one row higher). This is used to show a shade explanation
      // popup about the opponent's leaf, and to trigger the \"one more round\"
      // rule before ending the tutorial.
      const placedAboveOpponent =
        mode === "tutorial" &&
        currentPlayer === 1 &&
        row + 1 < ROWS &&
        board[row + 1][col] === "player2";

       // Determine the parent circle this new leaf connects to
       let fromRow = -1;
       let fromCol = -1;
       const owner = player;
       if (hasPlayerCircle(board, row + 1, col, owner)) {
         fromRow = row + 1;
         fromCol = col;
       } else if (hasPlayerCircle(board, row + 1, col - 1, owner)) {
         fromRow = row + 1;
         fromCol = col - 1;
       } else if (hasPlayerCircle(board, row + 1, col + 1, owner)) {
         fromRow = row + 1;
         fromCol = col + 1;
       }

      setBoard((prev) =>
        prev.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? player : c))
            : r
        )
      );

      if (fromRow !== -1 && fromCol !== -1) {
        setEdges((prev) => [
          ...prev,
          { fromRow, fromCol, toRow: row, toCol: col, player: owner },
        ]);
      }

      // Tutorial-specific progression logic
      if (mode === "tutorial") {
        if (tutorialStep === "round1-player-placing") {
          const remainingAllowed =
            tutorialAllowedCells?.filter(
              (cell) => !(cell.row === row && cell.col === col)
            ) ?? [];
          if (remainingAllowed.length === 0) {
            // Both required circles have been filled; proceed to opponent's scripted turn
            setTutorialAllowedCells(null);
            setTutorialStep("round1-opponent-placing");
            setPopup((p) => ({ ...p, open: false }));
            // Run opponent's scripted Round 1 after the state update
            setTimeout(() => {
              runTutorialOpponentRound1();
            }, 0);
          } else {
            setTutorialAllowedCells(remainingAllowed);
          }
        } else if (tutorialStep === "round2-player-diagonal") {
          // Player has placed the one required diagonal leaf
          setTutorialAllowedCells(null);
          setTutorialStep("round2-opponent-diagonal");
          setPopup((p) => ({ ...p, open: false }));
          setTimeout(() => {
            runTutorialOpponentDiagonal();
          }, 0);
        }
      }
      if (mode === "tutorial") {
        // In tutorial mode, we manually manage sun points. For later rounds,
        // when the player has spent all points, automatically advance to
        // the opponent's scripted turn (as if Skip was pressed).
        if (currentPlayer === 1) {
          setPlayer1SunPoints((prev) => {
            const next = prev - cost;
            if (
              (tutorialStep === "round3-player-placing" ||
                tutorialStep === "round4-player-placing" ||
                tutorialStep === "final-round-player-placing") &&
              next <= 0
            ) {
              setTimeout(() => {
                setPopup((p) => ({ ...p, open: false }));
                doneWithTurn();
              }, 0);
            }
            return next;
          });
        } else {
          setPlayer2SunPoints((p) => p - cost);
        }

        if (placedAboveOpponent) {
          if (shadeSourceRound === null) {
            setShadeSourceRound(round);
          }
          popupMessageRef.current =
            "Nice! You've placed a leaf above your opponent's leaf. The shaded leaf will not earn a sun point in the next round because the sunlight can no longer reach it.";
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "info",
            nameFor: undefined,
            hasOkButton: true,
          });
        }

        return;
      }

      if (currentPlayer === 1) {
        setPlayer1SunPoints((p) => {
          const next = p - cost;
          if (next === 0) {
            setTimeout(() => {
              // Auto-advance as if the player clicked Done
              doneWithTurn();
            }, 0);
          }
          return next;
        });
      } else {
        setPlayer2SunPoints((p) => {
          const next = p - cost;
          if (next === 0) {
            setTimeout(() => {
              doneWithTurn();
            }, 0);
          }
          return next;
        });
      }
    },
    [
      currentPlayer,
      canPlace,
      getPlaceCost,
      gameStarted,
      isGameOver,
      mode,
      tutorialStep,
      // intentionally not including doneWithTurn to avoid
      // temporal-dead-zone issues; it's stable via useCallback.
    ]
  );

  const chooseMonsterMove = useCallback(
    (
      boardSnapshot: Board,
      monster: MonsterId,
      availableSunPoints: number
    ): { row: number; col: number; cost: number } | null => {
      // How much Player 2 already occupies each column (including starters)
      const colUsage: number[] = Array(COLS).fill(0);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (boardSnapshot[r][c] === "player2") {
            colUsage[c]++;
          }
        }
      }
      for (const starter of STARTER_COLS) {
        if (starter.player === "player2") {
          colUsage[starter.col]++;
        }
      }

      const moves = getLegalMovesForPlayer(
        boardSnapshot,
        "player2",
        availableSunPoints
      );
      if (moves.length === 0) return null;

      const scored: { move: { row: number; col: number; cost: number }; score: number }[] =
        [];

      for (const move of moves) {
        const { row, col, cost } = move;
        const heightScore = ROWS - row;
        const boardAfter = applyMoveToBoard(
          boardSnapshot,
          row + 1,
          col,
          row,
          col,
          "player2"
        );
        const sun = evaluateImmediateSun(boardAfter);
        const sunDelta = sun.p2 - sun.p1;

        const usageHere = colUsage[col];
        // Reward unused or lightly used columns to encourage using both starters
        const spreadScore =
          usageHere === 0 ? 3 : usageHere === 1 ? 1 : 0;
        const overusedPenalty =
          usageHere >= 3 ? (usageHere - 2) * 1.5 : 0;

        let score = 0;
        switch (monster) {
          case "grogg": {
            const noise = Math.random() * 2 - 1;
            score = heightScore + 0.5 * spreadScore - overusedPenalty + noise;
            break;
          }
          case "lizzie": {
            // Trap-avoider: slightly penalize moves that improve player1's sun
            const trapPenalty = sun.p1 > sun.p2 ? 5 : 0;
            score =
              heightScore +
              sun.p2 +
              0.6 * spreadScore -
              trapPenalty -
              overusedPenalty;
            break;
          }
          case "alex": {
            // Balanced: height + some sun advantage
            score =
              0.4 * heightScore +
              0.6 * spreadScore +
              0.75 * sunDelta -
              overusedPenalty;
            break;
          }
          case "winnie": {
            // Strongest: focus more on sun advantage
            score =
              heightScore * 0.2 +
              spreadScore * 0.3 +
              sunDelta * 1.2 -
              overusedPenalty;
            break;
          }
        }
        scored.push({ move, score });
      }

      scored.sort((a, b) => b.score - a.score);

      if (monster === "grogg") {
        // Pick randomly from top 5 (or fewer)
        const k = Math.min(5, scored.length);
        const idx = Math.floor(Math.random() * k);
        return scored[idx].move;
      }

      if (monster === "alex") {
        // Random from top 3
        const k = Math.min(3, scored.length);
        const idx = Math.floor(Math.random() * k);
        return scored[idx].move;
      }

      if (monster === "lizzie") {
        // Prefer non-trap moves: filter out strongly negative scores if possible
        const nonTraps = scored.filter((s) => s.score >= 0);
        if (nonTraps.length > 0) {
          return nonTraps[0].move;
        }
        return scored[0].move;
      }

      // Winnie: usually best, sometimes slightly imperfect
      if (monster === "winnie") {
        const top = scored[0].move;
        if (scored.length > 1 && Math.random() < 0.15) {
          return scored[1].move;
        }
        return top;
      }

      return scored[0].move;
    },
    []
  );

  const runMonsterTurn = useCallback(() => {
    if (!monsterId) return;
    const snapshot: Board = cloneBoard(boardRef.current);
    let tempBoard = snapshot;
    let remainingSun = player2SunPoints;
    const placements: {
      row: number;
      col: number;
      fromRow: number;
      fromCol: number;
      cost: number;
    }[] = [];

    // Plan all moves for this turn using the snapshot board
    while (remainingSun > 0) {
      const move = chooseMonsterMove(tempBoard, monsterId, remainingSun);
      if (!move) break;
      const { row, col, cost } = move;

      let fromRow = -1;
      let fromCol = -1;
      if (hasPlayerCircle(tempBoard, row + 1, col, "player2")) {
        fromRow = row + 1;
        fromCol = col;
      } else if (hasPlayerCircle(tempBoard, row + 1, col - 1, "player2")) {
        fromRow = row + 1;
        fromCol = col - 1;
      } else if (hasPlayerCircle(tempBoard, row + 1, col + 1, "player2")) {
        fromRow = row + 1;
        fromCol = col + 1;
      }

      tempBoard = applyMoveToBoard(
        tempBoard,
        fromRow,
        fromCol,
        row,
        col,
        "player2"
      );

      placements.push({ row, col, fromRow, fromCol, cost });
      remainingSun -= cost;
      if (remainingSun < 1) break;
    }

    if (placements.length === 0) {
      // No moves; just start sunlight
      setSunlightAnimationActive(true);
      return;
    }

    const delayPerPlacement = 600;

    const applyPlacement = (
      index: number,
      remaining: number
    ): void => {
      if (index >= placements.length) {
        setSunlightAnimationActive(true);
        return;
      }
      const p = placements[index];

      setBoard((prev) =>
        prev.map((r, ri) =>
          ri === p.row
            ? r.map((c, ci) => (ci === p.col ? "player2" : c))
            : r
        )
      );
      if (p.fromRow !== -1 && p.fromCol !== -1) {
        setEdges((prev) => [
          ...prev,
          {
            fromRow: p.fromRow,
            fromCol: p.fromCol,
            toRow: p.row,
            toCol: p.col,
            player: "player2",
          },
        ]);
      }

      const nextRemaining = remaining - p.cost;
      setPlayer2SunPoints(nextRemaining);

      setTimeout(() => applyPlacement(index + 1, nextRemaining), delayPerPlacement);
    };

    applyPlacement(0, player2SunPoints);
  }, [chooseMonsterMove, monsterId, player2SunPoints]);

  // Scripted moves for the tutorial opponent (not a full AI), with per-placement delays.
  const runTutorialOpponentRound1 = useCallback(() => {
    // Choose one of the opponent's starter columns and grow two leaves straight up.
    const starter = STARTER_COLS.find((s) => s.player === "player2");
    if (!starter) return;
    const col = starter.col;
    const row1 = STARTER_ROW - 1;
    const row2 = STARTER_ROW - 2;

    const placements: { row: number; col: number; fromRow: number; fromCol: number }[] =
      [
        { row: row1, col, fromRow: STARTER_ROW, fromCol: col },
        { row: row2, col, fromRow: row1, fromCol: col },
      ];

    const delayPerPlacement = 600;

    const applyPlacement = (index: number): void => {
      if (index >= placements.length) {
        // After all placements, explain opponent's turn choice.
        setTutorialStep("after-round1-opponent");
        popupMessageRef.current =
          "After your turn ends, your opponent chooses how to grow their plant.";
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: true,
        });
        return;
      }

      const p = placements[index];

      setBoard((prev) =>
        prev.map((r, ri) =>
          ri === p.row
            ? r.map((c, ci) => (ci === p.col ? "player2" : c))
            : r
        )
      );

      setEdges((prev) => [
        ...prev,
        {
          fromRow: p.fromRow,
          fromCol: p.fromCol,
          toRow: p.row,
          toCol: p.col,
          player: "player2",
        },
      ]);

      // Each straight-up grow costs 1 sun point for the opponent.
      setPlayer2SunPoints((prev) => Math.max(0, prev - 1));

      setTimeout(() => applyPlacement(index + 1), delayPerPlacement);
    };

    applyPlacement(0);
  }, []);

  const runTutorialOpponentDiagonal = useCallback(() => {
    // Round 2: always grow the first (left) plant one circle diagonally to the left.
    const boardSnapshot = boardRef.current;

    // Left starter column for player2 (their first plant).
    const leftStarter = STARTER_COLS.find(
      (s) => s.player === "player2"
    );
    if (!leftStarter) {
      setTutorialStep("round2-sunlight");
      setSunlightAnimationActive(true);
      return;
    }
    const LEFT_COL = leftStarter.col;

    // Find the top-most leaf in the left starter column.
    let topRow: number | null = null;
    for (let r = 0; r < ROWS; r++) {
      if (boardSnapshot[r][LEFT_COL] === "player2") {
        topRow = r;
        break;
      }
    }

    if (topRow == null) {
      setTutorialStep("round2-sunlight");
      setSunlightAnimationActive(true);
      return;
    }

    const targetRow = topRow - 1;
    const targetCol = LEFT_COL - 1;

    if (
      targetRow < 0 ||
      targetCol < 0 ||
      boardSnapshot[targetRow][targetCol] !== null
    ) {
      // No legal diagonal-left move; just proceed to sunlight.
      setTutorialStep("round2-sunlight");
      setSunlightAnimationActive(true);
      return;
    }

    const { fromRow, fromCol } = findParentForMove(
      boardSnapshot,
      targetRow,
      targetCol,
      "player2"
    );

    const delayPerPlacement = 600;

    const applyPlacement = (): void => {
      setBoard((prev) =>
        prev.map((r, ri) =>
          ri === targetRow
            ? r.map((c, ci) => (ci === targetCol ? "player2" : c))
            : r
        )
      );

      if (fromRow !== -1 && fromCol !== -1) {
        setEdges((prevEdges) => [
          ...prevEdges,
          {
            fromRow,
            fromCol,
            toRow: targetRow,
            toCol: targetCol,
            player: "player2",
          },
        ]);
      }

      // Diagonal costs 2 points.
      setPlayer2SunPoints((p) => Math.max(0, p - 2));
      setTutorialStep("round2-sunlight");
      setSunlightAnimationActive(true);
    };

    setTimeout(applyPlacement, delayPerPlacement);
  }, []);

  const runTutorialOpponentRound3OrLater = useCallback(
    (sunlightStep: TutorialStep, availableSunPoints: number) => {
      const boardSnapshot = boardRef.current;

      type MoveWithParent = {
        row: number;
        col: number;
        cost: number;
        fromRow: number;
        fromCol: number;
      };

      const movesToApply: MoveWithParent[] = [];
      let pointsLeft = availableSunPoints;

      if (sunlightStep === "round3-sunlight") {
        // Round 3 script:
        // - Spend 2 points to grow diagonally left from the existing leaf in column 5.
        // - Spend 1 point to grow straight up from the starter tree in column 16.

        // 1) Diagonal from column 5 -> column 4.
        const DIAG_COL = 5;
        let diagStartRow: number | null = null;
        for (let r = 0; r < ROWS; r++) {
          if (boardSnapshot[r][DIAG_COL] === "player2") {
            diagStartRow = r;
            break;
          }
        }
        if (diagStartRow != null && pointsLeft >= 2) {
          const row1 = diagStartRow - 1;
          const col1 = DIAG_COL - 1; // 4
          if (
            row1 >= 0 &&
            col1 >= 0 &&
            boardSnapshot[row1][col1] === null &&
            !isCellShaded(boardSnapshot, row1, col1)
          ) {
            const { fromRow, fromCol } = findParentForMove(
              boardSnapshot,
              row1,
              col1,
              "player2"
            );
            if (fromRow !== -1 && fromCol !== -1) {
              movesToApply.push({
                row: row1,
                col: col1,
                cost: 2,
                fromRow,
                fromCol,
              });
              pointsLeft -= 2;
            }
          }
        }

        // 2) Straight up from right starter column 16.
        const RIGHT_COL = 16;
        if (pointsLeft >= 1) {
          let rightTopRow: number = STARTER_ROW;
          for (let r = 0; r < ROWS; r++) {
            if (boardSnapshot[r][RIGHT_COL] === "player2") {
              rightTopRow = r;
              break;
            }
          }
          const upRow = rightTopRow - 1;
          const upCol = RIGHT_COL;
          if (
            upRow >= 0 &&
            boardSnapshot[upRow][upCol] === null &&
            !isCellShaded(boardSnapshot, upRow, upCol)
          ) {
            const { fromRow, fromCol } = findParentForMove(
              boardSnapshot,
              upRow,
              upCol,
              "player2"
            );
            if (fromRow !== -1 && fromCol !== -1) {
              movesToApply.push({
                row: upRow,
                col: upCol,
                cost: 1,
                fromRow,
                fromCol,
              });
              pointsLeft -= 1;
            }
          }
        }
      } else if (sunlightStep === "round4-sunlight") {
        // Round 4: prefer the scripted path (column 4 -> 3 -> 2).
        const START_COL = 4;

        // Find the top-most opponent leaf in column 4.
        let startRow: number | null = null;
        for (let r = 0; r < ROWS; r++) {
          if (boardSnapshot[r][START_COL] === "player2") {
            startRow = r;
            break;
          }
        }

        if (startRow != null) {
          const row1 = startRow - 1;
          const col1 = 3;
          if (
            row1 >= 0 &&
            col1 >= 0 &&
            boardSnapshot[row1][col1] === null &&
            !isCellShaded(boardSnapshot, row1, col1)
          ) {
            const { fromRow, fromCol } = findParentForMove(
              boardSnapshot,
              row1,
              col1,
              "player2"
            );
            if (fromRow !== -1 && fromCol !== -1) {
              movesToApply.push({
                row: row1,
                col: col1,
                cost: 2,
                fromRow,
                fromCol,
              });

              // Second diagonal from the newly created leaf: column 3 -> column 2.
              const row2 = row1 - 1;
              const col2 = 2;
              if (
                row2 >= 0 &&
                col2 >= 0 &&
                boardSnapshot[row2][col2] === null &&
                !isCellShaded(boardSnapshot, row2, col2)
              ) {
                const secondParent = findParentForMove(
                  boardSnapshot,
                  row2,
                  col2,
                  "player2"
                );
                if (
                  secondParent.fromRow !== -1 &&
                  secondParent.fromCol !== -1
                ) {
                  movesToApply.push({
                    row: row2,
                    col: col2,
                    cost: 2,
                    fromRow: secondParent.fromRow,
                    fromCol: secondParent.fromCol,
                  });
                }
              }
            }
          }
        }

        // If the scripted path is blocked (no moves were added), fall back
        // to a generic chooser that still avoids shaded cells and never
        // grows \"backwards\" into previously shaded positions. We do this
        // greedily, updating a temp board as we select each move.
        if (movesToApply.length === 0 && pointsLeft > 0) {
          const LEFT_TREE_COL = 6; // opponent's left starter column
          let tempBoard: Board = cloneBoard(boardSnapshot);

          while (pointsLeft > 0) {
            const rawMoves = getLegalMovesForPlayer(
              tempBoard,
              "player2",
              pointsLeft
            );

            const moves = rawMoves.filter(
              (m) => !isCellShaded(tempBoard, m.row, m.col)
            );
            if (moves.length === 0) break;

            const withParents: MoveWithParent[] = [];
            for (const m of moves) {
              const { fromRow, fromCol } = findParentForMove(
                tempBoard,
                m.row,
                m.col,
                "player2"
              );
              if (fromRow === -1 || fromCol === -1) continue;
              withParents.push({
                row: m.row,
                col: m.col,
                cost: m.cost,
                fromRow,
                fromCol,
              });
            }
            if (withParents.length === 0) break;

            const scored = withParents.map((m) => {
              const fromLeftTree = m.fromCol === LEFT_TREE_COL;
              const diagonalLeft = m.col === m.fromCol - 1;
              const score = (fromLeftTree ? 2 : 0) + (diagonalLeft ? 1 : 0);
              return { m, score };
            });
            scored.sort((a, b) => b.score - a.score || a.m.row - b.m.row);

            const best = scored.find(({ m }) => m.cost <= pointsLeft);
            if (!best) break;

            const chosen = best.m;
            movesToApply.push(chosen);
            pointsLeft -= chosen.cost;

            // Apply to the temp board so subsequent choices see new shade.
            tempBoard = applyMoveToBoard(
              tempBoard,
              chosen.fromRow,
              chosen.fromCol,
              chosen.row,
              chosen.col,
              "player2"
            );
          }
        }
      } else {
        // Generic behavior for the final round (or any other step that
        // reuses this helper when not in a specifically scripted round).
        // Prefer moves from the left starter tree and diagonal-left growth,
        // and avoid shaded cells or \"backwards\" growth by simulating moves
        // on a temp board as we pick them.
        if (pointsLeft > 0) {
          const LEFT_TREE_COL = 6;
          let tempBoard: Board = cloneBoard(boardSnapshot);

          while (pointsLeft > 0) {
            const rawMoves = getLegalMovesForPlayer(
              tempBoard,
              "player2",
              pointsLeft
            );
            const moves = rawMoves.filter(
              (m) => !isCellShaded(tempBoard, m.row, m.col)
            );
            if (moves.length === 0) break;

            const withParents: MoveWithParent[] = [];
            for (const m of moves) {
              const { fromRow, fromCol } = findParentForMove(
                tempBoard,
                m.row,
                m.col,
                "player2"
              );
              if (fromRow === -1 || fromCol === -1) continue;
              withParents.push({
                row: m.row,
                col: m.col,
                cost: m.cost,
                fromRow,
                fromCol,
              });
            }
            if (withParents.length === 0) break;

            const scored = withParents.map((m) => {
              const fromLeftTree = m.fromCol === LEFT_TREE_COL;
              const diagonalLeft = m.col === m.fromCol - 1;
              const score = (fromLeftTree ? 2 : 0) + (diagonalLeft ? 1 : 0);
              return { m, score };
            });
            scored.sort((a, b) => b.score - a.score || a.m.row - b.m.row);

            const best = scored.find(({ m }) => m.cost <= pointsLeft);
            if (!best) break;

            const chosen = best.m;
            movesToApply.push(chosen);
            pointsLeft -= chosen.cost;

            tempBoard = applyMoveToBoard(
              tempBoard,
              chosen.fromRow,
              chosen.fromCol,
              chosen.row,
              chosen.col,
              "player2"
            );
          }
        }
      }

      if (movesToApply.length === 0) {
        setTutorialStep(sunlightStep);
        setSunlightAnimationActive(true);
        return;
      }

      const delayPerPlacement = 600;

      const applyPlacement = (index: number): void => {
        if (index >= movesToApply.length) {
          setTutorialStep(sunlightStep);
          setSunlightAnimationActive(true);
          return;
        }

        const p = movesToApply[index];
        setBoard((prev) =>
          prev.map((r, ri) =>
            ri === p.row
              ? r.map((c, ci) => (ci === p.col ? "player2" : c))
              : r
          )
        );
        setEdges((prev) => [
          ...prev,
          {
            fromRow: p.fromRow,
            fromCol: p.fromCol,
            toRow: p.row,
            toCol: p.col,
            player: "player2",
          },
        ]);
        setPlayer2SunPoints((prev) => Math.max(0, prev - p.cost));

        setTimeout(() => applyPlacement(index + 1), delayPerPlacement);
      };

      applyPlacement(0);
    },
    []
  );

  const doneWithTurn = useCallback(() => {
    if (mode === "tutorial") {
      if (
        tutorialStep === "round3-player-placing" ||
        tutorialStep === "round4-player-placing" ||
        tutorialStep === "final-round-player-placing"
      ) {
        setCurrentPlayer(2);
        const nextStep: TutorialStep =
          tutorialStep === "round3-player-placing"
            ? "round3-opponent-placing"
            : tutorialStep === "round4-player-placing"
              ? "round4-opponent-placing"
              : "final-round-opponent-placing";
        setTutorialStep(nextStep);
        setTurnPhase("player2-placing");
        const sunStep: TutorialStep =
          tutorialStep === "round3-player-placing"
            ? "round3-sunlight"
            : tutorialStep === "round4-player-placing"
              ? "round4-sunlight"
              : "final-round-sunlight";
        const t = setTimeout(() => {
          runTutorialOpponentRound3OrLater(sunStep, player2SunPoints);
        }, 600);
        if (tutorialOpponentTimeoutRef.current)
          clearTimeout(tutorialOpponentTimeoutRef.current);
        tutorialOpponentTimeoutRef.current = t;
        return;
      }
      return;
    }
    if (!gameStarted || isGameOver) return;
    if (currentPlayer === 2) {
      setSunlightAnimationActive(true);
      return;
    }
    const nextPlayer = 2;
    setCurrentPlayer(nextPlayer);

    if (mode === "human-vs-monster" && monsterId) {
      setTurnPhase("player2-placing");
      if (monsterMoveTimeoutRef.current) {
        clearTimeout(monsterMoveTimeoutRef.current);
      }
      monsterMoveTimeoutRef.current = setTimeout(() => {
        runMonsterTurn();
      }, 600);
    } else {
      const nextName = player2Name;
      popupMessageRef.current = `${nextName}, choose a circle to grow a new leaf.`;
      setPopup({
        message: popupMessageRef.current,
        open: true,
        variant: "info",
        nameFor: undefined,
        nextPhaseAfterClose: "player2-placing",
      });
      setTurnPhase("idle");
    }
  }, [
    currentPlayer,
    gameStarted,
    isGameOver,
    mode,
    monsterId,
    player2Name,
    player2SunPoints,
    runMonsterTurn,
    runTutorialOpponentRound3OrLater,
    tutorialStep,
  ]);

  const onSunlightAnimationComplete = useCallback(() => {
    if (!gameStarted || isGameOver) return;

    setSunlightAnimationActive(false);
    const boardSnapshot = boardRef.current;
    const p1Points = countLeavesWithUnblockedSun(boardSnapshot, "player1");
    const p2Points = countLeavesWithUnblockedSun(boardSnapshot, "player2");
    setPlayer1SunPoints(p1Points);
    setPlayer2SunPoints(p2Points);

    // Tutorial: handle tutorial-specific sunlight completion.
    if (mode === "tutorial") {
      // If a shade popup (either player shading opponent or opponent shading
      // player) has already occurred, we allow exactly one more full round
      // before ending the tutorial. That means on the first sunlight where
      // round > shadeSourceRound, we show the final popup and stop.
      if (shadeSourceRound !== null && round > shadeSourceRound) {
        setTutorialStep("completed");
        setPopup({
          message: "Tutorial has ended.",
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: true,
        });
        setTurnPhase("idle");
        return;
      }
      if (tutorialStep === "after-round1-sunlight") {
        setTutorialStep("after-round1-sunlight-explained");
        popupMessageRef.current =
          "After the end of each round, sunlight shines down and both players earn a sun point for each leaf that is in the sunlight and not blocked by any leaves above it.";
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: true,
        });
        setTurnPhase("idle");
        return;
      }
      if (tutorialStep === "round2-sunlight") {
        setRound(3);
        setTutorialStep("round3-pre");
        popupMessageRef.current = "Round 3, choose a circle to grow a new leaf.";
        setPopup({
          message: popupMessageRef.current,
          open: true,
          variant: "info",
          nameFor: undefined,
          roundLabel: 3,
          hasOkButton: true,
        });
        setTurnPhase("idle");
        return;
      }
      if (
        tutorialStep === "round3-sunlight" ||
        tutorialStep === "round4-sunlight"
      ) {
        const shaded = isPlayer1ShadedByPlayer2(boardSnapshot);
        if (shaded) {
          if (shadeSourceRound === null) {
            setShadeSourceRound(round);
          }
          setTutorialStep("after-shade-explained");
          setPopup({
            message:
              "Leaves in the shade of another tree will not receive any sunlight and will not earn sun points.",
            open: true,
            variant: "info",
            nameFor: undefined,
            hasOkButton: true,
          });
          setTurnPhase("idle");
          return;
        }
        if (tutorialStep === "round3-sunlight") {
          // Move into Round 4.
          const nextR = 4;
          setRound(nextR);
          setTutorialStep("round4-pre");
          popupMessageRef.current = `Round ${nextR}, choose a circle to grow a new leaf.`;
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "info",
            nameFor: undefined,
            roundLabel: nextR,
            hasOkButton: true,
          });
          setTurnPhase("idle");
          return;
        }
        if (tutorialStep === "round4-sunlight") {
          // Move into the final (Round 5) phase of the tutorial.
          const nextR = 5;
          setRound(nextR);
          setTutorialStep("final-round-pre");
          popupMessageRef.current = `Round ${nextR}, choose a circle to grow a new leaf.`;
          setPopup({
            message: popupMessageRef.current,
            open: true,
            variant: "info",
            nameFor: undefined,
            roundLabel: nextR,
            hasOkButton: true,
          });
          setTurnPhase("idle");
          return;
        }
      }
      if (tutorialStep === "final-round-sunlight") {
        setTutorialStep("completed");
        setPopup({
          message: "Tutorial has ended.",
          open: true,
          variant: "info",
          nameFor: undefined,
          hasOkButton: true,
        });
        setTurnPhase("idle");
        return;
      }
      return;
    }

    if (round >= MAX_ROUNDS) {
      setIsGameOver(true);
      let message: string;
      if (p1Points > p2Points) {
        message = `${player1Name} wins with ${p1Points} sun points!`;
      } else if (p2Points > p1Points) {
        message = `${player2Name} wins with ${p2Points} sun points!`;
      } else {
        message = `It’s a tie! You both have ${p1Points} sun points.`;
      }
      popupMessageRef.current = message;
      setPopup({
        message,
        open: true,
        variant: "result",
      });
      setTurnPhase("idle");
      return;
    }

    const nextRound = Math.min(round + 1, MAX_ROUNDS);
    setRound(nextRound);
    setCurrentPlayer(1);
    popupMessageRef.current = `${player1Name}, choose a circle to grow a new leaf.`;
    setPopup({
      message: popupMessageRef.current,
      open: true,
      variant: "info",
      nameFor: undefined,
      roundLabel: nextRound,
      nextPhaseAfterClose: "player1-placing",
    });
    setTurnPhase("idle");
  }, [gameStarted, isGameOver, round, player1Name, player2Name, mode, tutorialStep]);

  const value = useMemo(
    () => ({
      gameStarted,
      isGameOver,
      currentPlayer,
      mode,
      monsterId,
      player1Name,
      player2Name,
      player2Color:
        mode === "human-vs-monster" && monsterId
          ? MONSTERS[monsterId].color
          : "#1a5092",
      player1SunPoints,
      player2SunPoints,
      board,
      edges,
      popup,
      turnPhase,
      round,
      sunlightAnimationActive,
      tutorialStep,
      tutorialAllowedCells,
      tutorialArrows,
      startGame,
      closePopup,
      placeLeaf,
      doneWithTurn,
      onSunlightAnimationComplete,
      canPlace,
      canPlaceIgnoringTutorial,
      getPlaceCost,
      runTutorialOpponentRound1,
      runTutorialOpponentDiagonal,
    }),
    [
      gameStarted,
      isGameOver,
      currentPlayer,
      mode,
      monsterId,
      player1Name,
      player2Name,
      player1SunPoints,
      player2SunPoints,
      board,
      edges,
      popup,
      turnPhase,
      round,
      sunlightAnimationActive,
      tutorialStep,
      tutorialAllowedCells,
      tutorialArrows,
      startGame,
      closePopup,
      placeLeaf,
      doneWithTurn,
      onSunlightAnimationComplete,
      canPlace,
      canPlaceIgnoringTutorial,
      getPlaceCost,
    ]
  );

  return (
    <CanopyGameContext.Provider value={value}>
      {children}
      {popup.open && (
        <div
          className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-colors duration-700 ${
            popup.backdropActive === false
              ? "bg-transparent pointer-events-none"
              : "bg-black/50"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="canopy-popup-title"
        >
          <div
            className={`relative rounded-lg bg-white p-6 shadow-lg max-w-sm ${
              popup.variant === "result"
                ? "overflow-hidden border-4 border-yellow-300 shadow-xl"
                : ""
            }`}
          >
            {popup.variant === "result" && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="canopy-confetti-piece canopy-confetti-piece-1" />
                <div className="canopy-confetti-piece canopy-confetti-piece-2" />
                <div className="canopy-confetti-piece canopy-confetti-piece-3" />
              </div>
            )}
            {popup.variant === "name" ? (
              <>
                <label
                  id="canopy-popup-title"
                  className="relative block text-stone-800 font-ui mb-3 z-10"
                >
                  {popup.message}
                </label>
                <input
                  type="text"
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  className="relative z-10 mb-4 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#36ae71]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => submitPlayerName(nameInputValue)}
              className="relative z-10 w-full rounded bg-[#36ae71] px-4 py-2 font-medium text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                {typeof popup.roundLabel === "number" && (
                  <div className="relative mb-2 text-center font-ui text-2xl font-semibold text-stone-900 z-10">
                    Round {popup.roundLabel}
                  </div>
                )}
                <p
                  id="canopy-popup-title"
                  className="relative text-stone-800 font-ui mb-4 z-10"
                >
                  {popup.message}
                </p>
                {(popup.hasOkButton ?? true) && (
                  <button
                    type="button"
                    onClick={closePopup}
                    className="relative z-10 w-full rounded bg-[#36ae71] px-4 py-2 font-medium text-white shadow-md hover:bg-[#2d9660] hover:shadow-lg"
                  >
                    OK
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </CanopyGameContext.Provider>
  );
}

export function useCanopyGame(): CanopyGameState {
  const ctx = useContext(CanopyGameContext);
  if (!ctx) {
    throw new Error("useCanopyGame must be used within CanopyGameProvider");
  }
  return ctx;
}

export function useCanopyGameOptional(): CanopyGameState | null {
  return useContext(CanopyGameContext);
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type QuestionKindPerf = "mcq" | "fib" | "discussion";

export interface QuestionPerformance {
  questionNumber: number;
  kind: QuestionKindPerf;
  attempts: number;
  incorrectAttempts: number;
  correct: boolean;
  firstTryCorrect: boolean;
  lastUpdated: number;
}

export interface SpreadPerformance {
  spreadId: string;
  questions: Record<string, QuestionPerformance>;
}

export interface PerformanceState {
  spreads: Record<string, SpreadPerformance>;
}

interface PerformanceContextValue {
  state: PerformanceState;
  recordAttempt: (params: {
    spreadId: string | null | undefined;
    questionNumber: number;
    kind: QuestionKindPerf;
    isCorrect: boolean;
  }) => void;
  resetSpreadPerformance: (spreadId: string) => void;
  resetPerformance: () => void;
}

const STORAGE_KEY = "ba_motion_performance_v1";

const PerformanceContext = createContext<PerformanceContextValue | undefined>(
  undefined,
);

function loadInitialState(): PerformanceState {
  if (typeof window === "undefined") {
    return { spreads: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { spreads: {} };
    const parsed = JSON.parse(raw) as PerformanceState;
    if (!parsed || typeof parsed !== "object" || !parsed.spreads) {
      return { spreads: {} };
    }
    return parsed;
  } catch {
    return { spreads: {} };
  }
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  // Always start with empty state so server and client first render match (avoids hydration mismatch on feedback page circles).
  const [state, setState] = useState<PerformanceState>({ spreads: {} });

  useEffect(() => {
    setState(loadInitialState());
  }, []);

  // Persist to localStorage whenever state changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const recordAttempt: PerformanceContextValue["recordAttempt"] = ({
    spreadId,
    questionNumber,
    kind,
    isCorrect,
  }) => {
    if (!spreadId) return;
    setState((prev) => {
      const spreads = { ...prev.spreads };
      const existingSpread =
        spreads[spreadId] ?? ({ spreadId, questions: {} } as SpreadPerformance);
      const questionKey = String(questionNumber);
      const existingQuestion = existingSpread.questions[questionKey];

      const now = Date.now();

      // Special case: discussion questions only care about completion (isDone).
      if (kind === "discussion") {
        if (!isCorrect) {
          // For feedback, we ignore attempt counts for discussions entirely.
          return prev;
        }
        const updatedQuestion: QuestionPerformance = {
          questionNumber,
          kind,
          attempts: 1,
          incorrectAttempts: 0,
          correct: true,
          firstTryCorrect: true,
          lastUpdated: now,
        };
        const updatedSpread: SpreadPerformance = {
          ...existingSpread,
          questions: {
            ...existingSpread.questions,
            [questionKey]: updatedQuestion,
          },
        };
        return {
          spreads: {
            ...spreads,
            [spreadId]: updatedSpread,
          },
        };
      }

      const base: QuestionPerformance =
        existingQuestion ?? {
          questionNumber,
          kind,
          attempts: 0,
          incorrectAttempts: 0,
          correct: false,
          firstTryCorrect: false,
          lastUpdated: now,
        };

      const nextAttempts = base.attempts + 1;
      const nextIncorrect =
        !isCorrect && !base.correct
          ? base.incorrectAttempts + 1
          : base.incorrectAttempts;

      const nextCorrect = base.correct || isCorrect;
      const nextFirstTryCorrect =
        base.firstTryCorrect ||
        (isCorrect && base.attempts === 0 && base.incorrectAttempts === 0);

      const updatedQuestion: QuestionPerformance = {
        ...base,
        attempts: nextAttempts,
        incorrectAttempts: nextIncorrect,
        correct: nextCorrect,
        firstTryCorrect: nextFirstTryCorrect,
        lastUpdated: now,
      };

      const updatedSpread: SpreadPerformance = {
        ...existingSpread,
        questions: {
          ...existingSpread.questions,
          [questionKey]: updatedQuestion,
        },
      };

      return {
        spreads: {
          ...spreads,
          [spreadId]: updatedSpread,
        },
      };
    });
  };

  const resetSpreadPerformance: PerformanceContextValue["resetSpreadPerformance"] = (
    spreadId,
  ) => {
    setState((prev) => {
      if (!prev.spreads[spreadId]) return prev;
      const nextSpreads = { ...prev.spreads };
      delete nextSpreads[spreadId];
      return { spreads: nextSpreads };
    });
  };

  const resetPerformance = () => {
    setState({ spreads: {} });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const value = useMemo<PerformanceContextValue>(
    () => ({
      state,
      recordAttempt,
      resetSpreadPerformance,
      resetPerformance,
    }),
    [state],
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return ctx;
}


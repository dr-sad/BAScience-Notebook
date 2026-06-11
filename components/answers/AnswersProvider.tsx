"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AnswerKind = "mcq" | "fib" | "discussion";

export interface QuestionAnswerState {
  kind: AnswerKind;
  mcqSelectedId?: string;
  fibValues?: string[];
  discussionText?: string;
  lastUpdated: number;
}

export interface SpreadAnswersState {
  spreadId: string;
  questions: Record<string, QuestionAnswerState>;
}

export interface AnswersState {
  spreads: Record<string, SpreadAnswersState>;
}

interface AnswersContextValue {
  state: AnswersState;
  getAnswer: (
    spreadId: string | null | undefined,
    questionNumber: number,
  ) => QuestionAnswerState | undefined;
  setAnswer: (params: {
    spreadId: string | null | undefined;
    questionNumber: number;
    kind: AnswerKind;
    answer: Partial<
      Pick<
        QuestionAnswerState,
        "mcqSelectedId" | "fibValues" | "discussionText"
      >
    >;
  }) => void;
  resetAnswersForSpread: (spreadId: string) => void;
  resetAnswers: () => void;
}

const STORAGE_KEY = "ba_motion_answers_v1";

const AnswersContext = createContext<AnswersContextValue | undefined>(
  undefined,
);

function loadInitialState(): AnswersState {
  if (typeof window === "undefined") {
    return { spreads: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { spreads: {} };
    const parsed = JSON.parse(raw) as AnswersState;
    if (!parsed || typeof parsed !== "object" || !parsed.spreads) {
      return { spreads: {} };
    }
    return parsed;
  } catch {
    return { spreads: {} };
  }
}

export function AnswersProvider({ children }: { children: ReactNode }) {
  // Always start with empty state so server and client first render match (avoids hydration mismatch).
  const [state, setState] = useState<AnswersState>({ spreads: {} });

  useEffect(() => {
    setState(loadInitialState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const getAnswer: AnswersContextValue["getAnswer"] = (
    spreadId,
    questionNumber,
  ) => {
    if (!spreadId) return undefined;
    const spread = state.spreads[spreadId];
    if (!spread) return undefined;
    return spread.questions[String(questionNumber)];
  };

  const setAnswer: AnswersContextValue["setAnswer"] = ({
    spreadId,
    questionNumber,
    kind,
    answer,
  }) => {
    if (!spreadId) return;
    setState((prev) => {
      const spreads = { ...prev.spreads };
      const existingSpread =
        spreads[spreadId] ??
        ({
          spreadId,
          questions: {},
        } as SpreadAnswersState);
      const key = String(questionNumber);
      const existingQuestion = existingSpread.questions[key];
      const now = Date.now();

      const base: QuestionAnswerState =
        existingQuestion ?? {
          kind,
          lastUpdated: now,
        };

      const updated: QuestionAnswerState = {
        ...base,
        ...answer,
        kind,
        lastUpdated: now,
      };

      const updatedSpread: SpreadAnswersState = {
        ...existingSpread,
        questions: {
          ...existingSpread.questions,
          [key]: updated,
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

  const resetAnswersForSpread: AnswersContextValue["resetAnswersForSpread"] = (
    spreadId,
  ) => {
    setState((prev) => {
      if (!prev.spreads[spreadId]) return prev;
      const nextSpreads = { ...prev.spreads };
      delete nextSpreads[spreadId];
      return { spreads: nextSpreads };
    });
  };

  const resetAnswers = () => {
    setState({ spreads: {} });
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const value = useMemo<AnswersContextValue>(
    () => ({
      state,
      getAnswer,
      setAnswer,
      resetAnswersForSpread,
      resetAnswers,
    }),
    [state],
  );

  return (
    <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>
  );
}

export function useAnswers() {
  const ctx = useContext(AnswersContext);
  if (!ctx) {
    throw new Error("useAnswers must be used within an AnswersProvider");
  }
  return ctx;
}


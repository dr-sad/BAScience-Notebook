"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { QuestionChoice } from "@/data/spreads";
import { QuestionNumberBadge, QuestionBadgeStatus } from "./QuestionNumberBadge";
import { usePerformance } from "@/components/performance/PerformanceProvider";
import { useAnswers } from "@/components/answers/AnswersProvider";

interface MultipleChoiceQuestionProps {
  number: number;
  prompt: string;
  choices: QuestionChoice[];
  correctChoiceId?: string;
  correctMessage?: string;
  incorrectMessage?: string;
  spreadId?: string;
}

function SelectionCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#66b345"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function MultipleChoiceQuestion({
  number,
  prompt,
  choices,
  correctChoiceId,
  correctMessage,
  incorrectMessage,
  spreadId,
}: MultipleChoiceQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verification, setVerification] = useState<
    "idle" | "correct" | "incorrect"
  >("idle");
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const { state, recordAttempt } = usePerformance();
  const { getAnswer, setAnswer } = useAnswers();
  const hasHydratedFromPerf = useRef(false);

  useEffect(() => {
    const saved = getAnswer(spreadId ?? null, number);
    if (saved?.mcqSelectedId) {
      setSelectedId(saved.mcqSelectedId);
    }
    // we only want to hydrate when spreadId/number change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadId, number]);

  useEffect(() => {
    if (hasHydratedFromPerf.current) return;
    hasHydratedFromPerf.current = true;
    if (!spreadId) return;
    const spreadPerf = state.spreads[spreadId];
    const perf = spreadPerf?.questions[String(number)];
    if (!perf) return;
    if (perf.correct) {
      setVerification("correct");
    } else if (perf.attempts > 0) {
      setVerification("incorrect");
    }
    // Restoring verification from performance should not auto-show the popup.
    setPopupDismissed(true);
    setJustChecked(false);
  }, [state, spreadId, number]);

  const isCorrect =
    !!correctChoiceId && selectedId != null && selectedId === correctChoiceId;
  const canVerify = selectedId != null && !!correctChoiceId;

  const badgeStatus: QuestionBadgeStatus =
    verification === "idle"
      ? "unanswered"
      : verification === "correct"
        ? "correct"
        : "incorrect";

  function handleVerify() {
    if (!canVerify) return;
    setJustChecked(true);
    setVerification(isCorrect ? "correct" : "incorrect");
    setPopupDismissed(false);

    recordAttempt({
      spreadId: spreadId ?? null,
      questionNumber: number,
      kind: "mcq",
      isCorrect,
    });
  }

  const showPopup = justChecked && !popupDismissed && canVerify;

  if (!choices || choices.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-start gap-3 text-sm font-ui">
      <QuestionNumberBadge
        number={number}
        status={badgeStatus}
        onClick={canVerify ? handleVerify : undefined}
        ariaLabel={canVerify ? "Check answer" : undefined}
      />
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 pt-0.5">
        <span className="mr-2 whitespace-pre-line">{prompt}</span>
        <div
          role="radiogroup"
          aria-label={prompt}
          className="flex flex-wrap gap-2"
        >
          {choices.map((choice) => {
            const isSelected = choice.id === selectedId;

            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelectedId(choice.id);
                  setAnswer({
                    spreadId: spreadId ?? null,
                    questionNumber: number,
                    kind: "mcq",
                    answer: { mcqSelectedId: choice.id },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-4 py-1 bg-[#66b345] text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#66b345]"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white">
                  {isSelected && (
                    <SelectionCheckIcon className="w-3 h-3" />
                  )}
                </span>
                <span className="whitespace-nowrap">{choice.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {showPopup &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
            <div className="rounded-lg bg-white px-4 py-3 shadow-lg max-w-xs text-center">
              <p className="font-ui text-sm mb-2 text-stone-800">
                {verification === "correct"
                  ? correctMessage ?? "Correct!"
                  : incorrectMessage ?? "Try again."}
              </p>
              <button
                type="button"
                className="mt-1 rounded bg-[#5b8fb9] px-3 py-1 text-xs font-medium text-white hover:bg-[#446f94]"
                onClick={() => setPopupDismissed(true)}
              >
                OK
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}


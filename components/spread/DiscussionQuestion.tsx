"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  QuestionNumberBadge,
  type QuestionBadgeStatus,
} from "./QuestionNumberBadge";
import { usePerformance } from "@/components/performance/PerformanceProvider";
import { useAnswers } from "@/components/answers/AnswersProvider";

const DONE_MESSAGE =
  "That was a great discussion. You had good ideas to make Grogg's claim more specific. Let's move on.";

const MAX_REVISIONS = 6;

interface DiscussionQuestionProps {
  number: number;
  prompt: string;
  aiValidationKind?: "grogg-claim-revision";
  questionId?: string;
  officialSolution?: string;
  spreadId?: string;
}

export function DiscussionQuestion({
  number,
  prompt,
  aiValidationKind,
  questionId,
  officialSolution,
  spreadId,
}: DiscussionQuestionProps) {
  const [response, setResponse] = useState("");
  const [revisionCount, setRevisionCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const { state, recordAttempt } = usePerformance();
  const { getAnswer, setAnswer } = useAnswers();

  useEffect(() => {
    const saved = getAnswer(spreadId ?? null, number);
    if (saved?.discussionText) {
      setResponse(saved.discussionText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadId, number]);

  useEffect(() => {
    if (!spreadId) return;
    const spreadPerf = state.spreads[spreadId];
    const perf = spreadPerf?.questions[String(number)];
    if (perf?.correct) {
      setIsDone(true);
    }
  }, [state, spreadId, number]);

  const hasInteracted = revisionCount > 0 || isChecking;
  const badgeStatus: QuestionBadgeStatus =
    isDone ? "correct" : hasInteracted || rateLimited ? "inProgress" : "unanswered";

  const canCheck =
    !!aiValidationKind &&
    response.trim().length > 0 &&
    !isChecking &&
    !isDone;

  async function handleBadgeClick() {
    if (isDone) {
      setAiFeedback(DONE_MESSAGE);
      setPopupDismissed(false);
      return;
    }
    if (aiValidationKind !== "grogg-claim-revision") return;
    if (!response.trim()) {
      setAiFeedback("Type your idea first, then click the number again to check.");
      setPopupDismissed(false);
      return;
    }
    if (isChecking) return;

    try {
      setIsChecking(true);
      setAiFeedback(null);
      setRateLimited(false);
      const res = await fetch("/api/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          aiValidationKind,
          answerText: response.trim(),
          officialSolution,
        }),
      });

      if (!res.ok && res.status === 429) {
        const data = (await res.json().catch(() => null)) as
          | { feedback?: string }
          | null;
        setRateLimited(true);
        setAiFeedback(
          typeof data?.feedback === "string"
            ? data.feedback
            : "You’ve checked this question several times in a row. Take a moment to think about your idea, then try again.",
        );
        setPopupDismissed(false);
        return;
      }

      const data = (await res.json()) as {
        isCorrect?: boolean;
        feedback?: string;
      };

      setRevisionCount((c) => c + 1);
      const nextCount = revisionCount + 1;
      const aligned = data.isCorrect === true;
      if (aligned || nextCount >= MAX_REVISIONS) {
        setIsDone(true);
        setAiFeedback(
          aligned
            ? (typeof data.feedback === "string"
                ? data.feedback
                : DONE_MESSAGE)
            : DONE_MESSAGE,
        );
      } else {
        setAiFeedback(
          typeof data.feedback === "string"
            ? data.feedback
            : "Try adding a bit more about how Grogg could change his claim.",
        );
      }
      setPopupDismissed(false);

      if (aligned || nextCount >= MAX_REVISIONS) {
        // Only count discussion questions when they reach the done state.
        recordAttempt({
          spreadId: spreadId ?? null,
          questionNumber: number,
          kind: "discussion",
          isCorrect: true,
        });
      }
    } catch {
      setAiFeedback(
        "I couldn't check this right now. Try again in a moment or talk with your teacher.",
      );
      setPopupDismissed(false);
    } finally {
      setIsChecking(false);
    }
  }

  const showPopup =
    aiFeedback != null && !popupDismissed && !!aiValidationKind;

  return (
    <div
      className="flex items-start gap-0 text-sm font-ui"
      role="group"
      aria-label={`Discussion question ${number}: ${prompt}`}
    >
      <div className="relative z-10 flex-shrink-0 pt-0.5">
        <QuestionNumberBadge
          number={number}
          status={badgeStatus}
          onClick={
            aiValidationKind
              ? handleBadgeClick
              : undefined
          }
          ariaLabel={
            aiValidationKind
              ? isDone
                ? "View feedback"
                : canCheck
                  ? isChecking
                    ? "Checking..."
                    : "Check my thinking"
                  : response.trim()
                    ? "Check my thinking"
                    : "Type a response first"
              : undefined
          }
        />
      </div>
      <div
        className="relative z-0 -ml-2 flex-1 min-w-0 overflow-visible rounded-sm pl-5 pr-3 pt-0.5 pb-2"
        style={{ backgroundColor: "#e8f2fc" }}
      >
        <div
          className="absolute left-0 right-0 top-[-18px] z-10 flex h-[20px] w-fit min-w-[64px] items-center justify-start pl-5 pr-3 font-header text-sm uppercase tracking-wide text-white"
          style={{
            backgroundColor: "#4a8ecc",
            transform: "rotate(-1deg)",
            transformOrigin: "left center",
          }}
        >
          <span className="ml-3">DISCUSSION:</span>
        </div>
        <img
          src="/assets/art/illustrations/disc-icon-3.png"
          alt=""
          aria-hidden="true"
          className="absolute z-20 h-11 w-11 object-contain"
          style={{ left: "-10px", top: "-32px" }}
        />
        <div className="relative z-10 flex flex-col gap-2">
          <p
            className="text-sm font-ui leading-snug whitespace-pre-line"
            style={{ color: "#2c5282" }}
          >
            {prompt}
          </p>
          <div className="w-full rounded border border-stone-200 bg-white p-1.5 min-h-0">
            <textarea
              value={response}
              onChange={(e) => {
                const value = e.target.value;
                setResponse(value);
                setAnswer({
                  spreadId: spreadId ?? null,
                  questionNumber: number,
                  kind: "discussion",
                  answer: { discussionText: value },
                });
              }}
              placeholder="Type your response here..."
              className="w-full min-h-[2.75rem] max-h-[2.75rem] resize-none overflow-y-auto border-0 bg-transparent p-0 text-left text-sm font-ui leading-snug text-stone-800 placeholder:text-stone-400 outline-none"
              rows={2}
              aria-label={`Response for discussion question ${number}`}
            />
          </div>
        </div>
      </div>

      {showPopup &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
            <div className="rounded-lg bg-white px-4 py-3 shadow-lg max-w-xs text-center">
              <p className="font-ui text-sm mb-2 text-stone-800">
                {aiFeedback ?? DONE_MESSAGE}
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

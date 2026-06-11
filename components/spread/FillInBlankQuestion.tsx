"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FibValidationRule, QuestionBlank } from "@/data/spreads";
import { QuestionNumberBadge, QuestionBadgeStatus } from "./QuestionNumberBadge";
import { usePerformance } from "@/components/performance/PerformanceProvider";
import { useAnswers } from "@/components/answers/AnswersProvider";

interface FillInBlankQuestionProps {
  number: number;
  prompt: string;
  blanks: QuestionBlank[];
  validationRule?: FibValidationRule;
  correctMessage?: string;
  incorrectMessage?: string;
  layout?: "inline" | "stacked";
  aiValidationKind?: "animal-without-teeth" | "rocks-sink-evidence";
  questionId?: string;
  keypadMode?: "numeric" | "none";
  spreadId?: string;
}

const AI_VALIDATED_QUESTION_NUMBERS = new Set<number>([4, 5]);

type VerificationState = "idle" | "correct" | "incorrect";

function parseNumbers(values: string[]): number[] | null {
   const nums = values.map((v) => Number(v.trim()));
   if (nums.some((n) => Number.isNaN(n))) return null;
   return nums;
 }

 function evaluateRule(values: string[], rule?: FibValidationRule): boolean {
   if (!rule) return false;
   const nums = parseNumbers(values);
   if (!nums || nums.length < 2) return false;
   const [a, b] = nums;
   const sum = a + b;
   const product = a * b;

   if (rule === "sum_less_than_product") {
     return sum < product;
   }
   if (rule === "sum_greater_than_product") {
     return sum > product;
   }
   return false;
 }

 const FOCUS_EVENT = "fib-input-focus";

export function FillInBlankQuestion({
  number,
  prompt,
  blanks,
  validationRule,
  correctMessage,
  incorrectMessage,
  layout = "inline",
  aiValidationKind,
  questionId,
  keypadMode = "none",
  spreadId,
}: FillInBlankQuestionProps) {
  const [values, setValues] = useState<string[]>(() => blanks.map(() => ""));
  const [verification, setVerification] =
    useState<VerificationState>("idle");
  const [popupDismissed, setPopupDismissed] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
   const [showKeypad, setShowKeypad] = useState(false);
   const [focusedBlankIndex, setFocusedBlankIndex] = useState<number | null>(
     null,
   );
   const [isChecking, setIsChecking] = useState(false);
   const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const inputsContainerRef = useRef<HTMLDivElement>(null);
  const keypadRef = useRef<HTMLDivElement>(null);

  const showNumericKeypad = keypadMode !== "none";

  const { state, recordAttempt } = usePerformance();
  const { getAnswer, setAnswer } = useAnswers();
  const hasHydratedFromPerf = useRef(false);

  const isAiConfigured = !!aiValidationKind;
  const isAiValidationAllowed = AI_VALIDATED_QUESTION_NUMBERS.has(number);
  const isAiValidated = isAiConfigured && isAiValidationAllowed;

  const allFilled = useMemo(
    () => values.every((v) => v.trim() !== ""),
    [values],
  );

  const canVerify = useMemo(
    () =>
      ((isAiConfigured || isAiValidated) && allFilled) ||
      (!!validationRule && allFilled),
    [isAiConfigured, isAiValidated, validationRule, allFilled],
  );

  const isCorrect = useMemo(
    () => !!validationRule && evaluateRule(values, validationRule),
    [validationRule, values],
  );

  const badgeStatus: QuestionBadgeStatus = useMemo(() => {
    if (!allFilled) return "unanswered";

    // AI-backed questions (e.g., 4 and 5) – badge reflects verification state
    if (isAiConfigured) {
      if (rateLimited) return "inProgress";
      if (verification === "correct") return "correct";
      if (verification === "incorrect") return "incorrect";
      return "unanswered";
    }

    // Pure numeric-rule questions (e.g., 1 and 2) – require explicit click-to-check
    if (validationRule) {
      if (verification === "correct") return "correct";
      if (verification === "incorrect") return "incorrect";
      return "unanswered";
    }

    return "unanswered";
  }, [allFilled, isAiConfigured, verification, validationRule, rateLimited]);

  useEffect(() => {
    const saved = getAnswer(spreadId ?? null, number);
    if (saved?.fibValues && saved.fibValues.length === blanks.length) {
      setValues(saved.fibValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadId, number, blanks.length]);

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

  useEffect(() => {
     function handleFocusEvent(e: Event) {
       const detail = (e as CustomEvent).detail as
         | { questionNumber: number }
         | undefined;
       if (!detail) return;
       if (detail.questionNumber !== number) {
         setShowKeypad(false);
         setFocusedBlankIndex(null);
       }
     }

     window.addEventListener(FOCUS_EVENT, handleFocusEvent as EventListener);
     return () => {
       window.removeEventListener(
         FOCUS_EVENT,
         handleFocusEvent as EventListener,
       );
     };
   }, [number]);

   if (!blanks || blanks.length === 0) {
     return null;
   }

  function handleChange(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    setValues(next);

    setAnswer({
      spreadId: spreadId ?? null,
      questionNumber: number,
      kind: "fib",
      answer: { fibValues: next },
    });
    setVerification("idle");
    setPopupDismissed(false);
    setJustChecked(false);
    setRateLimited(false);
  }

   function handleInputFocus(index: number) {
     if (!showNumericKeypad) return;
     setFocusedBlankIndex(index);
     setShowKeypad(true);
     window.dispatchEvent(
       new CustomEvent(FOCUS_EVENT, { detail: { questionNumber: number } }),
     );
   }

   function handleInputBlur() {
     setTimeout(() => {
       const active = document.activeElement;
       if (
         !inputsContainerRef.current?.contains(active) &&
         !keypadRef.current?.contains(active)
       ) {
         setShowKeypad(false);
         setFocusedBlankIndex(null);
       }
     }, 0);
   }

   function handleKeypadInput(key: string) {
     if (focusedBlankIndex == null) return;
     const next = [...values];
     const current = next[focusedBlankIndex] ?? "";
     if (key === "backspace") {
       next[focusedBlankIndex] = current.slice(0, -1);
     } else {
       next[focusedBlankIndex] = current + key;
     }
     setValues(next);

     setAnswer({
       spreadId: spreadId ?? null,
       questionNumber: number,
       kind: "fib",
       answer: { fibValues: next },
     });
   }

  async function handleVerify() {
    if (!allFilled || isChecking) return;

    // AI-backed validation path
    if (isAiConfigured && !isAiValidationAllowed) {
      setVerification("incorrect");
      setAiFeedback(
        "This kind of question isn't set up for AI checking yet. Try talking with your teacher about possible answers.",
      );
      setPopupDismissed(false);
      return;
    }

    if (isAiValidated) {
      try {
        setIsChecking(true);
        setAiFeedback(null);
        setRateLimited(false);
        const answerText = values.join(" ").trim();
        const response = await fetch("/api/check-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionId,
            aiValidationKind,
            answerText,
          }),
        });

        if (!response.ok && response.status === 429) {
          const data = (await response.json().catch(() => null)) as
            | { feedback?: string }
            | null;
          setRateLimited(true);
          setJustChecked(true);
          setVerification("incorrect");
          setAiFeedback(
            typeof data?.feedback === "string"
              ? data.feedback
              : "You’ve checked this question several times in a row. Take a moment to think about your idea, then try again.",
          );
          setPopupDismissed(false);
          return;
        }

        const data = (await response.json()) as {
          isCorrect?: boolean;
          feedback?: string;
        };

        const ok = data.isCorrect === true;
        setJustChecked(true);
        setVerification(ok ? "correct" : "incorrect");
        setAiFeedback(() => {
          if (typeof data.feedback === "string") {
            return data.feedback;
          }

          // Spread 1, Q4: animal-without-teeth
          if (aiValidationKind === "animal-without-teeth") {
            if (ok) {
              return "Nice counterexample! That animal really does not have teeth, so it shows the claim isn't always true.";
            }
            return "Hold up. That idea doesn't quite give a counterexample to the claim 'All animals have teeth.' Read the question again and think of an example that would show the claim is not always true.";
          }

          // Spread 1, Q5: rocks-sink-evidence (and any future AI-backed FIB)
          if (aiValidationKind === "rocks-sink-evidence") {
            return ok
              ? "Nice evidence! That observation shows the claim about rocks sinking is not always true."
              : "Hold up. Try to think about evidence that would show the claim about rocks sinking is not always true.";
          }

          return ok ? "Correct!" : "Try again.";
        });
        setPopupDismissed(false);

        recordAttempt({
          spreadId: spreadId ?? null,
          questionNumber: number,
          kind: "fib",
          isCorrect: ok,
        });
      } catch {
        setVerification("incorrect");
        setAiFeedback(
          "I couldn't check this answer right now. Try again later or ask your teacher about animals without teeth.",
        );
        setPopupDismissed(false);
      } finally {
        setIsChecking(false);
      }
      return;
    }

    // Existing numeric rule path
    if (!validationRule) return;
    const ok = evaluateRule(values, validationRule);

    if (ok && number === 1 && validationRule === "sum_less_than_product") {
      const nums = parseNumbers(values);
      if (nums && nums.length >= 2) {
        const [a, b] = nums;
        setAiFeedback(
          `That's right. ${a} + ${b} is less than ${a} × ${b}.`,
        );
      } else {
        setAiFeedback(null);
      }
    } else if (ok && number === 2 && validationRule === "sum_greater_than_product") {
      const nums = parseNumbers(values);
      if (nums && nums.length >= 2) {
        const [a, b] = nums;
        setAiFeedback(
          `Great! ${a} + ${b} is greater than ${a} × ${b}.`,
        );
      } else {
        setAiFeedback(null);
      }
    } else {
      // For other questions, fall back to generic correct/incorrect messages.
      setAiFeedback(null);
    }

    setJustChecked(true);
    setVerification(ok ? "correct" : "incorrect");
    setPopupDismissed(false);

    recordAttempt({
      spreadId: spreadId ?? null,
      questionNumber: number,
      kind: "fib",
      isCorrect: ok,
    });
  }

  const showPopup =
    justChecked && !popupDismissed && (validationRule || isAiValidated);

   const isStacked = layout === "stacked";

   return (
   <div
      className="flex flex-wrap items-start gap-3 text-sm font-ui"
      role="group"
      aria-label={`Question ${number}: ${prompt}`}
    >
      <div className="flex-shrink-0 relative">
        <QuestionNumberBadge
          number={number}
          status={badgeStatus}
          onClick={canVerify ? handleVerify : undefined}
          ariaLabel={
            canVerify
              ? isChecking
                ? "Checking answer"
                : "Check answer"
              : undefined
          }
        />
      </div>
      <div
        className={
          isStacked
            ? "flex-1 min-w-0 flex flex-col gap-2 pt-0.5"
            : "flex-1 min-w-0 flex items-center justify-between gap-2 pt-0.5"
        }
      >
        <span className="mr-2 flex-1 whitespace-pre-line">{prompt}</span>
        {isStacked ? (
          <div ref={inputsContainerRef} className="flex w-full flex-col gap-2">
            {blanks.map((blank, index) => (
              <input
                key={blank.id}
                type="text"
                inputMode={showNumericKeypad ? "numeric" : "text"}
                maxLength={blank.maxLength}
                value={values[index] ?? ""}
                onChange={(e) => handleChange(index, e.target.value)}
                onFocus={() => handleInputFocus(index)}
                onBlur={handleInputBlur}
                aria-label={`Blank ${index + 1}`}
                className="w-full border-0 border-b border-gray-300 bg-transparent px-0.5 py-0 text-sm font-ui outline-none focus:border-[#5b8fb9]"
              />
            ))}
          </div>
        ) : (
          <div ref={inputsContainerRef} className="flex flex-shrink-0 items-center gap-2">
            {blanks.map((blank, index) => (
              <input
                key={blank.id}
                type="text"
                inputMode={showNumericKeypad ? "numeric" : "text"}
                maxLength={blank.maxLength}
                value={values[index] ?? ""}
                onChange={(e) => handleChange(index, e.target.value)}
                onFocus={() => handleInputFocus(index)}
                onBlur={handleInputBlur}
                aria-label={`Blank ${index + 1}`}
                className="border-0 border-b border-gray-300 bg-transparent px-0.5 py-0 text-sm font-ui outline-none focus:border-[#5b8fb9]"
                style={{ width: `${Math.max(blank.maxLength, 2)}ch` }}
              />
            ))}
          </div>
        )}
      </div>

      {showPopup &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
            <div className="rounded-lg bg-white px-4 py-3 shadow-lg max-w-xs text-center">
              <p className="font-ui text-sm mb-2 text-stone-800">
                {verification === "correct"
                  ? aiFeedback ??
                    correctMessage ??
                    "Correct!"
                  : aiFeedback ??
                    incorrectMessage ??
                    "Try again."}
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

      {showNumericKeypad &&
        showKeypad &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={keypadRef}
            className="fixed bottom-0 left-0 right-0 z-[80] flex flex-col items-center p-2 pb-4 bg-transparent"
          >
            <div className="inline-flex flex-col items-stretch rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-stone-200 px-3 py-2">
              <div className="grid grid-cols-3 gap-1 mb-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(
                  (digit) => (
                    <button
                      key={digit}
                      type="button"
                      className="w-10 h-8 rounded-md bg-stone-100 text-sm font-medium text-stone-800 hover:bg-stone-200"
                      onClick={() => handleKeypadInput(digit)}
                    >
                      {digit}
                    </button>
                  ),
                )}
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  className="flex-1 h-8 rounded-md bg-stone-100 text-xs font-medium text-stone-800 hover:bg-stone-200"
                  onClick={() => handleKeypadInput("backspace")}
                >
                  Backspace
                </button>
                <button
                  type="button"
                  className="flex-1 h-8 rounded-md bg-[#5b8fb9] text-xs font-medium text-white hover:bg-[#446f94]"
                  onClick={() => {
                    setShowKeypad(false);
                    setFocusedBlankIndex(null);
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
     </div>
   );
 }


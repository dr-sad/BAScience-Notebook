import type {
  PerformanceState,
  QuestionPerformance,
} from "@/components/performance/PerformanceProvider";
import { spreads } from "@/data/spreads";

export type QuestionStatus = "unanswered" | "inProgress" | "incorrect" | "correct";

export interface SpreadScoreSummary {
  spreadId: string;
  title: string;
  pageRange?: string;
  completedCount: number;
  totalQuestions: number;
  questionStatuses: QuestionStatus[];
  stars: 0 | 1 | 2 | 3;
  pending: boolean;
}

export function computeSpreadSummaries(
  state: PerformanceState,
): SpreadScoreSummary[] {
  return spreads.map((spread) => {
    const spreadPerf = state.spreads[spread.id];
    const questionsInSpread = [
      ...spread.leftPage.blocks,
      ...spread.rightPage.blocks,
    ].filter((b) => b.type === "question");

    const totalQuestions = questionsInSpread.length;
    const questionNumbers = questionsInSpread.map(
      (b: any) => b.number as number,
    );

    let completedCount = 0;
    let firstTryCount = 0;
    let correctAfterRetries = 0;
    let incompleteCount = 0;
    let incompleteMcqFib = 0;
    let mcqFibQuestions = 0;
    let allAttempted = true;
    const questionStatuses: QuestionStatus[] = [];

    for (const n of questionNumbers) {
      const key = String(n);
      const perf =
        spreadPerf?.questions[key] ??
        ({
          questionNumber: n,
          kind: "fib",
          attempts: 0,
          incorrectAttempts: 0,
          correct: false,
          firstTryCorrect: false,
          lastUpdated: 0,
        } as QuestionPerformance);

      const attempted = perf.attempts > 0;
      if (!attempted) {
        allAttempted = false;
      }

      let status: QuestionStatus;
      if (!attempted) {
        status = "unanswered";
      } else if (perf.correct) {
        status = "correct";
      } else if (perf.kind === "discussion") {
        status = "inProgress";
      } else {
        status = "incorrect";
      }
      questionStatuses.push(status);

      if (perf.correct) {
        completedCount += 1;
      } else {
        incompleteCount += 1;
      }

      if (perf.kind !== "discussion") {
        mcqFibQuestions += 1;
        if (perf.correct && perf.firstTryCorrect) {
          firstTryCount += 1;
        } else if (perf.correct && !perf.firstTryCorrect) {
          correctAfterRetries += 1;
        } else if (!perf.correct) {
          incompleteMcqFib += 1;
        }
      }
    }

    let stars: 0 | 1 | 2 | 3 = 0;
    let pending = false;

    if (!allAttempted) {
      // Show three greyed-out stars when rating is pending.
      stars = 3;
      pending = true;
    } else if (totalQuestions === 0) {
      stars = 0;
    } else {
      if (incompleteCount === 0 && firstTryCount === mcqFibQuestions) {
        stars = 3;
      } else {
        const retryHeavy =
          mcqFibQuestions > 0 &&
          correctAfterRetries + incompleteMcqFib >=
            Math.ceil(0.7 * mcqFibQuestions);
        stars = retryHeavy ? 1 : 2;
      }
    }

    const pageRange =
      spread.leftPage.pageNumber !== undefined &&
      spread.rightPage.pageNumber !== undefined
        ? `${spread.leftPage.pageNumber}–${spread.rightPage.pageNumber}`
        : undefined;

    const title = spread.leftPage.headerTitle
      ? spread.leftPage.headerTitle
      : `Spread ${spread.id}`;

    return {
      spreadId: spread.id,
      title,
      pageRange,
      completedCount,
      totalQuestions,
      questionStatuses,
      stars,
      pending,
    };
  });
}


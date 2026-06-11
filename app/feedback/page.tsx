"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePerformance } from "@/components/performance/PerformanceProvider";
import { useAnswers } from "@/components/answers/AnswersProvider";
import { computeSpreadSummaries } from "@/components/feedback/scoring";

function Stars({
  stars,
  pending,
}: {
  stars: 0 | 1 | 2 | 3;
  pending: boolean;
}) {
  const filledClass = pending ? "text-gray-300" : "text-amber-400";
  const emptyClass = "text-gray-300";
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={i <= stars && !pending ? filledClass : emptyClass}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const { state, resetPerformance, resetSpreadPerformance } = usePerformance();
  const { resetAnswers, resetAnswersForSpread } = useAnswers();

  const summaries = computeSpreadSummaries(state);

  const handleRetryChapter = () => {
    if (
      window.confirm(
        "This will reset your feedback for this chapter so you can try again. Continue?",
      )
    ) {
      resetPerformance();
      resetAnswers();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-100">
      <main className="max-w-xl w-full text-center space-y-4">
        <h1 className="font-header text-2xl font-bold text-gray-900 mb-1">
          Beast Academy Science
        </h1>
        <p className="text-lg text-gray-600">
          Motion · Chapter 2: Evidence
        </p>
        <p className="text-sm text-gray-500">
          This page shows how many questions you&apos;ve completed in each chapter.
          <br />
          Once you have attempted all the questions in a section, you will earn
          stars. The more questions you answer correctly on your first try, the
          more stars you will earn!
        </p>

        <div className="mt-6 space-y-4 text-left">
          {summaries.map((s) => (
            <div
              key={s.spreadId}
              className="flex items-stretch justify-between gap-2"
            >
              <section className="flex-1 rounded-lg border border-stone-300 bg-white/80 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-ui text-sm font-semibold text-stone-800">
                      {s.title}
                    </h2>
                    {s.pageRange && (
                      <p className="text-[11px] text-stone-500">
                        Pages {s.pageRange}
                      </p>
                    )}
                  </div>
                  <Stars stars={s.stars} pending={s.pending} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-1 mt-1">
                    {s.questionStatuses.map((status, idx) => (
                      <div
                        key={idx}
                        className={
                          "w-3 h-3 rounded-full border border-white " +
                          (status === "correct"
                            ? "bg-[#66b345]"
                            : status === "incorrect"
                            ? "bg-red-500"
                            : status === "inProgress"
                            ? "bg-amber-400"
                            : "bg-gray-300")
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-600">
                    <span className="font-semibold">Completed questions:</span>{" "}
                    {s.completedCount} of {s.totalQuestions}
                  </p>
                </div>
              </section>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "This will reset your answers and feedback for this page so you can try again. Continue?",
                      )
                    ) {
                      resetSpreadPerformance(s.spreadId);
                      resetAnswersForSpread(s.spreadId);
                      router.push(`/spread/${s.spreadId}`);
                    }
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded bg-[#5b8fb9] px-3 py-2 text-xs font-medium text-white hover:bg-[#446f94]"
                >
                  Retry page
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleRetryChapter}
            className="inline-flex items-center justify-center rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Retry chapter
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium font-ui text-[#5b8fb9] hover:underline"
          >
            ← Back to spreads
          </Link>
        </div>
      </main>
    </div>
  );
}


"use client";

import Link from "next/link";
import { NarrationControls } from "./NarrationControls";

interface SpreadNavProps {
  prevSpreadId: string | null;
  nextSpreadId: string | null;
  spreadId: string;
  narrationUrl?: string;
}

export function SpreadNav({
  prevSpreadId,
  nextSpreadId,
  spreadId,
  narrationUrl,
}: SpreadNavProps) {
  return (
    <nav className="flex items-center justify-between w-full max-w-6xl mt-6 gap-4">
      <div className="w-28">
        {prevSpreadId ? (
          <Link
            href={`/spread/${prevSpreadId}`}
            className="inline-flex items-center gap-1 text-sm font-medium font-ui text-[#5b8fb9] hover:underline"
          >
            ← Previous
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium font-ui text-gray-500 hover:underline"
          >
            ← Home
          </Link>
        )}
      </div>

      <NarrationControls narrationUrl={narrationUrl} />

      <div className="w-28 text-right space-x-2">
        {nextSpreadId ? (
          <Link
            href={`/spread/${nextSpreadId}`}
            className="inline-flex items-center gap-1 text-sm font-medium font-ui text-[#5b8fb9] hover:underline ml-auto"
          >
            Next →
          </Link>
        ) : (
          <>
            <Link
              href="/feedback"
              className="inline-flex items-center gap-1 text-sm font-medium font-ui text-[#5b8fb9] hover:underline"
            >
              Feedback →
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

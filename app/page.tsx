import Link from "next/link";
import { spreads } from "@/data/spreads";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-100">
      <main className="max-w-xl w-full text-center">
        <h1 className="font-header text-2xl font-bold text-gray-900 mb-2">
          Beast Academy Science
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Motion · Chapter 2: Evidence
        </p>
        <nav className="flex flex-col gap-3 mb-6">
          {spreads.slice(0, 2).map((spread, i) => (
            <Link
              key={spread.id}
              href={`/spread/${spread.id}`}
              className="block py-3 px-4 rounded-lg border border-[#5b8fb9] bg-white text-[#5b8fb9] font-medium font-ui hover:bg-[#5b8fb9]/10 transition-colors"
            >
              Spread {i + 1} (pages {spread.leftPage.pageNumber}–{spread.rightPage.pageNumber})
            </Link>
          ))}
        </nav>

        <p className="text-lg text-gray-600 mb-4">
          Survival · Chapter 12: Competition
        </p>
        <nav className="flex flex-col gap-3 mb-6">
          {spreads.slice(2, 3).map((spread, i) => (
            <Link
              key={spread.id}
              href={`/spread/${spread.id}`}
              className="block py-3 px-4 rounded-lg border border-[#5b8fb9] bg-white text-[#5b8fb9] font-medium font-ui hover:bg-[#5b8fb9]/10 transition-colors"
            >
              Spread {i + 3} (pages {spread.leftPage.pageNumber}–{spread.rightPage.pageNumber})
            </Link>
          ))}
        </nav>

        <div className="mt-4">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 text-sm font-medium font-ui text-[#5b8fb9] hover:underline"
          >
            View feedback
          </Link>
        </div>
      </main>
    </div>
  );
}

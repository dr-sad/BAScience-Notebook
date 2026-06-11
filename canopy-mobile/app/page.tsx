import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="mb-2 text-3xl font-bold text-stone-800">Canopy</h1>
      <p className="mb-8 text-center text-sm text-stone-600">
        Compete for sunlight in this game for two.
      </p>
      <nav className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/instructions"
          className="block rounded-xl border border-stone-200 bg-white px-6 py-4 text-center shadow-sm hover:bg-stone-50"
        >
          <span className="font-medium text-stone-800">Read the instructions</span>
          <p className="mt-1 text-xs text-stone-500">Read all the rules</p>
        </Link>
        <Link
          href="/play?mode=tutorial"
          className="block rounded-xl border border-stone-200 bg-white px-6 py-4 text-center shadow-sm hover:bg-stone-50"
        >
          <span className="font-medium text-stone-800">Play tutorial</span>
          <p className="mt-1 text-xs text-stone-500">Learn to play</p>
        </Link>
        <Link
          href="/play?mode=human-vs-human"
          className="block rounded-xl border border-stone-200 bg-white px-6 py-4 text-center shadow-sm hover:bg-stone-50"
        >
          <span className="font-medium text-stone-800">Me vs you</span>
          <p className="mt-1 text-xs text-stone-500">Play with a friend on the same device</p>
        </Link>
        <Link
          href="/play?mode=human-vs-monster"
          className="block rounded-xl border border-stone-200 bg-white px-6 py-4 text-center shadow-sm hover:bg-stone-50"
        >
          <span className="font-medium text-stone-800">Me vs monster</span>
          <p className="mt-1 text-xs text-stone-500">Play against the little monsters</p>
        </Link>
      </nav>
    </main>
  );
}

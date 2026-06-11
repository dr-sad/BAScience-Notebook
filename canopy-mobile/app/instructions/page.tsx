import type { ReactNode } from "react";
import Link from "next/link";
import {
  canopyInstructions,
  getInstructionImagePath,
} from "@/data/instructions";
import type { InstructionBlock } from "@/data/instructions";

function parseBold(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const match = remaining.match(/\*\*(.+?)\*\*/);
    if (!match) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    const before = remaining.slice(0, match.index);
    if (before) parts.push(<span key={key++}>{before}</span>);
    parts.push(<strong key={key++}>{match[1]}</strong>);
    remaining = remaining.slice((match.index ?? 0) + match[0].length);
  }
  return <>{parts}</>;
}

function Block({ block }: { block: InstructionBlock }) {
  if (block.type === "heading") {
    return (
      <header className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-stone-900 font-header">
          {block.title}
        </h1>
        <p className="mt-1 text-base text-stone-600 font-body">
          {block.subtitle}
        </p>
      </header>
    );
  }
  if (block.type === "paragraph") {
    return (
      <p className="mb-3 text-sm leading-relaxed text-stone-700 font-body">
        {parseBold(block.text)}
      </p>
    );
  }
  if (block.type === "image") {
    const src = getInstructionImagePath(block.assetId);
    return (
      <figure className="my-4">
        <img
          src={src}
          alt={block.alt}
          className="max-w-full rounded border border-stone-200"
        />
      </figure>
    );
  }
  return null;
}

export default function InstructionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="shrink-0 border-b border-stone-200 bg-white px-3 py-2">
        <Link
          href="/"
          className="inline-block rounded bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300 font-ui"
        >
          Back
        </Link>
      </div>
      <main className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-prose">
          {canopyInstructions.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
      </main>
    </div>
  );
}

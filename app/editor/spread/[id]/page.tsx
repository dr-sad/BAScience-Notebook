import { notFound } from "next/navigation";
import { getSpread, getSpreadIds } from "@/data/spreads";
import { EditorShell } from "@/components/editor/EditorShell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getSpreadIds().map((id) => ({ id }));
}

export default async function EditorSpreadPage({ params }: PageProps) {
  const { id } = await params;
  const spread = getSpread(id);

  if (!spread) {
    notFound();
  }

  const allSpreadIds = getSpreadIds();

  return (
    <EditorShell
      initialSpread={spread}
      spreadId={id}
      allSpreadIds={allSpreadIds}
    />
  );
}


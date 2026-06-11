import { notFound } from "next/navigation";
import { getSpread, getSpreadIds } from "@/data/spreads";
import { Spread } from "@/components/spread";
import { SpreadNav } from "@/components/spread/SpreadNav";
import { SpreadHintPopup } from "@/components/spread/SpreadHintPopup";
import { CanopySpreadWrapper } from "@/components/spread/games/CanopySpreadWrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getSpreadIds().map((id) => ({ id }));
}

export default async function SpreadPage({ params }: PageProps) {
  const { id } = await params;
  const spread = getSpread(id);
  if (!spread) notFound();

  const ids = getSpreadIds();
  const index = ids.indexOf(id);
  const prevId = index > 0 ? ids[index - 1] : null;
  const nextId = index < ids.length - 1 && index >= 0 ? ids[index + 1] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-100">
      <CanopySpreadWrapper spreadId={id}>
        <SpreadHintPopup spreadId={id} />
        <Spread data={spread} spreadId={id} />
        <SpreadNav
          prevSpreadId={prevId}
          nextSpreadId={nextId}
          spreadId={id}
          narrationUrl={spread.narrationUrl}
        />
      </CanopySpreadWrapper>
    </div>
  );
}

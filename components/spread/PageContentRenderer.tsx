"use client";

import type { CSSProperties } from "react";
import type { ContentBlock, FibValidationRule } from "@/data/spreads";
import { PARAGRAPH_COLOR_HEX } from "@/data/spreads";
import { getImageAsset } from "@/data/assets/images";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { FillInBlankQuestion } from "./FillInBlankQuestion";
import { DiscussionQuestion } from "./DiscussionQuestion";
import { SubheaderBar } from "./SubheaderBar";
import { CanopyGame } from "./games/CanopyGame";
import { CanopyGameStartButton } from "./games/CanopyGameStartButton";
import { CanopyMonsterStartButton } from "./games/CanopyMonsterStartButton";
import { CanopyTutorialStartButton } from "./games/CanopyTutorialStartButton";

/**
 * Escapes HTML and converts **bold** and *italic* to <strong> and <em>.
 * Run strong first so ** is not treated as two single asterisks.
 */
function parseParagraphMarkup(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

interface PageContentRendererProps {
  blocks: ContentBlock[];
  spreadId?: string;
}

export function PageContentRenderer({ blocks, spreadId }: PageContentRendererProps) {
  const flowBlocks = blocks.filter((block) => !block.position);
  const overlayBlocks = blocks.filter((block) => block.position);

  return (
    <div className="relative w-full h-full text-left text-[#333]">
      <div className="flex flex-col gap-3">
        {flowBlocks.map((block, i) => (
          <Block key={block.id ?? i} block={block} spreadId={spreadId} />
        ))}
      </div>

      {overlayBlocks.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {overlayBlocks.map((block, i) => {
            const position = block.position!;
            const style: CSSProperties = {
              left: `${position.left}%`,
              top: `${position.top}%`,
            };

            if (position.width !== undefined) {
              style.width = `${position.width}%`;
            }
            if (position.height !== undefined) {
              style.height = `${position.height}%`;
            }

            const zIndex = block.type === "image" ? 10 : 20;

            return (
              <div
                key={block.id ?? `overlay-${i}`}
                className={`absolute ${
                  block.type === "question" || block.type === "info-box"
                    ? "pointer-events-auto"
                    : ""
                }`}
                style={{ ...style, zIndex }}
              >
                <Block block={block} spreadId={spreadId} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Block({ block, spreadId }: { block: ContentBlock; spreadId?: string }) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
      const size =
        block.level === 1
          ? "text-xl font-bold"
          : block.level === 2
            ? "text-lg font-bold uppercase tracking-wide"
            : "text-base font-semibold";
      return <Tag className={`font-header ${size}`}>{block.text}</Tag>;
    }
    case "lab-game-header":
      return (
        <div className="mb-3">
          <div className="relative h-24 overflow-visible -ml-10">
            <div
              className="absolute inset-x-0 -left-10"
              style={{
                top: "16px",
                height: "96px",
                backgroundColor: "#36ae71",
                transform: "rotate(-1deg)",
                transformOrigin: "left center",
              }}
            />
            <div
              className="relative flex flex-col justify-center h-full pl-14 pr-4"
              style={{ color: "#ffffff" }}
            >
              <span className="mt-2 font-header text-3xl text-white leading-none tracking-wide">
                {block.title}
              </span>
              {block.subtitle && (
                <span
                  className="mt-0.5 text-sm font-body leading-snug"
                  style={{ color: "#ffffff" }}
                >
                  {block.subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    case "subheader":
      return <SubheaderBar text={block.text} />;
    case "paragraph": {
      const fontClass =
        block.font === "bebas"
          ? "font-header"
          : block.font === "roboto"
            ? "font-ui"
            : "font-body";
      const sizeClass =
        block.fontSize === "xs"
          ? "text-xs"
          : block.fontSize === "base"
            ? "text-base"
            : "text-sm";
      return (
        <p
          className={`${sizeClass} ${fontClass} leading-snug whitespace-pre-line`}
          style={
            block.color
              ? { color: PARAGRAPH_COLOR_HEX[block.color] }
              : undefined
          }
          dangerouslySetInnerHTML={{
            __html: parseParagraphMarkup(block.text),
          }}
        />
      );
    }
    case "list":
      return (
        <ul className="list-disc list-inside text-sm font-body leading-snug space-y-1">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "practice":
      return (
        <div className="text-sm font-ui whitespace-pre-line">
          <span className="font-semibold">{block.number}.</span> {block.text}
        </div>
      );
    case "question":
      if (block.questionKind === "multiple-choice") {
        return (
          <MultipleChoiceQuestion
            number={block.number}
            prompt={block.prompt}
            choices={block.choices}
            correctChoiceId={block.correctChoiceId}
            correctMessage={block.correctMessage}
            incorrectMessage={block.incorrectMessage}
            spreadId={spreadId}
          />
        );
      }
      if (block.questionKind === "fill-in-the-blank") {
        return (
          <FillInBlankQuestion
            number={block.number}
            prompt={block.prompt}
            blanks={block.blanks}
            validationRule={block.validationRule as FibValidationRule | undefined}
            correctMessage={block.correctMessage}
            incorrectMessage={block.incorrectMessage}
            layout={block.layout}
            aiValidationKind={block.aiValidationKind}
            questionId={block.id}
            keypadMode={block.keypadMode}
            spreadId={spreadId}
          />
        );
      }
      if (block.questionKind === "discussion") {
        return (
          <DiscussionQuestion
            number={block.number}
            prompt={block.prompt}
            aiValidationKind={block.aiValidationKind}
            questionId={block.id}
            officialSolution={block.officialSolution}
            spreadId={spreadId}
          />
        );
      }
      return null;
    case "discussion":
      return (
        <p className="text-sm font-semibold italic font-ui whitespace-pre-line">
          {block.text}
        </p>
      );
    case "grogg-note":
      return (
        <p className="text-sm font-grogg whitespace-pre-line">
          {block.text}
        </p>
      );
    case "info-box": {
      const isCanopy = block.gameId === "canopy";
      const boxWidth = isCanopy
        ? "100%"
        : `${(block.width ?? 200)}px`;
      const boxHeight = isCanopy
        ? undefined
        : `${(block.height ?? 60)}px`;

      return (
        <div
          className={`overflow-hidden p-2 font-ui text-sm text-white whitespace-pre-line flex flex-col items-center justify-center ${block.textAlign === "center" ? "text-center" : "text-left"}`}
          style={{
            backgroundColor: "#1a5092",
            width: boxWidth,
            ...(boxHeight ? { height: boxHeight } : {}),
            transform: "skewX(-2deg)",
            transformOrigin: "left center",
          }}
        >
          {isCanopy ? (
            <div className="flex w-full items-center justify-between gap-1 [transform:skewX(2deg)]">
              <div className="shrink-0 pl-2 pr-4 text-xs font-ui text-white whitespace-pre-line text-left leading-snug">
                {"Ready\nto play?"}
              </div>
              <div className="flex flex-1 items-center justify-between gap-2">
                <div className="flex-1">
                  <CanopyTutorialStartButton compact />
                </div>
                <div className="flex-1">
                  <CanopyGameStartButton compact />
                </div>
                <div className="flex-1">
                  <CanopyMonsterStartButton />
                </div>
              </div>
            </div>
          ) : (
            block.text
          )}
        </div>
      );
    }
    case "instructions":
      return (
        <div
          className="w-full overflow-visible rounded-sm p-3 pt-2 pb-3 px-3"
          style={{ backgroundColor: "#e8f2fc" }}
        >
        <div
          className="-mt-3 mb-2 flex h-[20px] w-fit min-w-[64px] items-center justify-start pl-3 pr-3 font-header text-sm uppercase tracking-wide text-white"
            style={{
              backgroundColor: "#4a8ecc",
              transform: "rotate(-1deg)",
              transformOrigin: "left center",
            }}
          >
            {block.header}
          </div>
          <p
            className="text-sm font-ui leading-snug whitespace-pre-line"
            style={{ color: "#4a8ecc" }}
          >
            {block.text}
          </p>
        </div>
      );
    case "image": {
      const asset = getImageAsset(block.assetId);
      if (!asset) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.path}
          alt={block.alt ?? ""}
          className="max-w-full h-auto block"
        />
      );
    }
    case "raw":
      return block.html ? (
        <div dangerouslySetInnerHTML={{ __html: block.html }} className="text-sm" />
      ) : null;
    case "game":
      return block.gameId === "canopy" ? (
        <CanopyGame />
      ) : null;
    case "game-control":
      return block.gameId === "canopy" ? (
        <CanopyGameStartButton />
      ) : null;
    default:
      return null;
  }
}

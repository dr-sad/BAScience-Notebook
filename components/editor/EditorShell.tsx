"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  BlockPosition,
  ContentBlock,
  Hotspot,
  ParagraphColor,
  ParagraphFont,
  ParagraphFontSize,
  QuestionBlank,
  SpreadData,
} from "@/data/spreads";
import { Spread } from "@/components/spread";
import { AssetPalette } from "./AssetPalette";
import { HeaderPalette } from "./HeaderPalette";

export type SelectedElement =
  | { kind: "block"; page: "left" | "right"; blockId: string }
  | { kind: "hotspot"; hotspotId: string }
  | null;

interface EditorShellProps {
  initialSpread: SpreadData;
  spreadId: string;
  allSpreadIds: string[];
}

const VALID_ID = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function formatSpreadAsTS(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padInner = "  ".repeat(indent + 1);
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => {
      const raw = formatSpreadAsTS(v, indent + 1);
      const rawLines = raw.split("\n");
      if (rawLines.length === 1) return padInner + raw;
      return padInner + rawLines[0] + "\n" + rawLines.slice(1).join("\n");
    });
    return "[\n" + items.join(",\n") + "\n" + pad + "]";
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj).filter(
      ([, v]) => v !== undefined,
    ) as [string, unknown][];
    if (entries.length === 0) return "{}";
    const lines = entries.map(([k, v]) => {
      const keyPart = VALID_ID.test(k) ? k : JSON.stringify(k);
      const raw = formatSpreadAsTS(v, indent + 1);
      const rawLines = raw.split("\n");
      if (rawLines.length === 1)
        return padInner + keyPart + ": " + raw;
      return (
        padInner +
        keyPart +
        ": " +
        rawLines[0] +
        "\n" +
        rawLines.slice(1).join("\n")
      );
    });
    return "{\n" + lines.join(",\n") + "\n" + pad + "}";
  }
  return "undefined";
}

/**
 * High-level layout for editor mode:
 * - Header with navigation between reader/editor and spreads.
 * - Sidebar placeholders for tools/asset palette.
 * - Center canvas reusing the existing Spread component.
 * - Right-hand inspector placeholder (to be filled in by editor-canvas-and-inspector work).
 *
 * For now, edits are kept in local state only; persistence is handled later.
 */
export function EditorShell({
  initialSpread,
  spreadId,
  allSpreadIds,
}: EditorShellProps) {
  const [workingSpread, setWorkingSpread] = useState<SpreadData>(() =>
    withBlockIds(initialSpread),
  );
  const [selected, setSelected] = useState<SelectedElement>(null);
  const [textBlockDropdownOpen, setTextBlockDropdownOpen] = useState<
    "left" | "right" | null
  >(null);

  const spreadIndex = allSpreadIds.indexOf(spreadId);
  const prevId = spreadIndex > 0 ? allSpreadIds[spreadIndex - 1] : null;
  const nextId =
    spreadIndex >= 0 && spreadIndex < allSpreadIds.length - 1
      ? allSpreadIds[spreadIndex + 1]
      : null;

  const hotspots = workingSpread.hotspots ?? [];

  const selectedDetails = useMemo(() => {
    if (!selected) return null;
    if (selected.kind === "hotspot") {
      return {
        kind: "hotspot" as const,
        hotspot: hotspots.find((h) => h.id === selected.hotspotId) ?? null,
      };
    }
    const pageBlocks =
      selected.page === "left"
        ? workingSpread.leftPage.blocks
        : workingSpread.rightPage.blocks;
    const block =
      pageBlocks.find((b) => b.id === selected.blockId) ?? null;
    return {
      kind: "block" as const,
      page: selected.page,
      block,
    };
  }, [selected, workingSpread.leftPage.blocks, workingSpread.rightPage.blocks, hotspots]);

  function handleSelectBlock(page: "left" | "right", block: ContentBlock) {
    if (!block.id) return;
    setSelected({ kind: "block", page, blockId: block.id });
  }

  function handleSelectHotspot(hotspot: Hotspot) {
    setSelected({ kind: "hotspot", hotspotId: hotspot.id });
  }

  function handleAddParagraph(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-${existingBlocks.length + 1}-${Date.now()}`;
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "paragraph",
          text: "New text",
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddLargeHeader(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const currentPage = prev[pageKey];
      return {
        ...prev,
        [pageKey]: {
          ...currentPage,
          largeHeaderBar: true,
          headerTitle: currentPage.headerTitle ?? "New header",
        },
      };
    });
  }

  function handleAddSubheader(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-subheader-${existingBlocks.length + 1}-${Date.now()}`;
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "subheader",
          text: "New subheader",
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddInstructions(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-instructions-${existingBlocks.length + 1}-${Date.now()}`;
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "instructions",
          header: "PRACTICE:",
          text: "",
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddInfoBox(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-infobox-${existingBlocks.length + 1}-${Date.now()}`;
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "info-box",
          text: "",
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddHotspot(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const existingHotspots = prev.hotspots ?? [];
      const newId = `hotspot-${existingHotspots.length + 1}-${Date.now()}`;
      const nextHotspots: Hotspot[] = [
        ...existingHotspots,
        {
          id: newId,
          page,
          left: 10,
          top: 10,
          width: 20,
          height: 10,
          label: "New hotspot",
        },
      ];
      return {
        ...prev,
        hotspots: nextHotspots,
      };
    });
  }

  function updateLeftHeaderTitle(value: string) {
    setWorkingSpread((prev) => ({
      ...prev,
      leftPage: {
        ...prev.leftPage,
        largeHeaderBar: prev.leftPage.largeHeaderBar ?? true,
        headerTitle: value,
      },
    }));
  }

  function updateRightHeaderTitle(value: string) {
    setWorkingSpread((prev) => ({
      ...prev,
      rightPage: {
        ...prev.rightPage,
        largeHeaderBar: prev.rightPage.largeHeaderBar ?? true,
        headerTitle: value,
      },
    }));
  }

  function getNextQuestionNumber(blocks: ContentBlock[]): number {
    let max = 0;
    for (const b of blocks) {
      if (b.type === "practice" && b.number > max) max = b.number;
      if (b.type === "question" && b.number > max) max = b.number;
    }
    return max + 1;
  }

  function handleAddFillInBlank(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-fib-${existingBlocks.length + 1}-${Date.now()}`;
      const nextNumber = getNextQuestionNumber(existingBlocks);
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "question",
          questionKind: "fill-in-the-blank",
          number: nextNumber,
          prompt: "enter new question",
          blanks: [
            { id: "a", maxLength: 40 },
          ],
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddMultipleChoice(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-mcq-${existingBlocks.length + 1}-${Date.now()}`;
      const nextNumber = getNextQuestionNumber(existingBlocks);
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "question",
          questionKind: "multiple-choice",
          number: nextNumber,
          prompt: "enter new question",
          choices: [
            { id: "A", label: "A" },
            { id: "B", label: "B" },
            { id: "C", label: "C" },
            { id: "D", label: "D" },
          ],
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddDiscussion(page: "left" | "right") {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-disc-${existingBlocks.length + 1}-${Date.now()}`;
      const nextNumber = getNextQuestionNumber(existingBlocks);
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "question",
          questionKind: "discussion",
          number: nextNumber,
          prompt: "Enter discussion question",
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function handleAddImage(page: "left" | "right", assetId: string) {
    setWorkingSpread((prev) => {
      const pageKey = page === "left" ? "leftPage" : "rightPage";
      const existingBlocks = prev[pageKey].blocks;
      const newId = `${page}-img-${existingBlocks.length + 1}-${Date.now()}`;
      const nextBlocks: ContentBlock[] = [
        ...existingBlocks,
        {
          id: newId,
          type: "image",
          assetId,
          alt: "",
          position: {
            left: 10,
            top: 10,
            width: 40,
          },
        },
      ];
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function updateSelectedBlock(
    updater: (block: ContentBlock) => ContentBlock,
  ) {
    if (!selected || selected.kind !== "block") return;
    const { page, blockId } = selected;
    const pageKey = page === "left" ? "leftPage" : "rightPage";
    setWorkingSpread((prev) => {
      const blocks = prev[pageKey].blocks;
      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const nextBlocks = blocks.slice();
      nextBlocks[idx] = updater(blocks[idx]);
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  function updateSelectedHotspot(
    updater: (hotspot: Hotspot) => Hotspot,
  ) {
    if (!selected || selected.kind !== "hotspot") return;
    const { hotspotId } = selected;
    setWorkingSpread((prev) => {
      const hs = prev.hotspots ?? [];
      const idx = hs.findIndex((h) => h.id === hotspotId);
      if (idx === -1) return prev;
      const nextHotspots = hs.slice();
      nextHotspots[idx] = updater(hs[idx]);
      return {
        ...prev,
        hotspots: nextHotspots,
      };
    });
  }

  function deleteSelectedBlock() {
    if (!selected || selected.kind !== "block") return;
    const { page, blockId } = selected;
    const pageKey = page === "left" ? "leftPage" : "rightPage";
    setWorkingSpread((prev) => {
      const blocks = prev[pageKey].blocks;
      const nextBlocks = blocks.filter((b) => b.id !== blockId);
      if (nextBlocks === blocks) return prev;
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
    setSelected(null);
  }

  function duplicateSelectedBlock() {
    if (!selected || selected.kind !== "block") return;
    const { page, blockId } = selected;
    const pageKey = page === "left" ? "leftPage" : "rightPage";
    const blocks = workingSpread[pageKey].blocks;
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index === -1) return;
    const source = blocks[index];
    const newId = `${page}-dup-${Date.now()}`;
    let duplicate: ContentBlock;
    if (source.type === "question") {
      if (source.questionKind === "multiple-choice") {
        duplicate = {
          ...source,
          id: newId,
          choices: source.choices.map((c) => ({ ...c })),
        };
      } else if (source.questionKind === "fill-in-the-blank") {
        duplicate = {
          ...source,
          id: newId,
          blanks: source.blanks.map((b) => ({ ...b })),
        };
      } else {
        duplicate = { ...source, id: newId };
      }
    } else {
      duplicate = { ...source, id: newId };
    }
    setWorkingSpread((prev) => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        blocks: [...prev[pageKey].blocks, duplicate],
      },
    }));
    setSelected({ kind: "block", page, blockId: newId });
  }

  function deleteSelectedHotspot() {
    if (!selected || selected.kind !== "hotspot") return;
    const { hotspotId } = selected;
    setWorkingSpread((prev) => {
      const hs = prev.hotspots ?? [];
      const nextHotspots = hs.filter((h) => h.id !== hotspotId);
      if (nextHotspots === hs) return prev;
      return {
        ...prev,
        hotspots: nextHotspots,
      };
    });
    setSelected(null);
  }

  function handleReorderBlocks(
    page: "left" | "right",
    fromIndex: number,
    toIndex: number,
  ) {
    if (fromIndex === toIndex) return;
    const pageKey = page === "left" ? "leftPage" : "rightPage";
    setWorkingSpread((prev) => {
      const blocks = prev[pageKey].blocks.slice();
      const nextBlocks = arrayMove(blocks, fromIndex, toIndex);
      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          blocks: nextBlocks,
        },
      };
    });
  }

  const blockListSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <header className="w-full border-b border-stone-300 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4 font-ui text-sm">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="text-[#5b8fb9] font-medium hover:underline"
            >
              ← Home
            </Link>
            <span className="text-sm text-stone-500">Editor mode</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-500">
              Editing <span className="font-semibold">{spreadId}</span>{" "}
              {spreadIndex >= 0 && `(Spread ${spreadIndex + 1})`}
            </span>
            <Link
              href={`/spread/${spreadId}`}
              className="px-3 py-1.5 rounded border border-[#5b8fb9] text-[#5b8fb9] hover:bg-[#5b8fb9]/10"
            >
              View as reader
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 w-full overflow-x-auto">
          <div className="min-w-[106rem] mx-auto flex gap-4 px-4 py-4">
          {/* Left sidebar: outline and quick-add controls */}
          <aside className="w-56 shrink-0 rounded-md border border-stone-300 bg-white/80 p-3 text-xs text-stone-700 space-y-3 font-ui">
            <div>
              <p className="font-semibold mb-1">Text blocks</p>
              <DndContext
                sensors={blockListSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (!over || active.id === over.id) return;
                  const activeStr = String(active.id);
                  const overStr = String(over.id);
                  if (
                    activeStr.startsWith(SORTABLE_ID_LEFT) &&
                    overStr.startsWith(SORTABLE_ID_LEFT)
                  ) {
                    const leftBlocks = workingSpread.leftPage.blocks;
                    const fromIndex = leftBlocks.findIndex(
                      (b) => sortableId("left", b) === activeStr,
                    );
                    const toIndex = leftBlocks.findIndex(
                      (b) => sortableId("left", b) === overStr,
                    );
                    if (fromIndex !== -1 && toIndex !== -1) {
                      handleReorderBlocks("left", fromIndex, toIndex);
                    }
                  } else if (
                    activeStr.startsWith(SORTABLE_ID_RIGHT) &&
                    overStr.startsWith(SORTABLE_ID_RIGHT)
                  ) {
                    const rightBlocks = workingSpread.rightPage.blocks;
                    const fromIndex = rightBlocks.findIndex(
                      (b) => sortableId("right", b) === activeStr,
                    );
                    const toIndex = rightBlocks.findIndex(
                      (b) => sortableId("right", b) === overStr,
                    );
                    if (fromIndex !== -1 && toIndex !== -1) {
                      handleReorderBlocks("right", fromIndex, toIndex);
                    }
                  }
                }}
              >
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  <SortableContext
                    items={workingSpread.leftPage.blocks.map((b) =>
                      sortableId("left", b),
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {workingSpread.leftPage.blocks.map((block) => (
                      <SortableBlockRow
                        key={sortableId("left", block)}
                        page="left"
                        block={block}
                        isSelected={
                          selected?.kind === "block" &&
                          selected.page === "left" &&
                          selected.blockId === block.id
                        }
                        onSelect={() => handleSelectBlock("left", block)}
                        summary={summarizeBlock(block)}
                      />
                    ))}
                  </SortableContext>
                  <SortableContext
                    items={workingSpread.rightPage.blocks.map((b) =>
                      sortableId("right", b),
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {workingSpread.rightPage.blocks.map((block) => (
                      <SortableBlockRow
                        key={sortableId("right", block)}
                        page="right"
                        block={block}
                        isSelected={
                          selected?.kind === "block" &&
                          selected.page === "right" &&
                          selected.blockId === block.id
                        }
                        onSelect={() => handleSelectBlock("right", block)}
                        summary={summarizeBlock(block)}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
              <div className="flex items-center gap-2 mt-2 relative">
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      setTextBlockDropdownOpen((prev) =>
                        prev === "left" ? null : "left",
                      )
                    }
                    className="w-full rounded border border-stone-300 py-1 hover:bg-stone-100"
                  >
                    Add text L
                  </button>
                  {textBlockDropdownOpen === "left" && (
                    <div className="absolute z-10 mt-1 w-40 rounded-md border border-stone-300 bg-white shadow-sm">
                      <ul className="py-1 text-xs text-stone-700">
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddParagraph("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Text
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddInstructions("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Instructions
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddInfoBox("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Info box
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddFillInBlank("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Fill-in-the-blank
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddMultipleChoice("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Multiple choice
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddDiscussion("left");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Discussion
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      setTextBlockDropdownOpen((prev) =>
                        prev === "right" ? null : "right",
                      )
                    }
                    className="w-full rounded border border-stone-300 py-1 hover:bg-stone-100"
                  >
                    Add text R
                  </button>
                  {textBlockDropdownOpen === "right" && (
                    <div className="absolute z-10 mt-1 w-40 rounded-md border border-stone-300 bg-white shadow-sm">
                      <ul className="py-1 text-xs text-stone-700">
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddParagraph("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Text
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddInstructions("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Instructions
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddInfoBox("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Info box
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddFillInBlank("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Fill-in-the-blank
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddMultipleChoice("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Multiple choice
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="w-full px-2 py-1 text-left hover:bg-stone-100"
                            onClick={() => {
                              handleAddDiscussion("right");
                              setTextBlockDropdownOpen(null);
                            }}
                          >
                            Discussion
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-1">Hotspots</p>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {hotspots.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    onClick={() => handleSelectHotspot(hotspot)}
                    className={`block w-full text-left rounded px-2 py-1 hover:bg-stone-100 ${
                      selected?.kind === "hotspot" &&
                      selected.hotspotId === hotspot.id
                        ? "bg-[#5b8fb9]/10 border border-[#5b8fb9]"
                        : "border border-transparent"
                    }`}
                  >
                    <span className="font-medium mr-1">
                      {hotspot.page === "left" ? "L" : "R"}
                    </span>
                    <span className="text-[11px] text-stone-600">
                      {hotspot.label ?? hotspot.id}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  type="button"
                  onClick={() => handleAddHotspot("left")}
                  className="flex-1 rounded border border-stone-300 py-1 hover:bg-stone-100"
                >
                  Add hotspot L
                </button>
                <button
                  type="button"
                  onClick={() => handleAddHotspot("right")}
                  className="flex-1 rounded border border-stone-300 py-1 hover:bg-stone-100"
                >
                  Add hotspot R
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-200 space-y-3">
              <HeaderPalette
                onAddLargeHeaderLeft={() => handleAddLargeHeader("left")}
                onAddLargeHeaderRight={() => handleAddLargeHeader("right")}
                onAddSubheaderLeft={() => handleAddSubheader("left")}
                onAddSubheaderRight={() => handleAddSubheader("right")}
                leftHeaderTitle={workingSpread.leftPage.headerTitle}
                rightHeaderTitle={workingSpread.rightPage.headerTitle}
                onChangeLeftHeaderTitle={updateLeftHeaderTitle}
                onChangeRightHeaderTitle={updateRightHeaderTitle}
              />
              <AssetPalette
                onAddToLeft={(asset) => handleAddImage("left", asset.id)}
                onAddToRight={(asset) => handleAddImage("right", asset.id)}
              />
            </div>
          </aside>

          {/* Center canvas: reuse Spread layout for now */}
          <section className="flex-1 flex flex-col items-center justify-center">
            <Spread data={workingSpread} />
            <div className="mt-3 flex items-center justify-between w-full max-w-6xl text-xs text-stone-500">
              <div>
                {prevId ? (
                  <Link
                    href={`/editor/spread/${prevId}`}
                    className="text-[#5b8fb9] hover:underline"
                  >
                    ← Previous spread
                  </Link>
                ) : (
                  <span>Start of chapter</span>
                )}
              </div>
              <div>
                {nextId ? (
                  <Link
                    href={`/editor/spread/${nextId}`}
                    className="text-[#5b8fb9] hover:underline"
                  >
                    Next spread →
                  </Link>
                ) : (
                  <span>End of chapter</span>
                )}
              </div>
            </div>
          </section>

          {/* Right sidebar: inspector placeholder */}
          <aside className="w-72 shrink-0 rounded-md border border-stone-300 bg-white/80 p-3 text-xs text-stone-700 space-y-3 font-ui">
            <p className="font-semibold mb-2">Inspector</p>
            {!selectedDetails && (
              <p className="text-stone-500">
                Select a text block or hotspot from the outline to edit it.
              </p>
            )}
            {selectedDetails?.kind === "block" && selectedDetails.block && (
              <BlockInspector
                block={selectedDetails.block}
                onChange={updateSelectedBlock}
                onDelete={deleteSelectedBlock}
                onDuplicate={duplicateSelectedBlock}
              />
            )}
            {selectedDetails?.kind === "hotspot" &&
              selectedDetails.hotspot && (
                <HotspotInspector
                  hotspot={selectedDetails.hotspot}
                  onChange={updateSelectedHotspot}
                  onDelete={deleteSelectedHotspot}
                />
              )}
          </aside>
          </div>
        </div>
        <section className="border-t border-stone-300 bg-stone-50/80">
          <div className="max-w-6xl mx-auto px-4 py-2 text-xs text-stone-600 space-y-1">
            <details>
              <summary className="cursor-pointer select-none">
                Show current spread data (for copy/paste into{" "}
                <code className="bg-stone-100 px-1 rounded text-[11px]">
                  data/spreads/spread-*.ts
                </code>
                )
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto rounded bg-stone-900 text-[10px] text-stone-100 p-2">
                {formatSpreadAsTS(workingSpread)}
              </pre>
            </details>
          </div>
        </section>
      </main>
    </div>
  );
}

const SORTABLE_ID_LEFT = "left-";
const SORTABLE_ID_RIGHT = "right-";

function sortableId(page: "left" | "right", block: ContentBlock): string {
  const id = block.id ?? `${block.type}-${page}`;
  return page === "left" ? `${SORTABLE_ID_LEFT}${id}` : `${SORTABLE_ID_RIGHT}${id}`;
}

interface SortableBlockRowProps {
  page: "left" | "right";
  block: ContentBlock;
  isSelected: boolean;
  onSelect: () => void;
  summary: string;
}

function SortableBlockRow({
  page,
  block,
  isSelected,
  onSelect,
  summary,
}: SortableBlockRowProps) {
  const id = sortableId(page, block);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const pageLabel = page === "left" ? "L" : "R";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded border pr-1 ${
        isSelected
          ? "bg-[#5b8fb9]/10 border-[#5b8fb9]"
          : "border-transparent hover:bg-stone-100"
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="shrink-0 touch-none cursor-grab active:cursor-grabbing p-0.5 text-stone-400 hover:text-stone-600"
        {...attributes}
        {...listeners}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
          <circle cx="2" cy="2" r="0.8" />
          <circle cx="5" cy="2" r="0.8" />
          <circle cx="8" cy="2" r="0.8" />
          <circle cx="2" cy="5" r="0.8" />
          <circle cx="5" cy="5" r="0.8" />
          <circle cx="8" cy="5" r="0.8" />
          <circle cx="2" cy="8" r="0.8" />
          <circle cx="5" cy="8" r="0.8" />
          <circle cx="8" cy="8" r="0.8" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-w-0 text-left py-1 px-1 rounded flex items-center gap-1 overflow-hidden"
      >
        <span className="font-medium shrink-0">{pageLabel}</span>
        <span className="text-[11px] text-stone-600 truncate min-w-0">
          {summary}
        </span>
      </button>
    </div>
  );
}

function summarizeBlock(block: ContentBlock): string {
  if (block.type === "heading") return `Heading: ${block.text}`;
  if (block.type === "paragraph") return block.text.slice(0, 40) + (block.text.length > 40 ? "…" : "");
  if (block.type === "practice") return `Practice ${block.number}`;
  if (block.type === "question") {
    const kind =
      block.questionKind === "multiple-choice"
        ? "multiple-choice"
        : block.questionKind === "discussion"
          ? "discussion"
          : "fill-in-the-blank";
    return `Q${block.number} (${kind})`;
  }
  if (block.type === "discussion") return "Discussion";
  if (block.type === "info-box") return block.text ? `Info: ${block.text.slice(0, 30)}${block.text.length > 30 ? "…" : ""}` : "Info box";
  if (block.type === "instructions") return `Instructions: ${block.header}`;
  if (block.type === "list") return "List";
  if (block.type === "image") return `Image: ${block.assetId}`;
  return "Block";
}

interface BlockInspectorProps {
  block: ContentBlock;
  onChange: (updater: (block: ContentBlock) => ContentBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function BlockInspector({ block, onChange, onDelete, onDuplicate }: BlockInspectorProps) {
  const handleTextChange = (value: string) => {
    if (
      block.type === "paragraph" ||
      block.type === "heading" ||
      block.type === "discussion" ||
      block.type === "raw" ||
      block.type === "image" ||
      block.type === "subheader"
    ) {
      onChange((prev) => ({ ...prev, text: value } as ContentBlock));
    } else if (block.type === "practice") {
      onChange((prev) => ({ ...prev, text: value } as ContentBlock));
    }
  };

  const updatePosition = (field: keyof BlockPosition, value: string) => {
    const num = value === "" ? undefined : Number(value);
    onChange((prev) => ({
      ...prev,
      position:
        num === undefined && !prev.position
          ? undefined
          : ({
              ...(prev.position ?? {}),
              [field]: num,
            } as BlockPosition),
    }));
  };

  if (block.type === "info-box") {
    return (
      <div className="space-y-2">
        <p className="font-semibold text-stone-700">Info box</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded border border-stone-300 px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-100"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
          >
            Delete block
          </button>
        </div>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Text</span>
          <textarea
            className="w-full rounded border border-stone-300 p-1 text-xs"
            rows={4}
            value={block.text}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "info-box") return prev;
                return { ...prev, text: e.target.value };
              })
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Width (px)</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.width ?? ""}
            placeholder="200"
            onChange={(e) => {
              const val = e.target.value === "" ? undefined : Number(e.target.value);
              onChange((prev) => {
                if (prev.type !== "info-box") return prev;
                return { ...prev, width: val };
              });
            }}
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Height (px)</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.height ?? ""}
            placeholder="60"
            onChange={(e) => {
              const val = e.target.value === "" ? undefined : Number(e.target.value);
              onChange((prev) => {
                if (prev.type !== "info-box") return prev;
                return { ...prev, height: val };
              });
            }}
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Text alignment</span>
          <select
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.textAlign ?? "left"}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "info-box") return prev;
                return {
                  ...prev,
                  textAlign: (e.target.value === "center" ? "center" : "left") as "left" | "center",
                };
              })
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </label>
        <fieldset className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
          <legend className="text-[11px] text-stone-500 mb-1">
            Position (% of page)
          </legend>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Left</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.left ?? ""}
              onChange={(e) => updatePosition("left", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Top</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.top ?? ""}
              onChange={(e) => updatePosition("top", e.target.value)}
            />
          </label>
        </fieldset>
      </div>
    );
  }

  if (block.type === "instructions") {
    return (
      <div className="space-y-2">
        <p className="font-semibold text-stone-700">Instructions</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded border border-stone-300 px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-100"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
          >
            Delete block
          </button>
        </div>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Header</span>
          <input
            type="text"
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.header}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "instructions") return prev;
                return { ...prev, header: e.target.value };
              })
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Text</span>
          <textarea
            className="w-full rounded border border-stone-300 p-1 text-xs"
            rows={4}
            value={block.text}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "instructions") return prev;
                return { ...prev, text: e.target.value };
              })
            }
          />
        </label>
        <fieldset className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
          <legend className="text-[11px] text-stone-500 mb-1">
            Position (% of page)
          </legend>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Left</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.left ?? ""}
              onChange={(e) => updatePosition("left", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Top</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.top ?? ""}
              onChange={(e) => updatePosition("top", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Width</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.width ?? ""}
              onChange={(e) => updatePosition("width", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Height</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.height ?? ""}
              onChange={(e) => updatePosition("height", e.target.value)}
            />
          </label>
        </fieldset>
      </div>
    );
  }

  if (block.type === "question") {
    const kindLabel =
      block.questionKind === "multiple-choice"
        ? "Multiple choice"
        : block.questionKind === "discussion"
          ? "Discussion"
          : "Fill-in-the-blank";
    return (
      <div className="space-y-2">
        <p className="font-semibold text-stone-700">
          Question ({kindLabel})
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded border border-stone-300 px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-100"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
          >
            Delete question
          </button>
        </div>
        <label className="block space-y-0.5">
          <span className="block text-[10px] text-stone-500">Number</span>
          <input
            type="number"
            min={1}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.number}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "question") return prev;
                return { ...prev, number: Number(e.target.value) || 1 };
              })
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Prompt</span>
          <textarea
            className="w-full rounded border border-stone-300 p-1 text-xs"
            rows={3}
            value={block.prompt}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "question") return prev;
                return { ...prev, prompt: e.target.value };
              })
            }
          />
        </label>
        {block.questionKind === "fill-in-the-blank" && (
          <div className="space-y-1">
            <span className="block text-[11px] text-stone-500">Blanks</span>
            {block.blanks.map((blank, index) => (
              <div
                key={blank.id}
                className="flex items-center gap-2 rounded border border-stone-200 p-1.5"
              >
                <span className="text-[10px] text-stone-500 w-14 shrink-0">
                  Blank {index + 1}
                </span>
                <label className="flex-1 flex items-center gap-1">
                  <span className="text-[10px] text-stone-500">Max length</span>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    className="w-12 rounded border border-stone-300 p-0.5 text-xs"
                    value={blank.maxLength}
                    onChange={(e) => {
                      const n = Number(e.target.value) || 1;
                      onChange((prev) => {
                        if (
                          prev.type !== "question" ||
                          prev.questionKind !== "fill-in-the-blank"
                        )
                          return prev;
                        const blanks = prev.blanks.slice();
                        blanks[index] = { ...blanks[index], maxLength: n };
                        return { ...prev, blanks };
                      });
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => {
                      if (
                        prev.type !== "question" ||
                        prev.questionKind !== "fill-in-the-blank"
                      )
                        return prev;
                      if (prev.blanks.length <= 1) return prev;
                      const blanks = prev.blanks.filter((_, i) => i !== index);
                      return { ...prev, blanks };
                    })
                  }
                  className="text-[10px] text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange((prev) => {
                  if (
                    prev.type !== "question" ||
                    prev.questionKind !== "fill-in-the-blank"
                  )
                    return prev;
                  const newBlank: QuestionBlank = {
                    id: `blank-${Date.now()}`,
                    maxLength: 4,
                  };
                  return {
                    ...prev,
                    blanks: [...prev.blanks, newBlank],
                  };
                })
              }
              className="rounded border border-stone-300 py-0.5 px-1.5 text-[10px] hover:bg-stone-100"
            >
              Add blank
            </button>
          </div>
        )}
        {block.questionKind === "multiple-choice" && (
          <div className="space-y-1">
            <span className="block text-[11px] text-stone-500">Choices</span>
            {block.choices.map((choice, index) => (
              <div
                key={choice.id}
                className="flex items-center gap-2 rounded border border-stone-200 p-1.5"
              >
                <label className="flex-1 min-w-0">
                  <input
                    type="text"
                    className="w-full rounded border border-stone-300 p-0.5 text-xs"
                    value={choice.label}
                    onChange={(e) =>
                      onChange((prev) => {
                        if (
                          prev.type !== "question" ||
                          prev.questionKind !== "multiple-choice"
                        )
                          return prev;
                        const choices = prev.choices.slice();
                        choices[index] = { ...choices[index], label: e.target.value };
                        return { ...prev, choices };
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => {
                      if (
                        prev.type !== "question" ||
                        prev.questionKind !== "multiple-choice"
                      )
                        return prev;
                      if (prev.choices.length <= 2) return prev;
                      const choices = prev.choices.filter((_, i) => i !== index);
                      return { ...prev, choices };
                    })
                  }
                  className="text-[10px] text-red-600 hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange((prev) => {
                  if (
                    prev.type !== "question" ||
                    prev.questionKind !== "multiple-choice"
                  )
                    return prev;
                  const newId = `choice-${Date.now()}`;
                  return {
                    ...prev,
                    choices: [...prev.choices, { id: newId, label: "New option" }],
                  };
                })
              }
              className="rounded border border-stone-300 py-0.5 px-1.5 text-[10px] hover:bg-stone-100"
            >
              Add choice
            </button>
          </div>
        )}
        <fieldset className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
          <legend className="text-[11px] text-stone-500 mb-1">
            Position (% of page)
          </legend>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Left</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.left ?? ""}
              onChange={(e) => updatePosition("left", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Top</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.top ?? ""}
              onChange={(e) => updatePosition("top", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Width</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.width ?? ""}
              onChange={(e) => updatePosition("width", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Height</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.height ?? ""}
              onChange={(e) => updatePosition("height", e.target.value)}
            />
          </label>
        </fieldset>
      </div>
    );
  }

  if (block.type === "paragraph") {
    const fontOptions: { value: "" | ParagraphFont; label: string }[] = [
      { value: "", label: "Default" },
      { value: "bebas", label: "Bebas Neue" },
      { value: "roboto", label: "Roboto" },
      { value: "roboto-slab", label: "Roboto Slab" },
    ];
    const colorOptions: { value: "" | ParagraphColor; label: string }[] = [
      { value: "", label: "Default" },
      { value: "white", label: "White" },
      { value: "green", label: "Green" },
      { value: "blue", label: "Blue" },
      { value: "purple", label: "Purple" },
      { value: "dark-blue", label: "Dark blue" },
      { value: "black", label: "Black" },
    ];
    const fontSizeOptions: { value: "" | ParagraphFontSize; label: string }[] = [
      { value: "xs", label: "Small" },
      { value: "", label: "Default" },
      { value: "base", label: "Large" },
    ];
    return (
      <div className="space-y-2">
        <p className="font-semibold text-stone-700">Paragraph</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded border border-stone-300 px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-100"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
          >
            Delete block
          </button>
        </div>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Text</span>
          <textarea
            className="w-full rounded border border-stone-300 p-1 text-xs"
            rows={4}
            value={block.text}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "paragraph") return prev;
                return { ...prev, text: e.target.value };
              })
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Font</span>
          <select
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.font ?? ""}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "paragraph") return prev;
                const v = e.target.value as "" | ParagraphFont;
                return { ...prev, font: v === "" ? undefined : v };
              })
            }
          >
            {fontOptions.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Color</span>
          <select
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.color ?? ""}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "paragraph") return prev;
                const v = e.target.value as "" | ParagraphColor;
                return { ...prev, color: v === "" ? undefined : v };
              })
            }
          >
            {colorOptions.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Font size</span>
          <select
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.fontSize ?? ""}
            onChange={(e) =>
              onChange((prev) => {
                if (prev.type !== "paragraph") return prev;
                const v = e.target.value as "" | ParagraphFontSize;
                return { ...prev, fontSize: v === "" ? undefined : v };
              })
            }
          >
            {fontSizeOptions.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200">
          <legend className="text-[11px] text-stone-500 mb-1">
            Position (% of page)
          </legend>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Left</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.left ?? ""}
              onChange={(e) => updatePosition("left", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Top</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.top ?? ""}
              onChange={(e) => updatePosition("top", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Width</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.width ?? ""}
              onChange={(e) => updatePosition("width", e.target.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] text-stone-500">Height</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={block.position?.height ?? ""}
              onChange={(e) => updatePosition("height", e.target.value)}
            />
          </label>
        </fieldset>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-semibold text-stone-700">
        Text block ({block.type})
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded border border-stone-300 px-2 py-1 text-[11px] text-stone-700 hover:bg-stone-100"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
        >
          Delete block
        </button>
      </div>
      {"text" in block && (
        <label className="block space-y-1">
          <span className="block text-[11px] text-stone-500">Text</span>
          <textarea
            className="w-full rounded border border-stone-300 p-1 text-xs"
            rows={4}
            value={(block as { text?: string }).text ?? ""}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </label>
      )}
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="text-[11px] text-stone-500 mb-1">
          Position (% of page)
        </legend>
        <label className="space-y-0.5">
          <span className="block text-[10px] text-stone-500">Left</span>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.position?.left ?? ""}
            onChange={(e) => updatePosition("left", e.target.value)}
          />
        </label>
        <label className="space-y-0.5">
          <span className="block text-[10px] text-stone-500">Top</span>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.position?.top ?? ""}
            onChange={(e) => updatePosition("top", e.target.value)}
          />
        </label>
        <label className="space-y-0.5">
          <span className="block text-[10px] text-stone-500">Width</span>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.position?.width ?? ""}
            onChange={(e) => updatePosition("width", e.target.value)}
          />
        </label>
        <label className="space-y-0.5">
          <span className="block text-[10px] text-stone-500">Height</span>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded border border-stone-300 p-1 text-xs"
            value={block.position?.height ?? ""}
            onChange={(e) => updatePosition("height", e.target.value)}
          />
        </label>
      </fieldset>
    </div>
  );
}

interface HotspotInspectorProps {
  hotspot: Hotspot;
  onChange: (updater: (hotspot: Hotspot) => Hotspot) => void;
  onDelete: () => void;
}

function HotspotInspector({
  hotspot,
  onChange,
  onDelete,
}: HotspotInspectorProps) {
  const updateField = (field: keyof Hotspot, value: string) => {
    if (["left", "top", "width", "height"].includes(field)) {
      const num = value === "" ? 0 : Number(value);
      onChange((prev) => ({ ...prev, [field]: num }));
    } else {
      onChange((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="space-y-2">
      <p className="font-semibold text-stone-700">
        Hotspot ({hotspot.page} page)
      </p>
      <button
        type="button"
        onClick={onDelete}
        className="rounded border border-red-300 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50"
      >
        Delete hotspot
      </button>
      <label className="block space-y-0.5">
        <span className="block text-[10px] text-stone-500">Label</span>
        <input
          type="text"
          className="w-full rounded border border-stone-300 p-1 text-xs"
          value={hotspot.label ?? ""}
          onChange={(e) => updateField("label", e.target.value)}
        />
      </label>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="text-[11px] text-stone-500 mb-1">
          Position (% of page)
        </legend>
        {(["left", "top", "width", "height"] as const).map((field) => (
          <label key={field} className="space-y-0.5">
            <span className="block text-[10px] text-stone-500 capitalize">
              {field}
            </span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded border border-stone-300 p-1 text-xs"
              value={hotspot[field]}
              onChange={(e) => updateField(field, e.target.value)}
            />
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function withBlockIds(spread: SpreadData): SpreadData {
  const addIds = (blocks: ContentBlock[], prefix: "left" | "right") =>
    blocks.map((block, index) =>
      block.id
        ? block
        : {
            ...block,
            id: `${prefix}-${index + 1}`,
          },
    );

  return {
    ...spread,
    leftPage: {
      ...spread.leftPage,
      blocks: addIds(spread.leftPage.blocks, "left"),
    },
    rightPage: {
      ...spread.rightPage,
      blocks: addIds(spread.rightPage.blocks, "right"),
    },
  };
}



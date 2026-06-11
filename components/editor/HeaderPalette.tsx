"use client";

import { useState } from "react";

interface HeaderPaletteProps {
  onAddLargeHeaderLeft?: () => void;
  onAddLargeHeaderRight?: () => void;
  onAddSubheaderLeft?: () => void;
  onAddSubheaderRight?: () => void;
  leftHeaderTitle?: string;
  rightHeaderTitle?: string;
  onChangeLeftHeaderTitle?: (value: string) => void;
  onChangeRightHeaderTitle?: (value: string) => void;
}

/**
 * Header palette for the editor.
 * Provides Add header L/R buttons that can create either a large header bar
 * or a subheader block, plus optional inline editing for header titles.
 */
export function HeaderPalette({
  onAddLargeHeaderLeft,
  onAddLargeHeaderRight,
  onAddSubheaderLeft,
  onAddSubheaderRight,
  leftHeaderTitle,
  rightHeaderTitle,
  onChangeLeftHeaderTitle,
  onChangeRightHeaderTitle,
}: HeaderPaletteProps) {
  const [openDropdown, setOpenDropdown] = useState<"left" | "right" | null>(
    null,
  );

  const hasLeftActions =
    !!onAddLargeHeaderLeft || !!onAddSubheaderLeft || !!onChangeLeftHeaderTitle;
  const hasRightActions =
    !!onAddLargeHeaderRight ||
    !!onAddSubheaderRight ||
    !!onChangeRightHeaderTitle;

  const handleChoose = (
    side: "left" | "right",
    kind: "large" | "subheader",
  ) => {
    if (side === "left") {
      if (kind === "large") {
        onAddLargeHeaderLeft?.();
      } else {
        onAddSubheaderLeft?.();
      }
    } else {
      if (kind === "large") {
        onAddLargeHeaderRight?.();
      } else {
        onAddSubheaderRight?.();
      }
    }
    setOpenDropdown(null);
  };

  const renderDropdown = (side: "left" | "right") => {
    if (openDropdown !== side) return null;
    const canAddLarge =
      side === "left" ? !!onAddLargeHeaderLeft : !!onAddLargeHeaderRight;
    const canAddSub =
      side === "left" ? !!onAddSubheaderLeft : !!onAddSubheaderRight;

    if (!canAddLarge && !canAddSub) return null;

    return (
      <div className="absolute z-10 mt-1 w-44 rounded-md border border-stone-300 bg-white shadow-sm">
        <ul className="py-1 text-xs text-stone-700">
          {canAddLarge && (
            <li>
              <button
                type="button"
                className="w-full px-2 py-1 text-left hover:bg-stone-100"
                onClick={() => handleChoose(side, "large")}
              >
                Large header bar
              </button>
            </li>
          )}
          {canAddSub && (
            <li>
              <button
                type="button"
                className="w-full px-2 py-1 text-left hover:bg-stone-100"
                onClick={() => handleChoose(side, "subheader")}
              >
                Subheader
              </button>
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="text-xs text-stone-700 space-y-2 relative">
      <p className="font-semibold mb-1">Headers</p>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            disabled={!hasLeftActions}
            onClick={() =>
              setOpenDropdown((prev) =>
                prev === "left" ? null : "left",
              )
            }
            className={`rounded border px-2 py-1 ${
              hasLeftActions
                ? "border-stone-300 bg-white hover:bg-stone-100"
                : "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            Add header L
          </button>
          {renderDropdown("left")}
        </div>
        <div className="relative">
          <button
            type="button"
            disabled={!hasRightActions}
            onClick={() =>
              setOpenDropdown((prev) =>
                prev === "right" ? null : "right",
              )
            }
            className={`rounded border px-2 py-1 ${
              hasRightActions
                ? "border-stone-300 bg-white hover:bg-stone-100"
                : "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            Add header R
          </button>
          {renderDropdown("right")}
        </div>
      </div>

      {(leftHeaderTitle !== undefined || rightHeaderTitle !== undefined) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {leftHeaderTitle !== undefined && onChangeLeftHeaderTitle && (
            <label className="block space-y-1">
              <span className="block text-[11px] text-stone-500">
                Left header title
              </span>
              <input
                type="text"
                className="w-full rounded border border-stone-300 px-1 py-0.5 text-xs"
                value={leftHeaderTitle}
                onChange={(e) => onChangeLeftHeaderTitle(e.target.value)}
              />
            </label>
          )}
          {rightHeaderTitle !== undefined && onChangeRightHeaderTitle && (
            <label className="block space-y-1">
              <span className="block text-[11px] text-stone-500">
                Right header title
              </span>
              <input
                type="text"
                className="w-full rounded border border-stone-300 px-1 py-0.5 text-xs"
                value={rightHeaderTitle}
                onChange={(e) => onChangeRightHeaderTitle(e.target.value)}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}


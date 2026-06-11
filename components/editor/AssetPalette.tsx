 "use client";

import { useState } from "react";
import type { ImageAsset } from "@/data/assets/images";
import { listImageAssets } from "@/data/assets/images";

interface AssetPaletteProps {
  onSelectImage?: (asset: ImageAsset) => void;
  onAddToLeft?: (asset: ImageAsset) => void;
  onAddToRight?: (asset: ImageAsset) => void;
}

/**
 * Image asset palette for the editor.
 * Shows Add image L/R buttons that open dropdowns of registered assets.
 */
export function AssetPalette({
  onSelectImage,
  onAddToLeft,
  onAddToRight,
}: AssetPaletteProps) {
  const images = listImageAssets();
  const [openDropdown, setOpenDropdown] = useState<"left" | "right" | null>(
    null,
  );

  if (images.length === 0) {
    return (
      <div className="text-xs text-stone-500">
        <p className="font-semibold mb-1">Assets</p>
        <p>
          No image assets are registered yet. Add files under{" "}
          <code className="bg-stone-100 px-1 rounded">public/assets/</code>{" "}
          and entries in{" "}
          <code className="bg-stone-100 px-1 rounded">
            data/assets/images.ts
          </code>{" "}
          to see them here.
        </p>
      </div>
    );
  }

  const hasLeft = !!onAddToLeft;
  const hasRight = !!onAddToRight;

  const handleChoose = (side: "left" | "right", asset: ImageAsset) => {
    if (side === "left") {
      onAddToLeft?.(asset);
    } else {
      onAddToRight?.(asset);
    }
    onSelectImage?.(asset);
    setOpenDropdown(null);
  };

  const renderDropdown = (side: "left" | "right") => {
    if (openDropdown !== side) return null;
    return (
      <div className="absolute z-10 mt-1 w-40 rounded-md border border-stone-300 bg-white shadow-sm max-h-40 overflow-y-auto">
        <ul className="py-1 text-xs text-stone-700">
          {images.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                className="w-full px-2 py-1 text-left hover:bg-stone-100"
                onClick={() => handleChoose(side, asset)}
              >
                <span className="font-medium">{asset.id}</span>
                {asset.category && (
                  <span className="ml-1 text-[10px] text-stone-500">
                    ({asset.category})
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="text-xs text-stone-700 space-y-2 relative">
      <p className="font-semibold mb-1">Image assets</p>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            disabled={!hasLeft}
            onClick={() =>
              setOpenDropdown((prev) => (prev === "left" ? null : "left"))
            }
            className={`rounded border px-2 py-1 ${
              hasLeft
                ? "border-stone-300 bg-white hover:bg-stone-100"
                : "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            Add image L
          </button>
          {renderDropdown("left")}
        </div>
        <div className="relative">
          <button
            type="button"
            disabled={!hasRight}
            onClick={() =>
              setOpenDropdown((prev) => (prev === "right" ? null : "right"))
            }
            className={`rounded border px-2 py-1 ${
              hasRight
                ? "border-stone-300 bg-white hover:bg-stone-100"
                : "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            Add image R
          </button>
          {renderDropdown("right")}
        </div>
      </div>
    </div>
  );
}

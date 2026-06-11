export type ImageCategory = "background" | "stock-photo" | "illustration" | "ui";

export interface ImageAsset {
  id: string;
  category: ImageCategory;
  /** Path under /public, e.g. /assets/characters/grogg.png */
  path: string;
  width?: number;
  height?: number;
}

/**
 * Registry of image assets available to spreads and the editor.
 * Add new entries here when you drop new files under /public/assets.
 */
export const imageAssets: ImageAsset[] = [
  {
    id: "whiteboard",
    category: "illustration", // or "background" / "character" if you prefer
    path: "/assets/art/illustrations/whiteboard.png",
    // width and height are optional but nice to add if you know them
    // width: 1200,
    // height: 800,
  },

  {
    id: "grogg-pose1",
    category: "illustration", // or "background" / "character" if you prefer
    path: "/assets/art/illustrations/grogg-pose1.png",
    // width and height are optional but nice to add if you know them
    // width: 1200,
    // height: 800,
  },
  {
    id: "canopy-example",
    category: "illustration",
    path: "/assets/art/illustrations/canopy-example.png",
  },
  {
    id: "canopy-growup",
    category: "illustration",
    path: "/assets/art/illustrations/canopy-growup.png",
  },
  {
    id: "canopy-growout",
    category: "illustration",
    path: "/assets/art/illustrations/canopy-growout.png",
  },
];

export function getImageAsset(id: string): ImageAsset | undefined {
  return imageAssets.find((asset) => asset.id === id);
}

export function listImageAssets(category?: ImageCategory): ImageAsset[] {
  if (!category) return imageAssets;
  return imageAssets.filter((asset) => asset.category === category);
}


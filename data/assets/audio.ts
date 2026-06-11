export type AudioCategory = "narration" | "effect";

export interface AudioAsset {
  id: string;
  category: AudioCategory;
  /** Path under /public, e.g. /audio/narration/spread1.mp3 */
  path: string;
}

/**
 * Registry of audio assets available to spreads and the editor.
 * Add new entries here when you drop new files under /public/audio.
 */
export const audioAssets: AudioAsset[] = [
  // Example entry (replace with real assets as you add them):
  // {
  //   id: "spread1_narration",
  //   category: "narration",
  //   path: "/audio/narration/spread1.mp3",
  // },
];

export function getAudioAsset(id: string): AudioAsset | undefined {
  return audioAssets.find((asset) => asset.id === id);
}

export function listAudioAssets(category?: AudioCategory): AudioAsset[] {
  if (!category) return audioAssets;
  return audioAssets.filter((asset) => asset.category === category);
}


/**
 * Canopy game instructions (from spread-3 left page, excluding the play buttons).
 * Rendered in reading order on the instructions page.
 */
export type InstructionBlock =
  | { type: "heading"; title: string; subtitle: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; assetId: string; alt: string };

export const canopyInstructions: InstructionBlock[] = [
  {
    type: "heading",
    title: "GAME: CANOPY",
    subtitle: "Compete for sunlight in this game for two.",
  },
  {
    type: "paragraph",
    text: "**OBJECTIVE:** Players take turns growing their trees to capture the most sunlight.",
  },
  {
    type: "paragraph",
    text: "**GAMEPLAY:** Canopy is played in rounds against the human player or the computer.",
  },
  {
    type: "paragraph",
    text: "**SUN POINTS:** Each circle on the game board represents a leaf. At the beginning of each round, players earn 1 sun point for each leaf with an unblocked path to the sunlight. Since each player begins the game with two leaves, all players begin the game with two sun points.",
  },
  {
    type: "paragraph",
    text: "**GROWING TREES:** In each round, you may spend your available sun points to grow new leaves on your tree. Leaves may be added in two ways:",
  },
  {
    type: "paragraph",
    text: "**Growing straight up costs 1 sun point.**",
  },
  {
    type: "paragraph",
    text: "Spend 1 point to connect any existing leaf of your tree to an empty circle directly above it.",
  },
  {
    type: "image",
    assetId: "canopy-growup",
    alt: "Example of growing straight up",
  },
  {
    type: "paragraph",
    text: "**Growing diagonally costs 2 sun points.**",
  },
  {
    type: "paragraph",
    text: "Spend 2 points to connect any existing leaf of your tree to an empty circle above it diagonally left or right.",
  },
  {
    type: "image",
    assetId: "canopy-growout",
    alt: "Example of growing diagonally",
  },
  {
    type: "paragraph",
    text: "**SHADE:** A leaf that does not have a clear path to the top of the board is shaded. Shaded leaves do not earn sun points when they are counted at the beginning of each round.",
  },
  {
    type: "image",
    assetId: "canopy-example",
    alt: "Example canopy trees with shaded and sunlit leaves",
  },
  {
    type: "paragraph",
    text: "Both of these trees have 8 leaves, but some of the leaves are shaded.",
  },
  {
    type: "paragraph",
    text: "The orange tree collects 3 sun points and the blue tree collects 4 sun points.",
  },
  {
    type: "paragraph",
    text: "**WINNING:** The player who has the most sun points at the end of round 10 wins the game.",
  },
];

const IMAGE_PATHS: Record<string, string> = {
  "canopy-growup": "/canopy-game/assets/art/illustrations/canopy-growup.png",
  "canopy-growout": "/canopy-game/assets/art/illustrations/canopy-growout.png",
  "canopy-example": "/canopy-game/assets/art/illustrations/canopy-example.png",
};

export function getInstructionImagePath(assetId: string): string {
  return IMAGE_PATHS[assetId] ?? "";
}

import type { SpreadData } from "./types";

/**
 * Spread 3: PDF pages 228–229 (Chapter 12 Competition)
 */
export const spread3: SpreadData = {
  id: "spread-3",
  sidebarColor: "#36ae71",
  leftPage: {
    pageNumber: 228,
    blocks: [
      {
        type: "lab-game-header",
        title: "GAME: CANOPY",
        subtitle: "Compete for sunlight in this game for two.",
        id: "left-1"
      },
      {
        id: "left-3-1773182150800",
        type: "paragraph",
        text: "**OBJECTIVE:** Players take turns growing their trees to capture the most sunlight.",
        position: {
          left: 2,
          top: 19
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-dup-1773182798049",
        type: "paragraph",
        text: "**GAMEPLAY:** Canopy is played in rounds against the human player or the computer.\n",
        position: {
          left: 2,
          top: 23
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-4-1773182662610",
        type: "paragraph",
        text: "**SUN POINTS:** Each circle on the game board represents a leaf. At the beginning of each round, players earn 1 sun point for each leaf with an unblocked path to the sunlight. Since each player begins the game with two leaves, all players begin the game with two sun points.  ",
        position: {
          left: 2,
          top: 27
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-6-1773184386948",
        type: "paragraph",
        text: "**GROWING TREES:** In each round, you may spend your available sun points to grow new leaves on your tree. Leaves may be added in two ways:",
        color: "dark-blue",
        font: "roboto",
        position: {
          top: 36,
          left: 2
        },
        fontSize: "xs"
      },
      {
        id: "left-7-1773184477893",
        type: "paragraph",
        text: "**Growing straight up costs 1 sun point.**",
        position: {
          top: 43,
          left: 6,
          width: 40
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-canopy-growup-image",
        type: "image",
        assetId: "canopy-growup",
        alt: "Example of growing straight up",
        position: {
          left: 34,
          top: 46,
          width: 14
        }
      },
      {
        id: "left-dup-1773184520429",
        type: "paragraph",
        text: "**Growing diagonally costs 2 sun points.**",
        position: {
          top: 43,
          left: 54,
          width: 41
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-canopy-growout-image",
        type: "image",
        assetId: "canopy-growout",
        alt: "Example of growing diagonally",
        position: {
          left: 84,
          top: 46,
          width: 15
        }
      },
      {
        id: "left-dup-1773184596405",
        type: "paragraph",
        text: "Spend 1 point to connect any existing leaf of your tree to an empty circle directly above it.",
        position: {
          top: 46,
          left: 6,
          width: 26
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-dup-1773184629939",
        type: "paragraph",
        text: "Spend 2 points to connect any existing leaf of your tree to an empty circle above it diagonally left or right.",
        position: {
          top: 46,
          left: 54,
          width: 29
        },
        color: "dark-blue",
        font: "roboto",
        fontSize: "xs"
      },
      {
        id: "left-dup-1773184758004",
        type: "paragraph",
        text: "**SHADE:** A leaf that does not have a clear path to the top of the board is shaded. Shaded leaves do not earn sun points when they are counted at the beginning of each round. ",
        color: "dark-blue",
        font: "roboto",
        position: {
          top: 59,
          left: 2
        },
        fontSize: "xs"
      },
      {
        id: "left-canopy-example-image",
        type: "image",
        assetId: "canopy-example",
        alt: "Example canopy trees with shaded and sunlit leaves",
        position: {
          left: 52,
          top: 65,
          width: 37
        }
      },
      {
        id: "left-13-1773185248029",
        type: "paragraph",
        text: "Both of these trees have 8 leaves, but some of the leaves are shaded.",
        position: {
          top: 67,
          left: 7,
          width: 37
        },
        fontSize: "xs",
        color: "dark-blue",
        font: "roboto"
      },
      {
        id: "left-dup-1773185308062",
        type: "paragraph",
        text: "The orange tree collects 3 sun points and the blue tree collects 4 sun points.",
        position: {
          top: 75,
          left: 7,
          width: 40
        },
        fontSize: "xs",
        color: "dark-blue",
        font: "roboto"
      },
      {
        id: "left-dup-1773184812220",
        type: "paragraph",
        text: "**WINNING:** The player who has the most sun points at the end of round 10 wins the game.",
        color: "dark-blue",
        font: "roboto",
        position: {
          top: 85,
          left: 2,
          width: 93
        },
        fontSize: "xs"
      },
      {
        id: "left-infobox-2-1773181966879",
        type: "info-box",
        text: "Ready to play? \n\n\n\n\n",
        gameId: "canopy",
        position: {
          width: 95,
          top: 89,
          left: 3,
          height: 5
        },
        width: 200
      }
    ]
  },
  rightPage: {
    pageNumber: 229,
    blocks: [
      {
        type: "game",
        gameId: "canopy",
        id: "right-canopy-1"
      }
    ]
  },
  footer: {
    leftSeriesText: "Beast Academy Science | Survival",
    rightChapterText: "Chapter 12 | Competition"
  },
  hotspots: []
}
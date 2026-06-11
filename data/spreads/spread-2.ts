import type { SpreadData } from "./types";

/**
 * Spread 2: PDF pages 36–37 (Gathering Evidence)
 */
export const spread2: SpreadData = {
  id: "spread-2",
  leftPage: {
    pageNumber: 36,
    blocks: [
      {
        type: "paragraph",
        text: "Scientists design tests that will provide evidence for (or against) their claims. To make a claim, it helps to have a question to answer. In this chapter, we'll explore claims and evidence to help us answer the following question:",
        id: "left-2",
        position: {
          left: 1,
          top: 5
        }
      },
      {
        type: "paragraph",
        text: "Alex: Objects fall slower if they are wide and spread out. Narrow objects fall faster than wide ones.",
        id: "left-6",
        position: {
          left: 0,
          top: 83
        }
      },
      {
        type: "paragraph",
        text: "Winnie: Heavy objects fall faster than light ones. Objects fall faster because of their weight.",
        id: "left-7",
        position: {
          left: 0,
          top: 90
        }
      },
      {
        id: "left-img-6-1773166697552",
        type: "image",
        assetId: "whiteboard",
        alt: "",
        position: {
          left: 10,
          top: 16,
          width: 52
        }
      },
      {
        id: "left-disc-6-1773166740517",
        type: "question",
        questionKind: "discussion",
        number: 1,
        prompt: "Below, Alex and Winnie have each made a claim that answers the question above. How do the objects they are holding provide evidence that supports their claims?",
        position: {
          left: 0,
          top: 48
        }
      },
      {
        id: "left-6-1773166784238",
        type: "paragraph",
        text: "Why do some objects fall through the air faster than others?",
        position: {
          top: 25,
          left: 19,
          width: 28
        }
      },
      {
        id: "left-subheader-7-1773167094868",
        type: "subheader",
        text: "New subheader"
      }
    ]
  },
  rightPage: {
    pageNumber: 37,
    blocks: [
      {
        type: "paragraph",
        text: "Complete the tests below and answer the questions that follow.",
        id: "right-1"
      },
      {
        type: "paragraph",
        text: "Drop a large ball and a smaller balloon from the same height at the same time.",
        id: "right-2"
      },
      {
        type: "paragraph",
        text: "Cut or tear a sheet of paper into a small piece and a big piece. Crumple the small piece, but leave the big piece flat. Drop both from the same height at the same time.",
        id: "right-3"
      },
      {
        type: "heading",
        level: 3,
        text: "PRACTICE:",
        id: "right-4"
      },
      {
        type: "practice",
        number: 8,
        text: "Which is wider: the ball or the balloon?",
        id: "right-5"
      },
      {
        type: "practice",
        number: 9,
        text: "Which is heavier: the crumpled sheet or the flat sheet?",
        id: "right-6"
      },
      {
        type: "practice",
        number: 10,
        text: "Which lands first: the ball or the balloon?",
        id: "right-7"
      },
      {
        type: "practice",
        number: 11,
        text: "Which lands first: the crumpled sheet or the flat sheet?",
        id: "right-8"
      },
      {
        type: "heading",
        level: 3,
        text: "JOURNAL:",
        id: "right-9"
      },
      {
        type: "practice",
        number: 12,
        text: "Consider Winnie's and Alex's claims. Which test above gives a counterexample to Alex's claim? Why? Which test above gives a counterexample to Winnie's claim? Why?",
        id: "right-10"
      }
    ]
  },
  footer: {
    leftSeriesText: "Beast Academy Science | Motion",
    rightChapterText: "Chapter 2 | Evidence"
  }
}
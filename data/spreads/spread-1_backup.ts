import type { SpreadData } from "./types";

/**
 * Spread 1: PDF pages 34–35 (Claims & Evidence / Counterexamples)
 */
export const spread1: SpreadData = {
  id: "spread-1",
  leftPage: {
    pageNumber: 34,
    largeHeaderBar: true,
    headerTitle: "CLAIMS & EVIDENCE",
    blocks: [
      {
        type: "paragraph",
        text: "A claim is an explanation for something based on what we know. Evidence from observations and measurements can help us decide whether a claim is true, or help us revise it. Let's take a look at Grogg's claim about addition and multiplication below.",
        id: "left-2",
        position: {
          left: 3,
          top: 0,
          height: 0
        }
      },
      {
        type: "grogg-note",
        text: "CLAIM: \nMultiplying two numbers \n  always gives a bigger \nresult than adding them.",
        id: "left-3",
        position: {
          left: 21,
          top: 22,
          width: 47
        }
      },
      {
        type: "paragraph",
        text: "Grogg collects the evidence below to support his claim:",
        id: "left-4",
        position: {
          left: 3,
          top: 49
        }
      },
      {
        type: "question",
        questionKind: "fill-in-the-blank",
        number: 1,
        prompt: "Find two more numbers whose sum (+) is less than their product (×).",
        validationRule: "sum_less_than_product",
        blanks: [
          {
            id: "a",
            maxLength: 4
          },
          {
            id: "b",
            maxLength: 4
          }
        ],
        id: "left-5",
        position: {
          left: 0,
          top: 69,
          width: 90
        }
      },
      {
        type: "question",
        questionKind: "fill-in-the-blank",
        number: 2,
        prompt: "Find two numbers whose sum (+) is greater than their product (×).",
        validationRule: "sum_greater_than_product",
        blanks: [
          {
            id: "a",
            maxLength: 4
          },
          {
            id: "b",
            maxLength: 4
          }
        ],
        id: "left-6",
        position: {
          left: 0,
          top: 81,
          width: 90
        }
      },
      {
        type: "question",
        questionKind: "multiple-choice",
        number: 3,
        prompt: "Is Grogg's claim always true?",
        choices: [
          {
            id: "yes",
            label: "Yes"
          },
          {
            id: "no",
            label: "No"
          }
        ],
        correctChoiceId: "no",
        id: "left-7",
        position: {
          left: 0,
          top: 92
        }
      },
      {
        id: "left-img-1",
        type: "image",
        assetId: "whiteboard",
        alt: "",
        position: {
          left: 12,
          top: 15,
          width: 53
        }
      },
      {
        id: "left-img-2",
        type: "image",
        assetId: "grogg-pose1",
        alt: "",
        position: {
          left: 54,
          top: 16,
          width: 38
        }
      },
      {
        id: "left-grogg-1",
        type: "grogg-note",
        text: "5 x 4 = 20\n5 + 4 = 9\n20 > 9",
        position: {
          left: 5,
          top: 55,
          width: 13
        }
      },
      {
        id: "left-grogg-2",
        type: "grogg-note",
        text: "3 x 3 = 9\n3 + 3 = 6\n9 > 6",
        position: {
          left: 24,
          top: 55,
          width: 11
        }
      },
      {
        id: "left-grogg-3",
        type: "grogg-note",
        text: "7 x 3 = 21\n7 + 3 = 10\n21 > 10",
        position: {
          left: 41,
          top: 55,
          width: 13
        }
      },
      {
        id: "left-grogg-4",
        type: "grogg-note",
        text: "4 x 9 = 36\n4 + 9 = 13\n36 > 13",
        position: {
          left: 60,
          top: 55,
          width: 13
        }
      },
      {
        id: "left-grogg-5",
        type: "grogg-note",
        text: "6 x 8 = 48\n6 + 8 = 14\n48 > 14",
        position: {
          left: 78,
          top: 55,
          width: 13
        }
      }
    ]
  },
  rightPage: {
    pageNumber: 35,
    blocks: [
      { type: "heading", level: 2, text: "COUNTEREXAMPLES" },
      {
        type: "paragraph",
        text: "One way to show that a claim is not always true is by finding a counterexample. Grogg could write hundreds of examples that support his claim, but if he finds a counterexample, he will need to revise his claim.",
      },
      {
        type: "paragraph",
        text: "Answer the questions below about counterexamples.",
      },
      { type: "heading", level: 3, text: "PRACTICE:" },
      {
        type: "practice",
        number: 4,
        text: "Find a counterexample that shows that the claim below is not always true. All animals have teeth.",
      },
      {
        type: "practice",
        number: 5,
        text: "What evidence would show that the claim below is not always true? All rocks sink in water.",
      },
      {
        type: "paragraph",
        text: "When scientists discover evidence that shows their claim is not true, they can use what they've learned to change their claim.",
      },
      {
        type: "practice",
        number: 6,
        text: "How could Grogg improve the claim he made on the previous page?",
      },
      { type: "discussion", text: "DISCUSSION:" },
    ],
  },
  footer: {
    leftSeriesText: "Beast Academy Science | Motion",
    rightChapterText: "Chapter 2 | Evidence",
  },
  hotspots: [],
};
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
        keypadMode: "numeric",
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
        keypadMode: "numeric",
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
        incorrectMessage: "Do your answers to questions 1 and 2 show that Grogg's claim might be true sometimes but false other times?",
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
      {
        type: "subheader",
        text: "COUNTEREXAMPLES",
        id: "right-1"
      },
      {
        type: "paragraph",
        text: "One way to show that a claim is not always true is by finding a counterexample. Grogg could write hundreds of examples that support his claim, but if he finds a counterexample, he will need to revise his claim.",
        id: "right-2"
      },
      {
        type: "instructions",
        id: "right-instructions-1",
        header: "PRACTICE:",
        text: "Answer the questions below about counterexamples."
      },
      {
        type: "question",
        questionKind: "fill-in-the-blank",
        number: 4,
        prompt: "Find a counterexample that shows that the claim below is not always true.",
        blanks: [
          {
            id: "a",
            maxLength: 40
          }
        ],
        aiValidationKind: "animal-without-teeth",
        keypadMode: "none",
        layout: "stacked",
        id: "right-4",
        position: {
          left: 0,
          top: 29
        }
      },
      {
        type: "info-box",
        id: "right-infobox-1",
        text: "All animals have teeth.",
        textAlign: "center",
        width: 200,
        position: {
          left: 31,
          top: 42
        }
      },
      {
        type: "question",
        questionKind: "fill-in-the-blank",
        number: 5,
        prompt: "What evidence would show that the claim below is not always true?",
        blanks: [
          {
            id: "a",
            maxLength: 40
          }
        ],
        layout: "stacked",
        aiValidationKind: "rocks-sink-evidence",
        position: {
          left: 0,
          top: 51
        },
        id: "right-6"
      },
      {
        id: "right-infobox-10-1772755477792",
        type: "info-box",
        text: "All rocks sink in water.",
        textAlign: "center",
        width: 200,
        position: {
          left: 31,
          top: 64
        }
      },
      {
        type: "paragraph",
        text: "When scientists discover evidence that shows their claim is not true, they can use what they've learned to change their claim.",
        position: {
          left: 0,
          top: 71
        },
        id: "right-7"
      },
      {
        type: "question",
        questionKind: "discussion",
        number: 6,
        prompt: "How could Grogg improve the claim he made on the previous page?",
        aiValidationKind: "grogg-claim-revision",
        officialSolution:
          "Grogg could revise his claim to say that for some pairs of numbers the sum is less than the product, and for other pairs the sum is greater. A counterexample shows the original claim is not always true.",
        position: {
          left: 0,
          top: 80
        },
        id: "right-8"
      }
    ]
  },
  footer: {
    leftSeriesText: "Beast Academy Science | Motion",
    rightChapterText: "Chapter 2 | Evidence"
  },
  hotspots: []
}
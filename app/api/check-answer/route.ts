import { NextRequest, NextResponse } from "next/server";

type AiValidationKind =
  | "animal-without-teeth"
  | "rocks-sink-evidence"
  | "grogg-claim-revision";

const PRIMARY_GEMINI_MODEL = "gemini-2.5-flash-lite";
const FALLBACK_GEMINI_MODEL = "gemini-3.1-flash-lite";
const PRIMARY_MODEL_BACKOFF_MS = 5 * 60_000;
let primaryModelBackoffUntil = 0;

type RateLimitState = {
  timestamps: number[];
};

const globalRateLimitStore = new Map<string, RateLimitState>();
const perQuestionRateLimitStore = new Map<string, RateLimitState>();

const GLOBAL_RATE_LIMITS = {
  perMinute: {
    windowMs: 60_000,
    max: 6,
  },
  perHour: {
    windowMs: 60 * 60_000,
    max: 20,
  },
} as const;

const PER_QUESTION_RATE_LIMITS = {
  perMinute: {
    windowMs: 60_000,
    max: 2,
  },
  perHour: {
    // Treat this as a slightly longer per-question window (~10 minutes).
    windowMs: 10 * 60_000,
    max: 6,
  },
} as const;

function isRateLimited(
  store: Map<string, RateLimitState>,
  limits: typeof GLOBAL_RATE_LIMITS | typeof PER_QUESTION_RATE_LIMITS,
  key: string,
  now: number,
): boolean {
  const state = store.get(key) ?? { timestamps: [] };
  const pruned = state.timestamps.filter(
    (ts) => now - ts <= limits.perHour.windowMs,
  );

  pruned.push(now);
  store.set(key, { timestamps: pruned });

  const inLastMinute = pruned.filter(
    (ts) => now - ts <= limits.perMinute.windowMs,
  ).length;
  const inLastHour = pruned.length;

  return (
    inLastMinute > limits.perMinute.max || inLastHour > limits.perHour.max
  );
}

interface CheckAnswerRequestBody {
  questionId?: string;
  aiValidationKind: AiValidationKind;
  answerText: string;
  /** Optional reference solution for grogg-claim-revision; used to judge alignment. */
  officialSolution?: string;
}

interface CheckAnswerResult {
  isCorrect: boolean;
  feedback: string;
}

function extractJsonObject(text: string): string | null {
  if (!text) return null;
  let trimmed = text.trim();

  // Strip leading ```... fences if present
  if (trimmed.startsWith("```")) {
    const firstNewline = trimmed.indexOf("\n");
    if (firstNewline !== -1) {
      trimmed = trimmed.slice(firstNewline + 1);
    }
    const fenceIndex = trimmed.lastIndexOf("```");
    if (fenceIndex !== -1) {
      trimmed = trimmed.slice(0, fenceIndex);
    }
    trimmed = trimmed.trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  return null;
}

interface GeminiRequestOptions {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  /** Optional maxOutputTokens override for models that need it (e.g. grogg-claim-revision). */
  maxOutputTokens?: number;
}

async function fetchGeminiWithFallback(
  options: GeminiRequestOptions,
): Promise<Response> {
  const { apiKey, systemPrompt, userPrompt, maxOutputTokens } = options;

  const makeRequest = async (model: string) => {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      `${model}:generateContent?key=` +
      apiKey;

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0,
          ...(typeof maxOutputTokens === "number"
            ? { maxOutputTokens }
            : {}),
        },
      }),
    });
  };

  const now = Date.now();
  const useFallbackFirst = now < primaryModelBackoffUntil;

  let response = await makeRequest(
    useFallbackFirst ? FALLBACK_GEMINI_MODEL : PRIMARY_GEMINI_MODEL,
  );

  if (
    !response.ok &&
    (response.status === 503 || response.status === 404) &&
    !useFallbackFirst
  ) {
    // Primary unavailable (overloaded or retired); try the fallback model.
    if (response.status === 503) {
      primaryModelBackoffUntil = now + PRIMARY_MODEL_BACKOFF_MS;
    }
    response = await makeRequest(FALLBACK_GEMINI_MODEL);
  }

  return response;
}

async function callAiForAnimalWithoutTeeth(
  answerText: string,
): Promise<CheckAnswerResult> {
  const trimmedAnswer = answerText.trim().slice(0, 300);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Please talk with your teacher about examples of animals without teeth.",
    };
  }

  const systemPrompt =
    "You are a science tutor checking a science counterexample. " +
    "The claim is: 'All animals have teeth.' " +
    "Student answers are short phrases or sentences. " +
    "An answer is correct if it clearly names at least one real kind of animal that does not have teeth. " +
    "Answers that describe a typical toothed animal (like a tiger or a human) as having no teeth are incorrect. " +
    "For incorrect answers, follow these feedback rules: " +
    "If the student's answer includes a statement that is true but does NOT actually give a counterexample (for example, it correctly describes an animal feature but still does not name an animal that makes the claim false), your feedback MUST: " +
    "1) begin with the exact words 'Hold up.'; " +
    "2) briefly acknowledge the true part of what they said, using their idea in simple language; and " +
    "3) remind them to read the question carefully and that they need a counterexample: an example that shows the claim 'All animals have teeth' is not always true. " +
    "In this situation, do NOT mention any new animals the student did not already name and do NOT give a specific animal that solves the question. " +
    "For any incorrect answer, you MUST NOT say phrases like 'animal with no teeth', 'animal that does not have teeth', or anything that directly tells the student that they must name an animal without teeth. " +
    "For other incorrect answers that are false, off-topic, or nonsense, you may give normal encouraging feedback (without 'Hold up.') that talks about needing a counterexample to the claim, but still must not explicitly say that the answer needs to be an animal without teeth. " +
    "When the answer is correct, you may clearly explain that the named animal does not have teeth and that this makes it a counterexample to the claim.";

  const userPrompt = `
Student answer: """${trimmedAnswer}"""

Decide if this answer gives at least one real kind of animal that truly does not have teeth.

Respond ONLY with strict JSON in this format:
{
  "isCorrect": true or false,
  "feedback": "short explanation for a middle-school student"
}
Do not include any other text, explanation, or code fences.
`;

  try {
    const response = await fetchGeminiWithFallback({
      apiKey,
      systemPrompt,
      userPrompt,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini HTTP error", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        context: "animal-without-teeth",
      });
      if (response.status === 429) {
        return {
          isCorrect: false,
          feedback:
            "I’ve been asked to check too many answers in a short time. Please wait a moment and try again.",
        };
      }
      if (response.status === 404) {
        return {
          isCorrect: false,
          feedback:
            "I couldn't reach the answer-checking service right now. Please try again later or talk with your teacher about animals without teeth.",
        };
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("Gemini raw content for animal-without-teeth:", raw);

    try {
      const jsonText = extractJsonObject(raw);
      if (jsonText) {
        const parsed = JSON.parse(jsonText) as {
          isCorrect?: boolean | string;
          feedback?: unknown;
        };

        const isCorrectValue =
          typeof parsed.isCorrect === "boolean"
            ? parsed.isCorrect
            : typeof parsed.isCorrect === "string"
              ? parsed.isCorrect.toLowerCase() === "true"
              : null;

        const feedbackValue =
          typeof parsed.feedback === "string"
            ? parsed.feedback
            : parsed.feedback != null
              ? String(parsed.feedback)
              : null;

        if (
          typeof isCorrectValue === "boolean" &&
          typeof feedbackValue === "string"
        ) {
          return {
            isCorrect: isCorrectValue,
            feedback: feedbackValue,
          };
        }
      }
    } catch {
      // fall through to generic feedback
    }

    return {
      isCorrect: false,
      feedback:
        "I couldn't be sure about that answer. Try naming a specific animal that really does not have teeth.",
    };
  } catch (error) {
    console.error("AI validation error:", error);
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Try again later or discuss examples with your teacher.",
    };
  }
}

async function callAiForRocksSinkEvidence(
  answerText: string,
): Promise<CheckAnswerResult> {
  const trimmedAnswer = answerText.trim().slice(0, 300);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Please talk with your teacher about rocks that float in water.",
    };
  }

  const systemPrompt =
    "You are a science tutor helping a student think about evidence and counterexamples. " +
    "The claim is: 'All rocks sink in water.' " +
    "Student answers are short phrases or sentences. " +
    "An answer is correct if it clearly describes observing at least one real rock that does not sink in water (a rock that floats instead of sinking). " +
    "Answers are incorrect if they make false generalizations (like 'small rocks never sink') or describe true but non-refuting observations (like 'sand sinks in water') or do not actually provide evidence that a rock can float. " +
    "For incorrect answers, follow these feedback rules: " +
    "If the student's answer includes a statement that is true but does NOT actually give evidence that a rock can float (for example, it correctly describes something about rocks or water but still does not describe a rock that does not sink), your feedback MUST: " +
    "1) begin with the exact words 'Hold up.'; " +
    "2) briefly acknowledge the true part of what they said, using their idea in simple language; and " +
    "3) remind them to read the question carefully and that they need evidence of a real rock that shows the claim 'All rocks sink in water' is not always true (a rock that does not sink). " +
    "In this situation, do NOT mention any new types of rocks or give a specific rock that solves the question. " +
    "For other incorrect answers that are false, off-topic, or nonsense, you may give normal encouraging feedback that does NOT start with 'Hold up.' and that reminds them they must describe evidence of at least one real rock that does not sink in water. " +
    "Never give away a new example of a rock that floats that the student did not already mention.";

  const userPrompt = `
Student answer: """${trimmedAnswer}"""

Decide if this answer gives evidence that the claim "All rocks sink in water" is not always true by describing at least one real rock that does not sink (or floats) in water.

Respond ONLY with strict JSON in this format:
{
  "isCorrect": true or false,
  "feedback": "short explanation for a middle-school student"
}
Do not include any other text, explanation, or code fences.
`;

  try {
    const response = await fetchGeminiWithFallback({
      apiKey,
      systemPrompt,
      userPrompt,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini HTTP error", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        context: "rocks-sink-evidence",
      });
      if (response.status === 429) {
        return {
          isCorrect: false,
          feedback:
            "I’ve been asked to check too many answers in a short time. Please wait a moment and try again.",
        };
      }
      if (response.status === 404) {
        return {
          isCorrect: false,
          feedback:
            "I couldn't reach the answer-checking service right now. Please try again later or talk with your teacher about rocks that float.",
        };
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    console.log("Gemini raw content for rocks-sink-evidence:", raw);

    try {
      const jsonText = extractJsonObject(raw);
      if (jsonText) {
        const parsed = JSON.parse(jsonText) as {
          isCorrect?: boolean | string;
          feedback?: unknown;
        };

        const isCorrectValue =
          typeof parsed.isCorrect === "boolean"
            ? parsed.isCorrect
            : typeof parsed.isCorrect === "string"
              ? parsed.isCorrect.toLowerCase() === "true"
              : null;

        const feedbackValue =
          typeof parsed.feedback === "string"
            ? parsed.feedback
            : parsed.feedback != null
              ? String(parsed.feedback)
              : null;

        if (
          typeof isCorrectValue === "boolean" &&
          typeof feedbackValue === "string"
        ) {
          return {
            isCorrect: isCorrectValue,
            feedback: feedbackValue,
          };
        }
      }
    } catch {
      // fall through to generic feedback
    }

    return {
      isCorrect: false,
      feedback:
        "I couldn't be sure about that answer. Try describing a real rock that does not sink in water.",
    };
  } catch (error) {
    console.error("AI validation error:", error);
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Try again later or discuss examples with your teacher.",
    };
  }
}

const GROGG_CLAIM_REVISION_MAX_TOKENS = 280;

async function callAiForGroggClaimRevision(
  answerText: string,
  officialSolution?: string,
): Promise<CheckAnswerResult> {
  const trimmedAnswer = answerText.trim().slice(0, 500);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Please talk with your teacher about how to improve Grogg's claim.",
    };
  }

  const reference =
    officialSolution?.trim() ||
    "Grogg could revise his claim to say that for some pairs of numbers the sum is less than the product, and for others the sum is greater. A counterexample shows the original claim is not always true. Specific means naming which numbers work or do not (e.g. 0 and 1 break the claim; 2+2=2×2; a good revision restricts to numbers larger than 2).";

  const systemPrompt =
    "You are a science tutor helping a student (about 4th grade) think about revising a claim. " +
    "The context: Grogg had claimed something like 'the sum is always less than the product' (or similar); students found counterexamples. " +
    "The question is: How could Grogg improve the claim he made? " +
    "Student answers are 1–2 sentences. " +
    "Do not give the full solution upfront. " +
    "Set isCorrect true ONLY if the student has written something specific about which numbers work with Grogg's claim and which do not: e.g. naming counterexamples (like 0, 1, or 2+2=2×2), or restricting to 'numbers larger than 1' or 'numbers larger than 2,' or otherwise clearly indicating which numbers work and which don't. " +
    "Set isCorrect false when the answer is vague (e.g. only 'Grogg should say usually' or 'some numbers don't work' without naming which numbers or giving an example). " +
    "When the student has not been specific enough, in your feedback ask them in 1–2 sentences to add which numbers work and which do not, or to give an example of a number or pair that doesn't work. " +
    "If the student says something false about math, point it out briefly. " +
    "If the answer is off-topic, say exactly: I don't see how that is related to the question. Then briefly restate what the question is about and invite them to try again. " +
    "Do not teach math beyond a typical 4th-grade level. " +
    "Use this as your reference for a good direction (do not repeat it verbatim to the student): " +
    reference;

  const userPrompt = `
Student answer: """${trimmedAnswer}"""

Set isCorrect true only if the student has written something specific about which numbers work and which do not (e.g. naming 0, 1, 2+2=2×2, or 'numbers larger than 1' or 'numbers larger than 2'). Otherwise set isCorrect false and in feedback prompt the student to add which numbers work and which do not, or to give an example of a pair that doesn't work. Keep feedback 2–3 sentences at a 4th-grade level.

Respond ONLY with strict JSON:
{
  "isCorrect": true or false,
  "feedback": "short message for the student"
}
No other text or code fences.
`;

  try {
    const response = await fetchGeminiWithFallback({
      apiKey,
      systemPrompt,
      userPrompt,
      maxOutputTokens: GROGG_CLAIM_REVISION_MAX_TOKENS,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini HTTP error (grogg-claim-revision)", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      if (response.status === 429) {
        return {
          isCorrect: false,
          feedback:
            "I've been asked to check too many answers in a short time. Please wait a moment and try again.",
        };
      }
      if (response.status === 404) {
        return {
          isCorrect: false,
          feedback:
            "I couldn't reach the answer-checking service right now. Please try again later or talk with your teacher.",
        };
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    try {
      const jsonText = extractJsonObject(raw);
      if (jsonText) {
        const parsed = JSON.parse(jsonText) as {
          isCorrect?: boolean | string;
          feedback?: unknown;
        };

        const isCorrectValue =
          typeof parsed.isCorrect === "boolean"
            ? parsed.isCorrect
            : typeof parsed.isCorrect === "string"
              ? parsed.isCorrect.toLowerCase() === "true"
              : null;

        const feedbackValue =
          typeof parsed.feedback === "string"
            ? parsed.feedback
            : parsed.feedback != null
              ? String(parsed.feedback)
              : null;

        if (
          typeof isCorrectValue === "boolean" &&
          typeof feedbackValue === "string"
        ) {
          return {
            isCorrect: isCorrectValue,
            feedback: feedbackValue,
          };
        }
      }
    } catch {
      // fall through
    }

    return {
      isCorrect: false,
      feedback:
        "I couldn't be sure about that answer. Try writing one or two sentences about how Grogg could change his claim so it's more accurate.",
    };
  } catch (error) {
    console.error("AI validation error (grogg-claim-revision):", error);
    return {
      isCorrect: false,
      feedback:
        "I couldn't check this answer right now. Try again later or talk with your teacher.",
    };
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CheckAnswerRequestBody;
  const { aiValidationKind, answerText, officialSolution, questionId } = body;

  const clientId =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const questionKey =
    questionId && questionId.trim().length > 0
      ? `${aiValidationKind}:${questionId}`
      : aiValidationKind;
  const perQuestionKey = `${clientId}|${questionKey}`;

  if (isRateLimited(perQuestionRateLimitStore, PER_QUESTION_RATE_LIMITS, perQuestionKey, now)) {
    return NextResponse.json<CheckAnswerResult>(
      {
        isCorrect: false,
        feedback:
          "You’ve checked this question several times in a row. Take a moment to think about your idea, then try again.",
      },
      { status: 429 },
    );
  }

  if (isRateLimited(globalRateLimitStore, GLOBAL_RATE_LIMITS, clientId, now)) {
    return NextResponse.json<CheckAnswerResult>(
      {
        isCorrect: false,
        feedback:
          "I’ve been asked to check too many answers in a short time. Please wait a moment and try again.",
      },
      { status: 429 },
    );
  }

  if (!aiValidationKind || !answerText?.trim()) {
    return NextResponse.json<CheckAnswerResult>(
      {
        isCorrect: false,
        feedback:
          "Please type an answer before checking. Try describing an animal that does not have teeth.",
      },
      { status: 400 },
    );
  }

  let result: CheckAnswerResult;

  switch (aiValidationKind) {
    case "animal-without-teeth":
      result = await callAiForAnimalWithoutTeeth(answerText);
      break;
    case "rocks-sink-evidence":
      result = await callAiForRocksSinkEvidence(answerText);
      break;
    case "grogg-claim-revision":
      result = await callAiForGroggClaimRevision(answerText, officialSolution);
      break;
    default:
      result = {
        isCorrect: false,
        feedback:
          "I couldn't check this answer yet. This kind of question isn't supported.",
      };
  }

  return NextResponse.json<CheckAnswerResult>(result);
}


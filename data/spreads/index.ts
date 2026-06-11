import type { SpreadData } from "./types";
import { PARAGRAPH_COLOR_HEX } from "./types";
import { spread1 } from "./spread-1";
import { spread2 } from "./spread-2";
import { spread3 } from "./spread-3";

export const spreads: SpreadData[] = [spread1, spread2, spread3];
export { PARAGRAPH_COLOR_HEX };

export function getSpread(id: string): SpreadData | undefined {
  return spreads.find((s) => s.id === id);
}

export function getSpreadIds(): string[] {
  return spreads.map((s) => s.id);
}

export type {
  SpreadData,
  SpreadFooter,
  PageContent,
  Hotspot,
  ContentBlock,
  BlockPosition,
  ParagraphFont,
  ParagraphColor,
  ParagraphFontSize,
  QuestionKind,
  FibValidationRule,
  QuestionChoice,
  QuestionBlank,
  QuestionBlock,
  QuestionBlockMCQ,
  QuestionBlockFillInBlank,
  QuestionBlockDiscussion,
} from "./types";

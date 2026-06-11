/**
 * Spread = one open-book view (left page + center line + right page).
 * Used for Living Books–style interactive book.
 */

export interface SpreadFooter {
  /** Left page: e.g. "Beast Academy Science | Motion" */
  leftSeriesText?: string;
  /** Right page: e.g. "Chapter 2 | Evidence" */
  rightChapterText?: string;
}

/**
 * Optional absolute positioning (percentage-based) for blocks/hotspots
 * so layouts scale with the spread while remaining editable.
 */
export interface BlockPosition {
  /** Percentage from the left edge of the page (0–100). */
  left: number;
  /** Percentage from the top edge of the page (0–100). */
  top: number;
  /** Optional width/height as percentages of the page size (0–100). */
  width?: number;
  height?: number;
}

/** Fields shared by all editable content blocks. */
export interface BaseBlock {
  /**
   * Stable identifier so editor mode can select and update
   * a specific block regardless of its array index.
   */
  id?: string;
  /**
   * Optional absolute position for editor mode. When omitted,
   * the block participates in normal document flow.
   */
  position?: BlockPosition;
}

export type QuestionKind =
  | "multiple-choice"
  | "fill-in-the-blank"
  | "discussion";

export interface QuestionChoice {
  id: string;
  label: string;
}

export interface QuestionBlank {
  id: string;
  maxLength: number;
}

export type FibValidationRule =
  | "sum_less_than_product"
  | "sum_greater_than_product";

export type QuestionBlockMCQ = BaseBlock & {
  type: "question";
  questionKind: "multiple-choice";
  number: number;
  prompt: string;
  choices: QuestionChoice[];
  correctChoiceId?: string;
  /** Optional custom popup messages */
  correctMessage?: string;
  incorrectMessage?: string;
};

export type QuestionBlockFillInBlank = BaseBlock & {
  type: "question";
  questionKind: "fill-in-the-blank";
  number: number;
  prompt: string;
  blanks: QuestionBlank[];
  validationRule?: FibValidationRule;
  /** Optional layout for how blanks appear relative to the prompt */
  layout?: "inline" | "stacked";
  /** Optional input/keypad mode for blanks */
  keypadMode?: "numeric" | "none";
  /** Optional AI-backed validation for open-ended answers */
  aiValidationKind?: "animal-without-teeth" | "rocks-sink-evidence";
  /** Optional custom popup messages */
  correctMessage?: string;
  incorrectMessage?: string;
};

export type QuestionBlockDiscussion = BaseBlock & {
  type: "question";
  questionKind: "discussion";
  number: number;
  prompt: string;
  /** When set, the question number circle is clickable and triggers AI feedback (e.g. grogg-claim-revision). */
  aiValidationKind?: "grogg-claim-revision";
  /** Optional reference solution for the AI; used only when aiValidationKind is set. */
  officialSolution?: string;
};

export type QuestionBlock =
  | QuestionBlockMCQ
  | QuestionBlockFillInBlank
  | QuestionBlockDiscussion;

/** Font options for paragraph (standard text) blocks in the editor. */
export type ParagraphFont = "bebas" | "roboto" | "roboto-slab";

/** Color options for paragraph (standard text) blocks in the editor. */
export type ParagraphColor =
  | "white"
  | "green"
  | "blue"
  | "purple"
  | "dark-blue"
  | "black";

/** Font size for paragraph blocks: xs (smaller), sm (default), base (larger). */
export type ParagraphFontSize = "xs" | "sm" | "base";

export const PARAGRAPH_COLOR_HEX: Record<ParagraphColor, string> = {
  white: "#ffffff",
  green: "#007e6c",
  blue: "#1a5092",
  purple: "#62497f",
  "dark-blue": "#0e3465",
  black: "#000000",
};

export type ContentBlock =
  | (BaseBlock & { type: "heading"; level: 1 | 2 | 3; text: string })
  | (BaseBlock & { type: "subheader"; text: string })
  | (BaseBlock & {
      type: "lab-game-header";
      title: string;
      subtitle?: string;
    })
  | (BaseBlock & {
      type: "paragraph";
      text: string;
      font?: ParagraphFont;
      color?: ParagraphColor;
      fontSize?: ParagraphFontSize;
    })
  | (BaseBlock & { type: "list"; items: string[] })
  | (BaseBlock & { type: "practice"; number: number; text: string })
  | (BaseBlock & { type: "discussion"; text: string })
  | (BaseBlock & { type: "grogg-note"; text: string })
  | (BaseBlock & { type: "instructions"; header: string; text: string })
  | (BaseBlock & {
      type: "info-box";
      text: string;
      width?: number;
      /** Optional explicit height in pixels; defaults to 60 when omitted */
      height?: number;
      /** Text alignment; default is "left" */
      textAlign?: "left" | "center";
      /** When set (e.g. "canopy"), render the matching game control (e.g. Start button) inside the box */
      gameId?: string;
    })
  | (BaseBlock & { type: "raw"; html?: string })
  | QuestionBlock
  /** Inline playable game (e.g. Canopy). Rendered by a dedicated component; no persistence. */
  | (BaseBlock & { type: "game"; gameId: string })
  /** Game control (e.g. Start game button) for a specific game. */
  | (BaseBlock & { type: "game-control"; gameId: string })
  /**
   * Image block – references an asset from the image registry.
   * The editor can position and resize this using `position`.
   */
  | (BaseBlock & {
      type: "image";
      assetId: string;
      alt?: string;
    });

export interface PageContent {
  /** Page number shown in blue bar (e.g. 14, 15) */
  pageNumber: number;
  /** Optional large header bar at top of page */
  largeHeaderBar?: boolean;
  /** Optional header title to render over the large header bar */
  headerTitle?: string;
  /** Optional narration audio URL (per page or per spread) */
  narrationUrl?: string;
  /** Structured content blocks for this page */
  blocks: ContentBlock[];
}

export type HotspotActionType = "tooltip" | "audio" | "animation";

export interface Hotspot {
  id: string;
  /** Which page this hotspot appears on */
  page: "left" | "right";
  /** Percentage-based position and size (0-100) for ratio preservation */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Optional label for accessibility / tooltip */
  label?: string;
  /** Optional action that the hotspot triggers in reader mode. */
  actionType?: HotspotActionType;
  /**
   * Free-form payload configuration for the chosen action.
   * For example, audio hotspots can store an `audioAssetId`.
   */
  payload?: Record<string, unknown>;
}

export interface SpreadData {
  id: string;
  /** Left page (e.g. PDF p.14) */
  leftPage: PageContent;
  /** Right page (e.g. PDF p.15) */
  rightPage: PageContent;
  footer?: SpreadFooter;
  /** Optional accent color for sidebars and page number boxes; when omitted, default blue is used. */
  sidebarColor?: string;
  /** Hotspots for this spread (optional for PoC) */
  hotspots?: Hotspot[];
  /** Optional narration URL for the whole spread */
  narrationUrl?: string;
  /** Optional reference to original PDF pages for this spread. */
  pdfPageLeft?: number;
  pdfPageRight?: number;
}

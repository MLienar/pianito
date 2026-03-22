import { Note } from "tonal";
import { match } from "ts-pattern";

export const STAFF_TOP = 40;
export const LINE_SPACING = 24;
export const NOTE_RADIUS = 10;
export const STEM_X_INSET = 1;

export const LETTER_STEPS: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export const COLORS = {
  foreground: "var(--color-foreground)",
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  destructive: "var(--color-destructive)",
};

export const CLEF_SYMBOLS: Record<"treble" | "bass", string> = {
  treble: "\u{1D11E}",
  bass: "\u{1D122}",
};

export interface ParsedNote {
  y: number;
  letter: string;
  accidental: string | null;
  ledgerLines: number[];
}

const parseNoteCache = new Map<string, ParsedNote>();

export function parseNote(
  noteStr: string,
  clef: "treble" | "bass",
): ParsedNote {
  const key = `${noteStr}|${clef}`;
  const cached = parseNoteCache.get(key);
  if (cached) return cached;

  const n = Note.get(noteStr);
  const letter = n.letter;
  const octave = n.oct ?? 4;
  const step = LETTER_STEPS[letter] ?? 0;

  const bottomLineY = STAFF_TOP + 4 * LINE_SPACING;
  const stepsFromRef = match(clef)
    .with("treble", () => (octave - 4) * 7 + step - 2)
    .with("bass", () => (octave - 2) * 7 + step - 4)
    .exhaustive();
  const y = bottomLineY - stepsFromRef * (LINE_SPACING / 2);

  const accidental = match(n.acc)
    .with("#", () => "\u266F")
    .with("b", () => "\u266D")
    .with("##", () => "\u{1D12A}")
    .with("bb", () => "\u{1D12B}")
    .otherwise(() => null);

  const ledgerLines: number[] = [];
  const topLine = STAFF_TOP;
  const bottomLine = STAFF_TOP + 4 * LINE_SPACING;
  for (let ly = topLine - LINE_SPACING; ly >= y - 1; ly -= LINE_SPACING) {
    ledgerLines.push(ly);
  }
  for (let ly = bottomLine + LINE_SPACING; ly <= y + 1; ly += LINE_SPACING) {
    ledgerLines.push(ly);
  }

  const result = { y, letter, accidental, ledgerLines };
  parseNoteCache.set(key, result);
  return result;
}

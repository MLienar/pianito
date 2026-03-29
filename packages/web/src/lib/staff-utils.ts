import { Note } from "tonal";
import { match } from "ts-pattern";

export const STAFF_TOP = 60;
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

// ─── Key signature rendering positions ──────────────────────────────
// Steps from bottom staff line (E4 treble, G2 bass) for each accidental.
// Positive = above bottom line, negative = below.

// Sharps appear in order: F, C, G, D, A, E, B
// Treble clef positions (steps from bottom line, where bottom line = E4)
const SHARP_STEPS_TREBLE = [4, 1, 5, 2, -1, 3, 0]; // F5, C5, G5, D5, A4, E5, B4
// Bass clef positions (steps from bottom line, where bottom line = G2)
const SHARP_STEPS_BASS = [4, 1, 5, 2, -1, 3, 0]; // same pattern, transposed

// Flats appear in order: B, E, A, D, G, C, F
const FLAT_STEPS_TREBLE = [0, 3, -1, 2, -2, 1, -3]; // B4, E5, A4, D5, G4, C5, F4
const FLAT_STEPS_BASS = [0, 3, -1, 2, -2, 1, -3]; // same pattern

const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"];
const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"];

export interface KeySignatureGlyph {
  symbol: string;
  y: number;
  x: number;
}

export function getKeySignatureGlyphs(
  keySignature: string[],
  clef: "treble" | "bass",
): KeySignatureGlyph[] {
  if (keySignature.length === 0) return [];

  const bottomLineY = STAFF_TOP + 4 * LINE_SPACING;
  const halfStep = LINE_SPACING / 2;
  const baseX = 60; // after clef symbol
  const spacing = 16;

  const isFlat = keySignature[0]?.includes("b") ?? false;

  if (isFlat) {
    const steps = clef === "treble" ? FLAT_STEPS_TREBLE : FLAT_STEPS_BASS;
    return keySignature.map((acc, i) => {
      const orderIndex = FLAT_ORDER.indexOf(acc);
      const step = steps[orderIndex >= 0 ? orderIndex : i] ?? 0;
      return {
        symbol: "\u266D", // ♭
        y: bottomLineY - step * halfStep,
        x: baseX + i * spacing,
      };
    });
  }

  const steps = clef === "treble" ? SHARP_STEPS_TREBLE : SHARP_STEPS_BASS;
  return keySignature.map((acc, i) => {
    const orderIndex = SHARP_ORDER.indexOf(acc);
    const step = steps[orderIndex >= 0 ? orderIndex : i] ?? 0;
    return {
      symbol: "\u266F", // ♯
      y: bottomLineY - step * halfStep,
      x: baseX + i * spacing,
    };
  });
}

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

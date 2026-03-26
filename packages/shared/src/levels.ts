import { Note } from "tonal";

export interface ExerciseLevel {
  level: number;
  name: string;
  clef: "treble" | "bass";
  notes: string[];
  newNotes: string[];
  keySignature: string[];
  count: number;
  tempo: number;
}

export interface LevelGroup {
  name: string;
  clef: "treble" | "bass";
  newNotes: string[];
  keySignature: string[];
  levels: number[];
}

// ─── Note constants ─────────────────────────────────────────────────

export const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;

// ─── Curriculum definition ──────────────────────────────────────────
// Each block defines:
//   name, clef, notes (cumulative), newNotes (introduced this block),
//   and sub-levels with [count, tempo] pairs.

interface BlockDef {
  name: string;
  clef: "treble" | "bass";
  notes: string[];
  newNotes: string[];
  keySignature: string[];
  steps: [count: number, tempo: number][];
}

const BLOCKS: BlockDef[] = [
  // ── Stage 1: Treble — Natural Notes (1–11) ────────────────────────
  {
    name: "First Notes",
    clef: "treble",
    notes: ["C", "D", "E"],
    newNotes: ["C", "D", "E"],
    keySignature: [],
    steps: [
      [8, 45],
      [10, 48],
      [12, 50],
    ],
  },
  {
    name: "C Position",
    clef: "treble",
    notes: ["C", "D", "E", "F", "G"],
    newNotes: ["F", "G"],
    keySignature: [],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Expanding Up",
    clef: "treble",
    notes: [...NATURAL_NOTES],
    newNotes: ["A", "B"],
    keySignature: [],
    steps: [
      [10, 48],
      [12, 50],
      [14, 52],
      [16, 55],
    ],
  },

  // ── Stage 2: Bass Clef Enters (12–28) ─────────────────────────────
  {
    name: "Bass — First Notes",
    clef: "bass",
    notes: ["C", "D", "E"],
    newNotes: ["C", "D", "E"],
    keySignature: [],
    steps: [
      [8, 42],
      [10, 45],
      [12, 48],
    ],
  },
  {
    name: "Treble — Upper Staff",
    clef: "treble",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [14, 52],
      [16, 55],
      [18, 58],
      [20, 60],
    ],
  },
  {
    name: "Bass — Expanding",
    clef: "bass",
    notes: ["C", "D", "E", "F", "G", "A"],
    newNotes: ["F", "G", "A"],
    keySignature: [],
    steps: [
      [10, 42],
      [12, 45],
      [14, 48],
      [16, 50],
    ],
  },
  {
    name: "Bass — Full Range",
    clef: "bass",
    notes: [...NATURAL_NOTES],
    newNotes: ["B"],
    keySignature: [],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },

  // ── Stage 3: Ledger Lines & Full Range (29–40) ────────────────────
  {
    name: "Treble — Ledger Lines",
    clef: "treble",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [14, 52],
      [16, 55],
      [18, 58],
    ],
  },
  {
    name: "Bass — Ledger Lines",
    clef: "bass",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [14, 48],
      [16, 50],
      [18, 52],
    ],
  },
  {
    name: "Treble — Speed Drill",
    clef: "treble",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [18, 60],
      [20, 63],
      [22, 66],
    ],
  },
  {
    name: "Bass — Speed Drill",
    clef: "bass",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [18, 55],
      [20, 58],
      [22, 60],
    ],
  },

  // ── Stage 4: Mixed Clef Reading (41–48) ───────────────────────────
  {
    name: "Mixed — Easy Range",
    clef: "treble",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [14, 50],
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },
  {
    name: "Mixed — Easy Range",
    clef: "bass",
    notes: [...NATURAL_NOTES],
    newNotes: [],
    keySignature: [],
    steps: [
      [14, 50],
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },

  // ── Stage 5: Key Signatures — One at a Time (49–76) ──────────────
  // Key of G major (1 sharp: F#)
  {
    name: "Key of G — Treble",
    clef: "treble",
    notes: ["C", "D", "E", "F#", "G", "A", "B"],
    newNotes: ["F#"],
    keySignature: ["F#"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Key of G — Bass",
    clef: "bass",
    notes: ["C", "D", "E", "F#", "G", "A", "B"],
    newNotes: ["F#"],
    keySignature: ["F#"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  // Key of F major (1 flat: Bb)
  {
    name: "Key of F — Treble",
    clef: "treble",
    notes: ["C", "D", "E", "F", "G", "A", "Bb"],
    newNotes: ["Bb"],
    keySignature: ["Bb"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Key of F — Bass",
    clef: "bass",
    notes: ["C", "D", "E", "F", "G", "A", "Bb"],
    newNotes: ["Bb"],
    keySignature: ["Bb"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
    ],
  },
  // Key of D major (2 sharps: F#, C#)
  {
    name: "Key of D — Treble",
    clef: "treble",
    notes: ["C#", "D", "E", "F#", "G", "A", "B"],
    newNotes: ["C#"],
    keySignature: ["F#", "C#"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  // Key of Bb major (2 flats: Bb, Eb)
  {
    name: "Key of Bb — Bass",
    clef: "bass",
    notes: ["C", "D", "Eb", "F", "G", "A", "Bb"],
    newNotes: ["Eb"],
    keySignature: ["Bb", "Eb"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },

  // ── Stage 6: More Key Signatures (77–90) ──────────────────────────
  // Key of A major (3 sharps: F#, C#, G#)
  {
    name: "Key of A — Treble",
    clef: "treble",
    notes: ["A", "B", "C#", "D", "E", "F#", "G#"],
    newNotes: ["G#"],
    keySignature: ["F#", "C#", "G#"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  // Key of Eb major (3 flats: Bb, Eb, Ab)
  {
    name: "Key of Eb — Bass",
    clef: "bass",
    notes: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    newNotes: ["Ab"],
    keySignature: ["Bb", "Eb", "Ab"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  // Practice: sharp keys
  {
    name: "Sharps Review",
    clef: "treble",
    notes: ["C#", "D", "E", "F#", "G", "G#", "A", "B"],
    newNotes: [],
    keySignature: ["F#", "C#", "G#"],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },
  // Practice: flat keys
  {
    name: "Flats Review",
    clef: "bass",
    notes: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
    newNotes: [],
    keySignature: ["Bb", "Eb", "Ab"],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },
  // Key of E major (4 sharps: F#, C#, G#, D#)
  {
    name: "Key of E — Treble",
    clef: "treble",
    notes: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    newNotes: ["D#"],
    keySignature: ["F#", "C#", "G#", "D#"],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },

  // ── Stage 7: Mastery (91–100) ─────────────────────────────────────
  {
    name: "Key of G — Mastery",
    clef: "treble",
    notes: ["C", "D", "E", "F#", "G", "A", "B"],
    newNotes: [],
    keySignature: ["F#"],
    steps: [
      [20, 58],
      [22, 62],
      [25, 65],
    ],
  },
  {
    name: "Key of F — Mastery",
    clef: "bass",
    notes: ["C", "D", "E", "F", "G", "A", "Bb"],
    newNotes: [],
    keySignature: ["Bb"],
    steps: [
      [20, 58],
      [22, 62],
      [25, 65],
    ],
  },
  {
    name: "Mastery",
    clef: "treble",
    notes: ["A", "B", "C#", "D", "E", "F#", "G#"],
    newNotes: [],
    keySignature: ["F#", "C#", "G#"],
    steps: [
      [25, 65],
      [25, 68],
      [25, 72],
      [25, 76],
    ],
  },
];

// ─── Build flat level array ─────────────────────────────────────────

function buildLevels(): ExerciseLevel[] {
  const levels: ExerciseLevel[] = [];
  let levelNum = 1;

  for (const block of BLOCKS) {
    for (const [count, tempo] of block.steps) {
      levels.push({
        level: levelNum,
        name: block.name,
        clef: block.clef,
        notes: block.notes,
        newNotes: block.newNotes,
        keySignature: block.keySignature,
        count,
        tempo,
      });
      levelNum++;
    }
  }

  return levels;
}

export const EXERCISE_LEVELS: ExerciseLevel[] = buildLevels();

// ─── Group levels by block for the UI ───────────────────────────────
// Derived from EXERCISE_LEVELS to avoid duplicating the level counter.

function buildGroups(): LevelGroup[] {
  const groups: LevelGroup[] = [];
  let i = 0;

  for (const block of BLOCKS) {
    const levels = EXERCISE_LEVELS.slice(i, i + block.steps.length).map(
      (l) => l.level,
    );
    groups.push({
      name: block.name,
      clef: block.clef,
      newNotes: block.newNotes,
      keySignature: block.keySignature,
      levels,
    });
    i += block.steps.length;
  }

  return groups;
}

export const LEVEL_GROUPS: LevelGroup[] = buildGroups();

// ─── Lookup helpers ─────────────────────────────────────────────────

const LEVEL_MAP = new Map(EXERCISE_LEVELS.map((l) => [l.level, l]));

export function getExerciseLevel(level: number): ExerciseLevel | undefined {
  return LEVEL_MAP.get(level);
}

export function getNewNotes(level: number): string[] {
  const current = getExerciseLevel(level);
  if (!current) return [];
  return current.newNotes;
}

export const CLEF_RANGES = {
  treble: { low: "C4", high: "G5" },
  bass: { low: "G2", high: "D4" },
} as const;

export function getNoteVariants(
  noteName: string,
  clef: "treble" | "bass" = "treble",
): string[] {
  const range = CLEF_RANGES[clef];
  const lowMidi = Note.midi(range.low) as number;
  const highMidi = Note.midi(range.high) as number;
  const variants: string[] = [];

  for (let octave = 2; octave <= 6; octave++) {
    const full = `${noteName}${octave}`;
    const midi = Note.midi(full);
    if (midi !== null && midi >= lowMidi && midi <= highMidi) {
      variants.push(full);
    }
  }

  return variants;
}

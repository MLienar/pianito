import { Note } from "tonal";

export interface ExerciseLevel {
  level: number;
  name: string;
  clef: "treble" | "bass";
  notes: string[];
  newNotes: string[];
  count: number;
  tempo: number;
}

export interface LevelGroup {
  name: string;
  clef: "treble" | "bass";
  newNotes: string[];
  levels: number[];
}

// ─── Note constants ─────────────────────────────────────────────────

export const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;

const ALL_CHROMATIC = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

// ─── Curriculum definition ──────────────────────────────────────────
// Each block defines:
//   name, clef, notes (cumulative), newNotes (introduced this block),
//   and sub-levels with [count, tempo] pairs.

interface BlockDef {
  name: string;
  clef: "treble" | "bass";
  notes: string[];
  newNotes: string[];
  steps: [count: number, tempo: number][];
}

const BLOCKS: BlockDef[] = [
  // ── Stage 1: Treble — Natural Notes (1–11) ────────────────────────
  {
    name: "First Notes",
    clef: "treble",
    notes: ["C", "D", "E"],
    newNotes: ["C", "D", "E"],
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
    steps: [
      [14, 50],
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },

  // ── Stage 5: Accidentals — One at a Time (49–76) ─────────────────
  {
    name: "First Sharp — F#",
    clef: "treble",
    notes: ["C", "D", "E", "F", "F#", "G", "A", "B"],
    newNotes: ["F#"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "F# — Bass Clef",
    clef: "bass",
    notes: ["C", "D", "E", "F", "F#", "G", "A", "B"],
    newNotes: ["F#"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "First Flat — Bb",
    clef: "treble",
    notes: ["C", "D", "E", "F", "F#", "G", "A", "Bb", "B"],
    newNotes: ["Bb"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Bb — Bass Clef",
    clef: "bass",
    notes: ["C", "D", "E", "F", "F#", "G", "A", "Bb", "B"],
    newNotes: ["Bb"],
    steps: [
      [10, 45],
      [12, 48],
      [14, 50],
    ],
  },
  {
    name: "C# — Both Clefs",
    clef: "treble",
    notes: ["C", "C#", "D", "E", "F", "F#", "G", "A", "Bb", "B"],
    newNotes: ["C#"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Eb — Both Clefs",
    clef: "bass",
    notes: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "A", "Bb", "B"],
    newNotes: ["Eb"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },

  // ── Stage 6: Combined Accidentals (77–90) ─────────────────────────
  {
    name: "G# — Treble",
    clef: "treble",
    notes: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"],
    newNotes: ["G#"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Ab — Bass",
    clef: "bass",
    notes: [...ALL_CHROMATIC],
    newNotes: ["Ab"],
    steps: [
      [12, 48],
      [14, 50],
      [16, 52],
    ],
  },
  {
    name: "Sharps Mix",
    clef: "treble",
    notes: ["C", "C#", "D", "E", "F", "F#", "G", "G#", "A", "B"],
    newNotes: [],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },
  {
    name: "Flats Mix",
    clef: "bass",
    notes: ["C", "D", "Eb", "E", "F", "G", "Ab", "A", "Bb", "B"],
    newNotes: [],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },
  {
    name: "All Accidentals",
    clef: "treble",
    notes: [...ALL_CHROMATIC],
    newNotes: [],
    steps: [
      [16, 52],
      [18, 55],
      [20, 58],
    ],
  },

  // ── Stage 7: Mastery (91–100) ─────────────────────────────────────
  {
    name: "Full Range — Treble",
    clef: "treble",
    notes: [...ALL_CHROMATIC],
    newNotes: [],
    steps: [
      [20, 58],
      [22, 62],
      [25, 65],
    ],
  },
  {
    name: "Full Range — Bass",
    clef: "bass",
    notes: [...ALL_CHROMATIC],
    newNotes: [],
    steps: [
      [20, 58],
      [22, 62],
      [25, 65],
    ],
  },
  {
    name: "Mastery",
    clef: "treble",
    notes: [...ALL_CHROMATIC],
    newNotes: [],
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

import { Note, Scale } from "tonal";

export interface ExerciseLevel {
  level: number;
  name: string;
  scale: string;
  count: number;
  tempo: number;
  degrees: number;
}

export const SCALE_GROUPS = [
  {
    name: "First Notes",
    scale: "C major",
    degrees: [3, 4, 5, 7],
    tempos: [45, 48, 50, 52],
  },
  {
    name: "Full C Major",
    scale: "C major",
    degrees: [4, 5, 6, 7],
    tempos: [50, 53, 55, 58],
  },
  {
    name: "G Major — 1♯",
    scale: "G major",
    degrees: [3, 4, 5, 7],
    tempos: [50, 53, 55, 58],
  },
  {
    name: "F Major — 1♭",
    scale: "F major",
    degrees: [3, 4, 5, 7],
    tempos: [50, 53, 55, 58],
  },
  {
    name: "D Major — 2♯",
    scale: "D major",
    degrees: [3, 5, 6, 7],
    tempos: [52, 55, 58, 60],
  },
  {
    name: "B♭ Major — 2♭",
    scale: "Bb major",
    degrees: [3, 5, 6, 7],
    tempos: [52, 55, 58, 60],
  },
  {
    name: "A Major — 3♯",
    scale: "A major",
    degrees: [3, 5, 6, 7],
    tempos: [52, 55, 58, 62],
  },
  {
    name: "E♭ Major — 3♭",
    scale: "Eb major",
    degrees: [3, 5, 6, 7],
    tempos: [52, 55, 58, 62],
  },
  {
    name: "E Major — 4♯",
    scale: "E major",
    degrees: [4, 5, 6, 7],
    tempos: [55, 58, 62, 65],
  },
  {
    name: "A♭ Major — 4♭",
    scale: "Ab major",
    degrees: [4, 5, 6, 7],
    tempos: [55, 58, 62, 65],
  },
] as const;

export const STEP_LABELS = [
  "Introduction",
  "Practice",
  "Consolidation",
  "Mastery",
] as const;

function getNotesCountForStep(stepIndex: number, isLastLevel: boolean): number {
  if (isLastLevel) return 25;

  // stepIndex: 0=Introduction, 1=Practice, 2=Consolidation, 3=Mastery
  const counts = [10, 13, 16, 20];
  return counts[stepIndex] ?? 10;
}

export const EXERCISE_LEVELS: ExerciseLevel[] = SCALE_GROUPS.flatMap(
  (group, groupIndex) =>
    STEP_LABELS.map((step, stepIndex) => {
      const level = groupIndex * 4 + stepIndex + 1;
      const isLastLevel = level === SCALE_GROUPS.length * 4;

      return {
        level,
        name: `${group.name} — ${step}`,
        scale: group.scale,
        count: getNotesCountForStep(stepIndex, isLastLevel),
        tempo: group.tempos[stepIndex],
        degrees: group.degrees[stepIndex],
      };
    }),
);

const LEVEL_MAP = new Map(EXERCISE_LEVELS.map((l) => [l.level, l]));

export function getExerciseLevel(level: number): ExerciseLevel | undefined {
  return LEVEL_MAP.get(level);
}

function getScaleNotes(scale: string, degrees: number): string[] {
  const notes = Scale.get(scale).notes;
  return notes.slice(0, degrees);
}

export function getNewNotes(level: number): string[] {
  const current = getExerciseLevel(level);
  if (!current) return [];

  const currentNotes = getScaleNotes(current.scale, current.degrees);

  if (level === 1) return currentNotes;

  const previous = getExerciseLevel(level - 1);
  if (!previous) return currentNotes;

  const previousNotes = new Set(
    getScaleNotes(previous.scale, previous.degrees),
  );

  const newNotes = currentNotes.filter((n) => !previousNotes.has(n));
  return newNotes.length > 0 ? newNotes : currentNotes;
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

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

const NOTE_COUNT = 10;

export const EXERCISE_LEVELS: ExerciseLevel[] = SCALE_GROUPS.flatMap(
  (group, groupIndex) =>
    STEP_LABELS.map((step, stepIndex) => ({
      level: groupIndex * 4 + stepIndex + 1,
      name: `${group.name} — ${step}`,
      scale: group.scale,
      count: NOTE_COUNT,
      tempo: group.tempos[stepIndex],
      degrees: group.degrees[stepIndex],
    })),
);

const LEVEL_MAP = new Map(EXERCISE_LEVELS.map((l) => [l.level, l]));

export function getExerciseLevel(level: number): ExerciseLevel | undefined {
  return LEVEL_MAP.get(level);
}

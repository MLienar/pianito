export interface DrumPattern {
  subdivision: "16n" | "8t";
  kick: number[];
  snare: number[];
  hihat: number[];
  ride?: number[];
  shaker?: number[];
}

export const DRUM_PATTERNS = {
  rock: {
    subdivision: "16n",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  pop: {
    subdivision: "16n",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  bossaNova: {
    subdivision: "16n",
    //        1 . . .  2 . . .  3 . . .  4 . . .
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    ride: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    shaker: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  jazz: {
    subdivision: "8t",
    //       1  &  a   2  &  a   3  &  a   4  &  a
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    ride: [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
  },
  funk: {
    subdivision: "16n",
    //       1 . . .  2 . . .  3 . . .  4 . . .
    kick: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  reggae: {
    subdivision: "16n",
    //       1 . . .  2 . . .  3 . . .  4 . . .
    kick: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  },
} as const satisfies Record<string, DrumPattern>;

export type DrumPatternId = keyof typeof DRUM_PATTERNS;

export const DRUM_PATTERN_IDS = Object.keys(DRUM_PATTERNS) as DrumPatternId[];

export function isDrumPatternId(value: string): value is DrumPatternId {
  return (DRUM_PATTERN_IDS as readonly string[]).includes(value);
}

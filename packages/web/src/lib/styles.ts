import type { DrumPattern, TimeSignatureKey } from "./drum-patterns";

export interface BassPattern {
  /** Same subdivision grid as the drum pattern */
  subdivision: "16n" | "8t";
  /**
   * Semitone offsets from the chord root, or null for rests.
   * 0 = root, 7 = fifth, 12 = octave, -5 = fifth below, etc.
   */
  notes: (number | null)[];
}

export interface Style {
  drums: Partial<Record<TimeSignatureKey, DrumPattern>>;
  bass: Partial<Record<TimeSignatureKey, BassPattern>>;
}

export const STYLES = {
  rock: {
    drums: {
      "4/4": {
        subdivision: "16n",
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      "3/4": {
        subdivision: "16n",
        //       1 . . .  2 . . .  3 . . .
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      "2/4": {
        subdivision: "16n",
        //       1 . . .  2 . . .
        kick: [1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0],
      },
      "6/8": {
        subdivision: "8t",
        //       1  .  .  2  .  .  3  .  .  4  .  .
        kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        hihat: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
      },
      "5/4": {
        subdivision: "16n",
        //       1 . . .  2 . . .  3 . . .  4 . . .  5 . . .
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      "2/2": {
        subdivision: "16n",
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "16n",
        //          1 . . .  2 . . .  3 . . .  4 . . .
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          7,
          null,
          null,
          null,
          null,
          null,
          null,
          5,
        ],
      },
      "3/4": {
        subdivision: "16n",
        //          1 . . .  2 . . .  3 . . .
        notes: [0, null, null, null, null, null, null, 0, 7, null, null, null],
      },
      "2/4": {
        subdivision: "16n",
        notes: [0, null, null, null, null, null, null, 7],
      },
      "6/8": {
        subdivision: "8t",
        notes: [0, null, null, 7, null, null, 0, null, null, 5, null, null],
      },
      "5/4": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          7,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          5,
          null,
          null,
          null,
        ],
      },
      "2/2": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          7,
          null,
          null,
          null,
          null,
          null,
          null,
          5,
        ],
      },
    },
  },
  pop: {
    drums: {
      "4/4": {
        subdivision: "16n",
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      "3/4": {
        subdivision: "16n",
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          7,
          null,
          null,
          null,
          null,
          null,
          null,
          5,
        ],
      },
      "3/4": {
        subdivision: "16n",
        notes: [0, null, null, null, null, null, null, 0, 7, null, null, null],
      },
    },
  },
  bossaNova: {
    drums: {
      "4/4": {
        subdivision: "16n",
        //        1 . . .  2 . . .  3 . . .  4 . . .
        kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        hihat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        ride: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        shaker: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          7,
          null,
          null,
          null,
          0,
          null,
          null,
          7,
          null,
          null,
        ],
      },
    },
  },
  jazz: {
    drums: {
      "4/4": {
        subdivision: "8t",
        //       1  &  a   2  &  a   3  &  a   4  &  a
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        hihat: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
        ride: [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
      },
      "3/4": {
        subdivision: "8t",
        //       1  &  a   2  &  a   3  &  a
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        hihat: [0, 0, 0, 1, 0, 0, 0, 0, 0],
        ride: [1, 0, 0, 1, 0, 1, 1, 0, 0],
      },
      "5/4": {
        subdivision: "8t",
        //       1  &  a   2  &  a   3  &  a   4  &  a   5  &  a
        kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        hihat: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        ride: [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "8t",
        notes: [1, null, null, 3, null, null, 7, null, null, 5, null, null],
      },
      "3/4": {
        subdivision: "8t",
        notes: [1, null, null, 3, null, null, 7, null, null],
      },
      "5/4": {
        subdivision: "8t",
        notes: [
          1,
          null,
          null,
          3,
          null,
          null,
          7,
          null,
          null,
          5,
          null,
          null,
          0,
          null,
          null,
        ],
      },
    },
  },
  funk: {
    drums: {
      "4/4": {
        subdivision: "16n",
        //       1 . . .  2 . . .  3 . . .  4 . . .
        kick: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
        hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          0,
          null,
          null,
          7,
          null,
          null,
          null,
          0,
          null,
          null,
          0,
          5,
          null,
        ],
      },
    },
  },
  reggae: {
    drums: {
      "4/4": {
        subdivision: "16n",
        //       1 . . .  2 . . .  3 . . .  4 . . .
        kick: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      },
    },
    bass: {
      "4/4": {
        subdivision: "16n",
        notes: [
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          null,
          null,
          7,
          null,
          null,
          5,
          null,
        ],
      },
    },
  },
} as const satisfies Record<string, Style>;

export type StyleId = keyof typeof STYLES;

export const STYLE_IDS = Object.keys(STYLES) as StyleId[];

export function isStyleId(value: string): value is StyleId {
  return (STYLE_IDS as readonly string[]).includes(value);
}

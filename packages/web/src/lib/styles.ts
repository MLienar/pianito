import type { DrumPattern } from "./drum-patterns";

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
  drums: DrumPattern;
  bass: BassPattern;
}

export const STYLES = {
  rock: {
    drums: {
      subdivision: "16n",
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    bass: {
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
  },
  pop: {
    drums: {
      subdivision: "16n",
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    bass: {
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
  },
  bossaNova: {
    drums: {
      subdivision: "16n",
      //          1 . . .  2 . . .  3 . . .  4 . . .
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      ride: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      shaker: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    bass: {
      subdivision: "16n",
      //          1 . . .  2 . . .  3 . . .  4 . . .
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
  jazz: {
    drums: {
      subdivision: "8t",
      //       1  &  a   2  &  a   3  &  a   4  &  a
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
      ride: [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1],
    },
    bass: {
      subdivision: "8t",
      //          1  &  a   2  &  a   3  &  a   4  &  a
      notes: [1, null, null, 3, null, null, 7, null, null, 5, null, null],
    },
  },
  funk: {
    drums: {
      subdivision: "16n",
      //       1 . . .  2 . . .  3 . . .  4 . . .
      kick: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
      hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    },
    bass: {
      subdivision: "16n",
      //          1 . . .  2 . . .  3 . . .  4 . . .
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
  reggae: {
    drums: {
      subdivision: "16n",
      //       1 . . .  2 . . .  3 . . .  4 . . .
      kick: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    },
    bass: {
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
} as const satisfies Record<string, Style>;

export type StyleId = keyof typeof STYLES;

export const STYLE_IDS = Object.keys(STYLES) as StyleId[];

export function isStyleId(value: string): value is StyleId {
  return (STYLE_IDS as readonly string[]).includes(value);
}

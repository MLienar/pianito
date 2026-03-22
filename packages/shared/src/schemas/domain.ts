import { Chord, Note } from "tonal";
import { z } from "zod";

/**
 * A note in scientific pitch notation, validated by tonal.
 * Examples: "C4", "F#5", "Bb3"
 */
export const noteSchema = z.string().refine(
  (val) => {
    const n = Note.get(val);
    return n.empty === false;
  },
  {
    message:
      "Invalid note (use scientific pitch notation, e.g. 'C4', 'F#5', 'Bb3')",
  },
);

/**
 * A chord symbol validated by tonal.
 * Examples: "Cmaj7", "Am", "F#dim", "Bb7"
 */
export const chordSchema = z.string().refine(
  (val) => {
    const c = Chord.get(val);
    return c.empty === false;
  },
  { message: "Invalid chord symbol (e.g. 'Cmaj7', 'Am', 'Bb7')" },
);

export const clefSchema = z.enum(["treble", "bass"]);

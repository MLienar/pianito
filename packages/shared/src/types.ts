import type { z } from "zod";
import type {
  chordSchema,
  clefSchema,
  exerciseResultSchema,
  notationExerciseSchema,
  noteSchema,
} from "./schemas";

export type NoteName = z.infer<typeof noteSchema>;
export type ChordName = z.infer<typeof chordSchema>;
export type Clef = z.infer<typeof clefSchema>;
export type NotationExercise = z.infer<typeof notationExerciseSchema>;
export type ExerciseResult = z.infer<typeof exerciseResultSchema>;

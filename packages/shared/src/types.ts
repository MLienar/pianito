import type { z } from "zod";
import type {
  chordSchema,
  clefSchema,
  completeBodySchema,
  completeResponseSchema,
  completionSchema,
  completionsResponseSchema,
  errorResponseSchema,
  notationExerciseSchema,
  notationQuerySchema,
  noteSchema,
} from "./schemas/index.ts";

// Domain types
export type NoteName = z.infer<typeof noteSchema>;
export type ChordName = z.infer<typeof chordSchema>;
export type Clef = z.infer<typeof clefSchema>;

// Route types
export type NotationQuery = z.infer<typeof notationQuerySchema>;
export type NotationExercise = z.infer<typeof notationExerciseSchema>;
export type Completion = z.infer<typeof completionSchema>;
export type CompletionsResponse = z.infer<typeof completionsResponseSchema>;
export type CompleteBody = z.infer<typeof completeBodySchema>;
export type CompleteResponse = z.infer<typeof completeResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

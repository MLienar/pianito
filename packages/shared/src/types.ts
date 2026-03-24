import type { z } from "zod";
import type {
  chordSchema,
  clefSchema,
  completeBodySchema,
  completeResponseSchema,
  completionSchema,
  completionsResponseSchema,
  createGridBodySchema,
  errorResponseSchema,
  gridDataSchema,
  gridGroupSchema,
  gridListResponseSchema,
  gridSchema,
  gridSquareSchema,
  gridSummarySchema,
  notationExerciseSchema,
  notationQuerySchema,
  noteSchema,
  updateGridBodySchema,
  updatePreferenceBodySchema,
  userPreferenceSchema,
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
export type UserPreference = z.infer<typeof userPreferenceSchema>;
export type UpdatePreferenceBody = z.infer<typeof updatePreferenceBodySchema>;

// Grid types
export type GridSquare = z.infer<typeof gridSquareSchema>;
export type GridGroup = z.infer<typeof gridGroupSchema>;
export type GridData = z.infer<typeof gridDataSchema>;
export type Grid = z.infer<typeof gridSchema>;
export type GridSummary = z.infer<typeof gridSummarySchema>;
export type CreateGridBody = z.infer<typeof createGridBodySchema>;
export type UpdateGridBody = z.infer<typeof updateGridBodySchema>;
export type GridListResponse = z.infer<typeof gridListResponseSchema>;

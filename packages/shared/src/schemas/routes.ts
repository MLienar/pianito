import { z } from "zod";
import { chordSchema, clefSchema, noteSchema, styleSchema } from "./domain.ts";

// ─── GET /api/exercises/notation ─────────────────────────────────────

export const notationQuerySchema = z.object({
  level: z.coerce.number().int().optional(),
  clef: clefSchema.optional(),
});

export const notationExerciseSchema = z.object({
  id: z.string(),
  clef: clefSchema,
  tempo: z.number().int().min(30).max(240),
  notes: z.array(noteSchema).min(1),
  allowedNotes: z.array(z.string()).min(1),
});

// ─── GET /api/completions ────────────────────────────────────────────

export const completionSchema = z.object({
  level: z.number().int(),
  clef: clefSchema,
});

export const completionsResponseSchema = z.object({
  levels: z.array(completionSchema),
});

// ─── POST /api/completions ───────────────────────────────────────────

export const completeBodySchema = z.object({
  level: z.number().int(),
  clef: clefSchema.optional(),
});

export const completeResponseSchema = z.object({
  ok: z.literal(true),
});

// ─── GET /api/preferences ────────────────────────────────────────────

export const notationSchema = z.enum(["letter", "solfege"]);
export const themeSchema = z.enum([
  "default",
  "ocean",
  "forest",
  "sunset",
  "midnight",
]);
export const languageSchema = z.enum(["en", "fr", "es", "zh"]);

export const userPreferenceSchema = z.object({
  notation: notationSchema,
  theme: themeSchema,
  language: languageSchema,
});

// ─── PATCH /api/preferences ─────────────────────────────────────────

export const updatePreferenceBodySchema = z
  .object({
    notation: notationSchema.optional(),
    theme: themeSchema.optional(),
    language: languageSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one preference field is required",
  });

// ─── Shared error response ───────────────────────────────────────────

export const errorResponseSchema = z.object({
  error: z.string(),
});

// ─── Grid (Accompaniment) ───────────────────────────────────────────

export const gridSquareSchema = z.object({
  chord: chordSchema.nullable(),
  nbBeats: z.number().int().min(2).max(4).default(4),
});

export const gridGroupSchema = z.object({
  squareCount: z.number().int().min(1).max(200),
  repeatCount: z.number().int().min(1).max(50).default(1),
});

export const gridDataSchema = z.object({
  squares: z.array(gridSquareSchema).min(1).max(200),
  groups: z.array(gridGroupSchema).min(1).max(50),
});

export const gridSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  tempo: z.number().int().min(30).max(300),
  loopCount: z.number().int().min(1).max(50),
  data: gridDataSchema,
  // Playback settings
  metronome: z.boolean().default(false),
  style: styleSchema.nullable().default(null),
  swing: z.number().min(0).max(1).default(0),
  chordsEnabled: z.boolean().default(true),
  bassEnabled: z.boolean().default(true),
  drumsEnabled: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const gridSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tempo: z.number().int(),
  createdAt: z.string(),
});

export const createGridBodySchema = z.object({
  name: z.string().min(1).max(100),
  tempo: z.number().int().min(30).max(300).default(90),
  loopCount: z.number().int().min(1).max(50).default(1),
  data: gridDataSchema.default({
    squares: [{ chord: null }],
    groups: [{ squareCount: 1, repeatCount: 1 }],
  }),
  // Playback settings - all optional for creating
  metronome: z.boolean().default(false),
  style: styleSchema.nullable().default(null),
  swing: z.number().min(0).max(1).default(0),
  chordsEnabled: z.boolean().default(true),
  bassEnabled: z.boolean().default(true),
  drumsEnabled: z.boolean().default(true),
});

export const updateGridBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    tempo: z.number().int().min(30).max(300).optional(),
    loopCount: z.number().int().min(1).max(50).optional(),
    data: gridDataSchema.optional(),
    // Playback settings - all optional for updating
    metronome: z.boolean().optional(),
    style: styleSchema.nullable().optional(),
    swing: z.number().min(0).max(1).optional(),
    chordsEnabled: z.boolean().optional(),
    bassEnabled: z.boolean().optional(),
    drumsEnabled: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

export const gridListResponseSchema = z.object({
  grids: z.array(gridSummarySchema),
});

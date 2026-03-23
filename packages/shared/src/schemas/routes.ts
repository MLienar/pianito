import { z } from "zod";
import { clefSchema, noteSchema } from "./domain.ts";

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

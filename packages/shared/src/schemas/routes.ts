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
  keySignature: z.array(z.string()).default([]),
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

export const updatePreferenceBodySchema = userPreferenceSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one preference field is required",
  });

// ─── User Profile ────────────────────────────────────────────────────

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens",
  );

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const updateUserProfileBodySchema = z
  .object({
    username: usernameSchema.nullable(),
  })
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

// ─── Shared error response ───────────────────────────────────────────

export const errorResponseSchema = z.object({
  error: z.string(),
});

// ─── Grid (Accompaniment) ───────────────────────────────────────────

export const gridVisibilitySchema = z.enum(["private", "public"]);

export const timeSignatureSchema = z.object({
  numerator: z.number().int().min(2).max(6),
  denominator: z
    .number()
    .int()
    .refine((v) => [2, 4, 8].includes(v), {
      message: "Denominator must be 2, 4, or 8",
    }),
});

export const SUPPORTED_TIME_SIGNATURES = [
  { numerator: 4, denominator: 4 },
  { numerator: 3, denominator: 4 },
  { numerator: 2, denominator: 4 },
  { numerator: 6, denominator: 8 },
  { numerator: 5, denominator: 4 },
  { numerator: 2, denominator: 2 },
] as const;

export const DEFAULT_TIME_SIGNATURE = { numerator: 4, denominator: 4 };

export const gridSquareSchema = z.object({
  chord: chordSchema.nullable(),
  nbBeats: z.number().int().min(1).max(6).default(4),
});

export const gridGroupSchema = z.object({
  start: z.number().int().min(0),
  nbSquares: z.number().int().min(1).max(200),
  repeatCount: z.number().int().min(1).max(50).default(1),
  timeSignature: timeSignatureSchema.optional(),
});

export const gridDataSchema = z
  .object({
    squares: z.array(gridSquareSchema).min(1).max(200),
    groups: z.array(gridGroupSchema).max(50).default([]),
  })
  .refine(
    (data) => {
      for (let i = 0; i < data.groups.length; i++) {
        const g = data.groups[i];
        if (!g) continue;
        if (g.start + g.nbSquares > data.squares.length) return false;
        if (i > 0) {
          const prev = data.groups[i - 1];
          if (prev && g.start < prev.start + prev.nbSquares) return false;
        }
      }
      return true;
    },
    {
      message:
        "Groups must be sorted by start, non-overlapping, and within bounds",
    },
  );

/** Base shape for grid-editable fields (no id, userId, timestamps). */
const gridFieldsSchema = z.object({
  name: z.string().min(1).max(100),
  composer: z.string().max(200).nullable(),
  key: z.string().max(20).nullable(),
  tempo: z.number().int().min(30).max(300),
  loopCount: z.number().int().min(1).max(50),
  visibility: gridVisibilitySchema,
  timeSignature: timeSignatureSchema,
  data: gridDataSchema,
  // Playback settings
  metronome: z.boolean().default(false),
  style: styleSchema.nullable().default(null),
  swing: z.number().min(0).max(1).default(0),
  chordsEnabled: z.boolean().default(true),
  bassEnabled: z.boolean().default(true),
  drumsEnabled: z.boolean().default(true),
});

export const gridSchema = gridFieldsSchema.extend({
  id: z.string().uuid(),
  userId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const gridSummarySchema = gridFieldsSchema
  .pick({
    name: true,
    composer: true,
    key: true,
    tempo: true,
    visibility: true,
    timeSignature: true,
  })
  .extend({
    id: z.string().uuid(),
    userId: z.string().nullable(),
    createdAt: z.string(),
  });

export const createGridBodySchema = gridFieldsSchema.extend({
  composer: z.string().max(200).nullable().default(null),
  key: z.string().max(20).nullable().default(null),
  tempo: z.number().int().min(30).max(300).default(90),
  loopCount: z.number().int().min(1).max(50).default(1),
  visibility: gridVisibilitySchema.default("private"),
  timeSignature: timeSignatureSchema.default(DEFAULT_TIME_SIGNATURE),
  data: gridDataSchema.default({
    squares: [{ chord: null }],
    groups: [],
  }),
  // Playback settings
  metronome: z.boolean().default(false),
  style: styleSchema.nullable().default(null),
  swing: z.number().min(0).max(1).default(0),
  chordsEnabled: z.boolean().default(true),
  bassEnabled: z.boolean().default(true),
  drumsEnabled: z.boolean().default(true),
});

export const updateGridBodySchema = gridFieldsSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

export const gridListResponseSchema = z.object({
  grids: z.array(gridSummarySchema),
});

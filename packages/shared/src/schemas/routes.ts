import { z } from "zod";
import { chordSchema, clefSchema, noteSchema } from "./domain.ts";

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
    username: usernameSchema.nullable().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

// ─── Shared error response ───────────────────────────────────────────

export const errorResponseSchema = z.object({
  error: z.string(),
});

// ─── Grid (Accompaniment) ───────────────────────────────────────────

export const gridVisibilitySchema = z.enum(["private", "public"]);

export const gridSquareSchema = z.object({
  chord: chordSchema.nullable(),
  nbBeats: z.number().int().min(2).max(4).default(4),
});

export const gridGroupSchema = z.object({
  start: z.number().int().min(0),
  nbSquares: z.number().int().min(1).max(200),
  repeatCount: z.number().int().min(1).max(50).default(1),
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

export const gridSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  tempo: z.number().int().min(30).max(300),
  loopCount: z.number().int().min(1).max(50),
  visibility: gridVisibilitySchema,
  data: gridDataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const gridSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  tempo: z.number().int(),
  visibility: gridVisibilitySchema,
  createdAt: z.string(),
});

export const createGridBodySchema = z.object({
  name: z.string().min(1).max(100),
  tempo: z.number().int().min(30).max(300).default(90),
  loopCount: z.number().int().min(1).max(50).default(1),
  visibility: gridVisibilitySchema.default("private"),
  data: gridDataSchema.default({
    squares: [{ chord: null }],
    groups: [],
  }),
});

export const updateGridBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    tempo: z.number().int().min(30).max(300).optional(),
    loopCount: z.number().int().min(1).max(50).optional(),
    visibility: gridVisibilitySchema.optional(),
    data: gridDataSchema.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

export const gridListResponseSchema = z.object({
  grids: z.array(gridSummarySchema),
});

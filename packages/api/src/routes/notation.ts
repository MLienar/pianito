import { randomUUID } from "node:crypto";
import {
  defaultClefSchema,
  getExerciseLevel,
  getNewNotes,
  getNoteVariants,
  NATURAL_NOTES,
  type NotationExercise,
  type NotationQuery,
  notationQuerySchema,
} from "@pianito/shared";
import type { FastifyInstance } from "fastify";
import { Note } from "tonal";

interface CandidatePool {
  candidates: string[];
  allowedNotes: string[];
}

const candidateCache = new Map<string, CandidatePool>();

function getCandidatePool(
  clef: "treble" | "bass",
  noteNames: string[],
): CandidatePool {
  const key = `${clef}:${[...noteNames].sort().join(",")}`;
  const cached = candidateCache.get(key);
  if (cached) return cached;

  const candidates = noteNames.flatMap((n) => getNoteVariants(n, clef));
  const allowedNotes = [...new Set(candidates.map((c) => Note.get(c).letter))];
  const pool = { candidates, allowedNotes };
  candidateCache.set(key, pool);
  return pool;
}

function generateNotesWithNewNoteBias(
  candidates: string[],
  count: number,
  newNotes: string[],
  clef: "treble" | "bass",
): string[] {
  if (newNotes.length === 0) {
    return Array.from(
      { length: count },
      () => candidates[Math.floor(Math.random() * candidates.length)] as string,
    );
  }

  const candidateSet = new Set(candidates);
  const newNoteCandidates = newNotes
    .flatMap((n) => getNoteVariants(n, clef))
    .filter((full) => candidateSet.has(full));

  const notes: string[] = [];

  const newNoteTargetCount = Math.min(
    Math.ceil(count * 0.5),
    newNoteCandidates.length > 0 ? count : 0,
  );

  for (let i = 0; i < newNoteTargetCount && newNoteCandidates.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * newNoteCandidates.length);
    notes.push(newNoteCandidates[randomIndex] as string);
  }

  const remainingCount = count - notes.length;
  for (let i = 0; i < remainingCount; i++) {
    notes.push(
      candidates[Math.floor(Math.random() * candidates.length)] as string,
    );
  }

  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notes[i], notes[j]] = [notes[j] as string, notes[i] as string];
  }

  return notes;
}

const DEFAULT_PARAMS = {
  count: 10,
  tempo: 60,
  clef: "treble" as const,
  notes: [...NATURAL_NOTES],
  newNotes: [] as string[],
};

export async function notationRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: NotationQuery;
    Reply: NotationExercise;
  }>("/api/exercises/notation", async (request) => {
    const query = notationQuerySchema.parse(request.query);
    const levelNum = query.level ?? 0;
    const exerciseLevel = getExerciseLevel(levelNum);

    const params = exerciseLevel ?? DEFAULT_PARAMS;
    const clef = exerciseLevel?.clef ?? defaultClefSchema.parse(query.clef);

    const { candidates, allowedNotes } = getCandidatePool(clef, params.notes);

    const newNotes = getNewNotes(levelNum);
    const notes = generateNotesWithNewNoteBias(
      candidates,
      params.count,
      newNotes,
      clef,
    );

    return {
      id: randomUUID(),
      clef,
      tempo: params.tempo,
      notes,
      allowedNotes,
    };
  });
}

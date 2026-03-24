import { randomUUID } from "node:crypto";
import {
  CLEF_RANGES,
  defaultClefSchema,
  getExerciseLevel,
  getNewNotes,
  type NotationExercise,
  type NotationQuery,
  notationQuerySchema,
} from "@pianito/shared";
import type { FastifyInstance } from "fastify";
import { Note, Scale } from "tonal";
import { NATURAL_NOTES } from "../config.js";

interface CandidatePool {
  candidates: string[];
  allowedNotes: string[];
}

const candidateCache = new Map<string, CandidatePool>();

function getCandidatePool(
  clef: "treble" | "bass",
  scale: string,
  degrees?: number,
): CandidatePool {
  const key = `${clef}:${scale}:${degrees ?? "all"}`;
  const cached = candidateCache.get(key);
  if (cached) return cached;

  const range = CLEF_RANGES[clef];
  const lowMidi = Note.midi(range.low) as number;
  const highMidi = Note.midi(range.high) as number;

  let scaleNotes = Scale.get(scale).notes;
  if (degrees != null && degrees < scaleNotes.length) {
    scaleNotes = scaleNotes.slice(0, degrees);
  }

  const candidates: string[] = [];

  for (let octave = 2; octave <= 6; octave++) {
    for (const n of scaleNotes) {
      const full = `${n}${octave}`;
      const midi = Note.midi(full);
      if (midi !== null && midi >= lowMidi && midi <= highMidi) {
        candidates.push(full);
      }
    }
  }

  if (candidates.length === 0) {
    for (let octave = 2; octave <= 6; octave++) {
      for (const n of NATURAL_NOTES) {
        const full = `${n}${octave}`;
        const midi = Note.midi(full);
        if (midi !== null && midi >= lowMidi && midi <= highMidi) {
          candidates.push(full);
        }
      }
    }
  }

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
    // No new notes, use pure random selection
    return Array.from(
      { length: count },
      () => candidates[Math.floor(Math.random() * candidates.length)] as string,
    );
  }

  // Get variants for new notes within the clef range
  const range = CLEF_RANGES[clef];
  const lowMidi = Note.midi(range.low) as number;
  const highMidi = Note.midi(range.high) as number;

  const newNoteCandidates: string[] = [];
  for (const noteName of newNotes) {
    for (let octave = 2; octave <= 6; octave++) {
      const full = `${noteName}${octave}`;
      const midi = Note.midi(full);
      if (midi !== null && midi >= lowMidi && midi <= highMidi) {
        if (candidates.includes(full)) {
          newNoteCandidates.push(full);
        }
      }
    }
  }

  const notes: string[] = [];

  // Ensure at least 50% of notes are from new notes if available
  const newNoteTargetCount = Math.min(
    Math.ceil(count * 0.5),
    newNoteCandidates.length > 0 ? count : 0,
  );

  // Add new notes first
  for (let i = 0; i < newNoteTargetCount && newNoteCandidates.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * newNoteCandidates.length);
    notes.push(newNoteCandidates[randomIndex] as string);
  }

  // Fill remaining with random selection from all candidates
  const remainingCount = count - notes.length;
  for (let i = 0; i < remainingCount; i++) {
    notes.push(
      candidates[Math.floor(Math.random() * candidates.length)] as string,
    );
  }

  // Shuffle the notes so new notes aren't always at the beginning
  for (let i = notes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [notes[i], notes[j]] = [notes[j] as string, notes[i] as string];
  }

  return notes;
}

export async function notationRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: NotationQuery;
    Reply: NotationExercise;
  }>("/api/exercises/notation", async (request) => {
    const query = notationQuerySchema.parse(request.query);
    const clef = defaultClefSchema.parse(query.clef);
    const levelNum = query.level ?? 0;
    const exerciseLevel = getExerciseLevel(levelNum);

    const params = exerciseLevel ?? {
      count: 10,
      tempo: 60,
      scale: "C major",
      degrees: undefined as number | undefined,
    };

    const { candidates, allowedNotes } = getCandidatePool(
      clef,
      params.scale,
      params.degrees,
    );

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

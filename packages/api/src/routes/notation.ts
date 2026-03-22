import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { Note, Scale } from "tonal";
import { getExerciseLevel } from "@pianito/shared";
import { NATURAL_NOTES } from "../config.js";

const CLEF_RANGES = {
  treble: { low: "C4", high: "G5" },
  bass: { low: "G2", high: "D4" },
} as const;

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

export async function notationRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      clef?: string;
      count?: string;
      tempo?: string;
      scale?: string;
      level?: string;
    };
  }>("/api/exercises/notation", async (request) => {
    const clef = request.query.clef === "bass" ? "bass" : "treble";

    const levelNum = parseInt(request.query.level ?? "0", 10);
    const exerciseLevel = getExerciseLevel(levelNum);

    const params = exerciseLevel ?? {
      count: Math.min(
        Math.max(parseInt(request.query.count ?? "10", 10) || 10, 4),
        30,
      ),
      tempo: Math.min(
        Math.max(parseInt(request.query.tempo ?? "60", 10) || 60, 30),
        240,
      ),
      scale: request.query.scale ?? "C major",
      degrees: undefined as number | undefined,
    };

    const { candidates, allowedNotes } = getCandidatePool(
      clef,
      params.scale,
      params.degrees,
    );

    const notes = Array.from(
      { length: params.count },
      () => candidates[Math.floor(Math.random() * candidates.length)] as string,
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

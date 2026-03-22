import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { Note, Scale } from "tonal";
import { NATURAL_NOTES } from "../config.js";

// Range of MIDI values per clef
const CLEF_RANGES = {
  treble: { low: "C4", high: "G5" },
  bass: { low: "G2", high: "D4" },
} as const;

// Cache candidate lists by clef+scale to avoid recomputing per request
const candidateCache = new Map<string, string[]>();

function getCandidates(clef: "treble" | "bass", scale: string): string[] {
  const key = `${clef}:${scale}`;
  const cached = candidateCache.get(key);
  if (cached) return cached;

  const range = CLEF_RANGES[clef];
  const lowMidi = Note.midi(range.low) as number;
  const highMidi = Note.midi(range.high) as number;

  const scaleNotes = Scale.get(scale).notes;
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

  candidateCache.set(key, candidates);
  return candidates;
}

export async function notationRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      clef?: string;
      count?: string;
      tempo?: string;
      scale?: string;
    };
  }>("/api/exercises/notation", async (request) => {
    const clef = request.query.clef === "bass" ? "bass" : "treble";
    const count = Math.min(
      Math.max(parseInt(request.query.count ?? "10", 10) || 10, 4),
      30,
    );
    const tempo = Math.min(
      Math.max(parseInt(request.query.tempo ?? "60", 10) || 60, 30),
      240,
    );
    const scale = request.query.scale ?? "C major";

    const candidates = getCandidates(clef, scale);
    const notes = Array.from(
      { length: count },
      () => candidates[Math.floor(Math.random() * candidates.length)] as string,
    );

    return {
      id: randomUUID(),
      clef,
      tempo,
      notes,
    };
  });
}

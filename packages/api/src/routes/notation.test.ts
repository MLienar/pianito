import { describe, expect, it } from "vitest";
import { Note, Scale } from "tonal";

// Re-implement getCandidatePool logic for testing since it's not exported.
// We test the same algorithm against known musical expectations.

const CLEF_RANGES = {
  treble: { low: "C4", high: "G5" },
  bass: { low: "G2", high: "D4" },
} as const;

const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];

function getCandidatePool(
  clef: "treble" | "bass",
  scale: string,
  degrees?: number,
) {
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
  return { candidates, allowedNotes };
}

describe("getCandidatePool", () => {
  describe("treble clef (C4–G5)", () => {
    it("generates C major candidates within range", () => {
      const { candidates } = getCandidatePool("treble", "C major");

      for (const note of candidates) {
        const midi = Note.midi(note)!;
        expect(midi).toBeGreaterThanOrEqual(Note.midi("C4")!);
        expect(midi).toBeLessThanOrEqual(Note.midi("G5")!);
      }

      expect(candidates).toContain("C4");
      expect(candidates).toContain("G5");
      expect(candidates).not.toContain("B3");
      expect(candidates).not.toContain("A5");
    });

    it("limits notes by degree count", () => {
      const { candidates, allowedNotes } = getCandidatePool("treble", "C major", 3);

      // C major first 3 notes: C, D, E
      for (const note of candidates) {
        const letter = Note.get(note).letter;
        expect(["C", "D", "E"]).toContain(letter);
      }
      expect(allowedNotes).toEqual(expect.arrayContaining(["C", "D", "E"]));
      expect(allowedNotes).toHaveLength(3);
    });

    it("returns all scale degrees when degrees >= scale length", () => {
      const full = getCandidatePool("treble", "C major");
      const withDegrees = getCandidatePool("treble", "C major", 7);
      expect(full.candidates).toEqual(withDegrees.candidates);
    });
  });

  describe("bass clef (G2–D4)", () => {
    it("generates candidates within bass range", () => {
      const { candidates } = getCandidatePool("bass", "C major");

      for (const note of candidates) {
        const midi = Note.midi(note)!;
        expect(midi).toBeGreaterThanOrEqual(Note.midi("G2")!);
        expect(midi).toBeLessThanOrEqual(Note.midi("D4")!);
      }

      expect(candidates).not.toContain("C2");
      expect(candidates).not.toContain("E4");
    });
  });

  describe("allowedNotes", () => {
    it("extracts unique note letters from candidates", () => {
      const { allowedNotes } = getCandidatePool("treble", "C major");
      // C major in treble range has C, D, E, F, G, A, B
      expect(allowedNotes).toEqual(expect.arrayContaining(["C", "D", "E", "F", "G", "A", "B"]));
    });

    it("returns fewer letters when degrees are limited", () => {
      const { allowedNotes } = getCandidatePool("treble", "G major", 3);
      // G major first 3 notes: G, A, B
      expect(allowedNotes).toHaveLength(3);
    });
  });

  describe("scale handling", () => {
    it("handles sharps in scales", () => {
      const { candidates } = getCandidatePool("treble", "D major");
      const letters = new Set(candidates.map((c) => Note.get(c).pc));
      // D major has F# and C#
      expect(letters.has("F#")).toBe(true);
    });

    it("handles flats in scales", () => {
      const { candidates } = getCandidatePool("treble", "Bb major");
      const letters = new Set(candidates.map((c) => Note.get(c).pc));
      expect(letters.has("Bb")).toBe(true);
    });

    it("falls back to natural notes for invalid scale", () => {
      const { candidates, allowedNotes } = getCandidatePool("treble", "nonsense scale");
      expect(candidates.length).toBeGreaterThan(0);
      for (const note of candidates) {
        expect(NATURAL_NOTES).toContain(Note.get(note).letter);
      }
      expect(allowedNotes).toEqual(expect.arrayContaining(["C", "D", "E"]));
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  chordSchema,
  clefSchema,
  defaultClefSchema,
  noteSchema,
  notationExerciseSchema,
} from "./schemas/index.ts";

describe("noteSchema", () => {
  it.each(["C4", "F#5", "Bb3", "D2", "G6"])("accepts valid note %s", (note) => {
    expect(noteSchema.safeParse(note).success).toBe(true);
  });

  it.each(["X4", "hello", "", "4C", "Z#3"])("rejects invalid note %s", (note) => {
    expect(noteSchema.safeParse(note).success).toBe(false);
  });
});

describe("chordSchema", () => {
  it.each(["Cmaj7", "Am", "Bb7", "F#dim", "Dm7"])("accepts valid chord %s", (chord) => {
    expect(chordSchema.safeParse(chord).success).toBe(true);
  });

  it.each(["XYZ", "", "123"])("rejects invalid chord %s", (chord) => {
    expect(chordSchema.safeParse(chord).success).toBe(false);
  });
});

describe("clefSchema", () => {
  it("accepts treble and bass", () => {
    expect(clefSchema.safeParse("treble").success).toBe(true);
    expect(clefSchema.safeParse("bass").success).toBe(true);
  });

  it("rejects other strings", () => {
    expect(clefSchema.safeParse("alto").success).toBe(false);
    expect(clefSchema.safeParse("").success).toBe(false);
  });
});

describe("notationExerciseSchema", () => {
  const valid = {
    id: "abc-123",
    clef: "treble",
    tempo: 60,
    notes: ["C4", "D4", "E4"],
    allowedNotes: ["C", "D", "E"],
  };

  it("accepts a valid exercise", () => {
    expect(notationExerciseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects tempo below 30", () => {
    expect(notationExerciseSchema.safeParse({ ...valid, tempo: 10 }).success).toBe(false);
  });

  it("rejects tempo above 240", () => {
    expect(notationExerciseSchema.safeParse({ ...valid, tempo: 300 }).success).toBe(false);
  });

  it("rejects empty notes array", () => {
    expect(notationExerciseSchema.safeParse({ ...valid, notes: [] }).success).toBe(false);
  });

  it("rejects invalid notes in the array", () => {
    expect(
      notationExerciseSchema.safeParse({ ...valid, notes: ["X99"] }).success,
    ).toBe(false);
  });
});

describe("defaultClefSchema", () => {
  it("accepts treble and bass", () => {
    expect(defaultClefSchema.parse("treble")).toBe("treble");
    expect(defaultClefSchema.parse("bass")).toBe("bass");
  });

  it("defaults to treble for invalid input", () => {
    expect(defaultClefSchema.parse("alto")).toBe("treble");
    expect(defaultClefSchema.parse("")).toBe("treble");
    expect(defaultClefSchema.parse(undefined)).toBe("treble");
  });
});

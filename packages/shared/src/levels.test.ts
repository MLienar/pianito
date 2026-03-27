import { describe, expect, it } from "vitest";
import {
  EXERCISE_LEVELS,
  LEVEL_GROUPS,
  getExerciseLevel,
  getNewNotes,
} from "./levels.ts";

describe("EXERCISE_LEVELS", () => {
  it("has around 100 levels", () => {
    expect(EXERCISE_LEVELS.length).toBeGreaterThanOrEqual(90);
    expect(EXERCISE_LEVELS.length).toBeLessThanOrEqual(110);
  });

  it("assigns sequential level numbers starting at 1", () => {
    const levels = EXERCISE_LEVELS.map((l) => l.level);
    expect(levels).toEqual(
      Array.from({ length: EXERCISE_LEVELS.length }, (_, i) => i + 1),
    );
  });

  it("starts with treble clef C, D, E", () => {
    const first = EXERCISE_LEVELS[0];
    expect(first).toBeDefined();
    expect(first!.clef).toBe("treble");
    expect(first!.notes).toEqual(["C", "D", "E"]);
    expect(first!.newNotes).toEqual(["C", "D", "E"]);
  });

  it("introduces bass clef before level 20", () => {
    const firstBass = EXERCISE_LEVELS.find((l) => l.clef === "bass");
    expect(firstBass).toBeDefined();
    expect(firstBass!.level).toBeLessThan(20);
  });

  it("introduces accidentals after natural notes are covered", () => {
    const firstAccidental = EXERCISE_LEVELS.find((l) =>
      l.notes.some((n) => n.includes("#") || n.includes("b")),
    );
    expect(firstAccidental).toBeDefined();
    expect(firstAccidental!.level).toBeGreaterThan(40);
  });

  it("every level has valid clef", () => {
    for (const level of EXERCISE_LEVELS) {
      expect(["treble", "bass"]).toContain(level.clef);
    }
  });

  it("every level has at least one note", () => {
    for (const level of EXERCISE_LEVELS) {
      expect(level.notes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("count and tempo increase over time", () => {
    const first = EXERCISE_LEVELS[0]!;
    const last = EXERCISE_LEVELS[EXERCISE_LEVELS.length - 1]!;
    expect(last.count).toBeGreaterThan(first.count);
    expect(last.tempo).toBeGreaterThan(first.tempo);
  });
});

describe("LEVEL_GROUPS", () => {
  it("covers all levels", () => {
    const allLevels = LEVEL_GROUPS.flatMap((g) => g.levels);
    expect(allLevels).toEqual(
      Array.from({ length: EXERCISE_LEVELS.length }, (_, i) => i + 1),
    );
  });

  it("each group has a name and valid clef", () => {
    for (const group of LEVEL_GROUPS) {
      expect(group.name.length).toBeGreaterThan(0);
      expect(["treble", "bass"]).toContain(group.clef);
    }
  });
});

describe("getExerciseLevel", () => {
  it("returns the correct level by number", () => {
    const level = getExerciseLevel(1);
    expect(level).toBeDefined();
    expect(level!.name).toBe("First Notes");
    expect(level!.clef).toBe("treble");
  });

  it("returns undefined for level 0", () => {
    expect(getExerciseLevel(0)).toBeUndefined();
  });

  it("returns undefined for out-of-range levels", () => {
    expect(getExerciseLevel(EXERCISE_LEVELS.length + 1)).toBeUndefined();
    expect(getExerciseLevel(-1)).toBeUndefined();
  });

  it("returns the last level", () => {
    const last = getExerciseLevel(EXERCISE_LEVELS.length);
    expect(last).toBeDefined();
    expect(last!.name).toBe("Mastery");
  });
});

describe("getNewNotes", () => {
  it("returns new notes for level 1", () => {
    const notes = getNewNotes(1);
    expect(notes).toEqual(["C", "D", "E"]);
  });

  it("returns empty array for consolidation levels", () => {
    // Find a level with no new notes
    const consolidation = EXERCISE_LEVELS.find((l) => l.newNotes.length === 0);
    expect(consolidation).toBeDefined();
    const notes = getNewNotes(consolidation!.level);
    expect(notes).toEqual([]);
  });

  it("returns empty for invalid level", () => {
    expect(getNewNotes(0)).toEqual([]);
    expect(getNewNotes(999)).toEqual([]);
  });
});

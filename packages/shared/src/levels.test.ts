import { describe, expect, it } from "vitest";
import {
  EXERCISE_LEVELS,
  SCALE_GROUPS,
  STEP_LABELS,
  getExerciseLevel,
} from "./levels.ts";

describe("EXERCISE_LEVELS", () => {
  it("generates 4 levels per scale group", () => {
    expect(EXERCISE_LEVELS).toHaveLength(SCALE_GROUPS.length * STEP_LABELS.length);
  });

  it("assigns sequential level numbers starting at 1", () => {
    const levels = EXERCISE_LEVELS.map((l) => l.level);
    expect(levels).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
  });

  it("includes step label in level name", () => {
    const first4 = EXERCISE_LEVELS.slice(0, 4);
    expect(first4.map((l) => l.name)).toEqual([
      "First Notes — Introduction",
      "First Notes — Practice",
      "First Notes — Consolidation",
      "First Notes — Mastery",
    ]);
  });

  it("maps degrees and tempos from scale group", () => {
    const level1 = EXERCISE_LEVELS[0];
    expect(level1.scale).toBe("C major");
    expect(level1.degrees).toBe(3);
    expect(level1.tempo).toBe(45);

    const level4 = EXERCISE_LEVELS[3];
    expect(level4.degrees).toBe(7);
    expect(level4.tempo).toBe(52);
  });

  it("sets count to 10 for every level", () => {
    for (const level of EXERCISE_LEVELS) {
      expect(level.count).toBe(10);
    }
  });
});

describe("getExerciseLevel", () => {
  it("returns the correct level by number", () => {
    const level = getExerciseLevel(1);
    expect(level).toBeDefined();
    expect(level!.name).toBe("First Notes — Introduction");
    expect(level!.scale).toBe("C major");
  });

  it("returns undefined for level 0", () => {
    expect(getExerciseLevel(0)).toBeUndefined();
  });

  it("returns undefined for out-of-range levels", () => {
    expect(getExerciseLevel(41)).toBeUndefined();
    expect(getExerciseLevel(-1)).toBeUndefined();
  });

  it("returns the last level", () => {
    const last = getExerciseLevel(40);
    expect(last).toBeDefined();
    expect(last!.scale).toBe("Ab major");
    expect(last!.name).toContain("Mastery");
  });
});

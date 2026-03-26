import { describe, expect, it } from "vitest";
import { cn, transposeChord } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty and undefined inputs", () => {
    expect(cn("", undefined, null, "foo")).toBe("foo");
  });
});

describe("transposeChord", () => {
  it("should transpose chords up by semitones", () => {
    expect(transposeChord("C", 2)).toBe("D");
    expect(transposeChord("Cm", 2)).toBe("Dm");
    expect(transposeChord("F7", 7)).toBe("C7");
  });

  it("should transpose chords down by semitones", () => {
    expect(transposeChord("C", -2)).toBe("Bb");
    expect(transposeChord("Cm", -2)).toBe("Bbm");
    // D down 1 semitone can be either Db or C# (enharmonic equivalents)
    const result = transposeChord("D", -1);
    expect(result === "Db" || result === "C#").toBe(true);
  });

  it("should handle edge cases", () => {
    expect(transposeChord(null, 5)).toBe(null);
    expect(transposeChord("C", 0)).toBe("C");
    expect(transposeChord("", 5)).toBe("");
  });

  it("should handle invalid semitone values", () => {
    expect(transposeChord("C", 15)).toBe("C");
    expect(transposeChord("C", -15)).toBe("C");
  });

  it("should handle complex chords", () => {
    expect(transposeChord("Dm7b5", 5)).toBe("Gm7b5");
    expect(transposeChord("Cmaj7", 4)).toBe("Emaj7");
  });
});

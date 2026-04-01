import { describe, expect, it } from "vitest";
import { midiNoteToLetter } from "./use-midi-message";

describe("midiNoteToLetter", () => {
  it("converts MIDI note 60 (middle C) to C", () => {
    expect(midiNoteToLetter(60)).toBe("C");
  });

  it("converts MIDI note 62 to D", () => {
    expect(midiNoteToLetter(62)).toBe("D");
  });

  it("converts MIDI note 64 to E", () => {
    expect(midiNoteToLetter(64)).toBe("E");
  });

  it("converts MIDI note 65 to F", () => {
    expect(midiNoteToLetter(65)).toBe("F");
  });

  it("converts MIDI note 67 to G", () => {
    expect(midiNoteToLetter(67)).toBe("G");
  });

  it("converts MIDI note 69 to A", () => {
    expect(midiNoteToLetter(69)).toBe("A");
  });

  it("converts MIDI note 71 to B", () => {
    expect(midiNoteToLetter(71)).toBe("B");
  });

  it("returns null for sharp notes (C#, D#, F#, G#, A#)", () => {
    expect(midiNoteToLetter(61)).toBeNull(); // C#
    expect(midiNoteToLetter(63)).toBeNull(); // D#
    expect(midiNoteToLetter(66)).toBeNull(); // F#
    expect(midiNoteToLetter(68)).toBeNull(); // G#
    expect(midiNoteToLetter(70)).toBeNull(); // A#
  });

  it("handles notes across different octaves", () => {
    expect(midiNoteToLetter(48)).toBe("C"); // C3
    expect(midiNoteToLetter(72)).toBe("C"); // C5
    expect(midiNoteToLetter(21)).toBe("A"); // A0 (lowest piano key)
  });

  it("handles MIDI note 0", () => {
    expect(midiNoteToLetter(0)).toBe("C");
  });
});

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chord } from "tonal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transpose a chord by the specified number of semitones.
 * @param chord - Chord symbol (e.g., "Cm", "F7", "Dm7b5")
 * @param semitones - Number of semitones to transpose (can be negative)
 * @returns Transposed chord symbol, or null if invalid
 */
export function transposeChord(
  chord: string | null,
  semitones: number,
): string | null {
  if (!chord || semitones === 0) return chord;

  try {
    // Convert semitones to interval string for Tonal
    const intervalMap: Record<string, string> = {
      "-12": "-8P",
      "-11": "-7M",
      "-10": "-7m",
      "-9": "-6M",
      "-8": "-6m",
      "-7": "-5P",
      "-6": "-5d",
      "-5": "-4P",
      "-4": "-3M",
      "-3": "-3m",
      "-2": "-2M",
      "-1": "-2m",
      "1": "2m",
      "2": "2M",
      "3": "3m",
      "4": "3M",
      "5": "4P",
      "6": "5d",
      "7": "5P",
      "8": "6m",
      "9": "6M",
      "10": "7m",
      "11": "7M",
      "12": "8P",
    };

    const interval = intervalMap[semitones.toString()];
    if (!interval) return chord; // Invalid semitone value

    const result = Chord.transpose(chord, interval);
    return result || null;
  } catch {
    return null;
  }
}

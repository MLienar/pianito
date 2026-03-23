import { useCallback } from "react";
import { SOLFEGE_MAP } from "@/lib/constants";
import { usePreferences } from "./use-preferences";

/** Returns a function that formats a note letter (e.g. "C", "F#") according to the user's notation preference. */
export function useNoteFormatter() {
  const { data: preferences } = usePreferences();
  const notation = preferences?.notation ?? "letter";

  return useCallback(
    (note: string): string => {
      if (notation === "letter") return note;
      // Split base letter from accidental (e.g. "F#" → "F" + "#")
      const base = note[0];
      const accidental = note.slice(1);
      return `${SOLFEGE_MAP[base] ?? note}${accidental}`;
    },
    [notation],
  );
}

import { useCallback } from "react";
import { ensureKeyboard } from "@/lib/piano-synths";

export function useNotePlayer() {
  const ensureReady = useCallback(() => ensureKeyboard("grand"), []);

  const playNote = useCallback(async (note: string, tempo: number) => {
    const instrument = await ensureKeyboard("grand");
    instrument.triggerAttackRelease(note, 60 / tempo);
  }, []);

  return { playNote, ensureReady };
}

import { useCallback } from "react";
import { ensureSampler, getSampler } from "@/lib/sampler";

export function useNotePlayer() {
  const ensureReady = useCallback(() => ensureSampler(), []);

  const playNote = useCallback(async (note: string, tempo: number) => {
    await ensureSampler();
    const beatDuration = 60 / tempo;
    getSampler()?.triggerAttackRelease(note, beatDuration);
  }, []);

  return { playNote, ensureReady };
}

import { useCallback } from "react";
import { Chord } from "tonal";
import { ensureSampler, getSampler } from "@/lib/sampler";

export function useChordPlayer() {
  const ensureReady = useCallback(() => ensureSampler(), []);

  const playChord = useCallback(
    async (chordSymbol: string, durationSeconds: number) => {
      await ensureSampler();
      const sampler = getSampler();
      if (!sampler) return;

      const chordData = Chord.get(chordSymbol);
      if (chordData.empty || chordData.notes.length === 0) return;

      const notes = chordData.notes.map((note, i) =>
        i === 0 ? `${note}3` : `${note}4`,
      );

      sampler.triggerAttackRelease(notes, durationSeconds);
    },
    [],
  );

  const stopAll = useCallback(() => {
    getSampler()?.releaseAll();
  }, []);

  return { playChord, stopAll, ensureReady };
}

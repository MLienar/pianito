import { useCallback } from "react";
import { Chord } from "tonal";
import {
  ensureKeyboard,
  getOrCreateKeyboard,
  type KeyboardInstrument,
  releaseActiveKeyboard,
} from "@/lib/piano-synths";
import type { PianoPreset } from "@/lib/styles";

function chordToNotes(chordSymbol: string): string[] | null {
  const chordData = Chord.get(chordSymbol);
  if (chordData.empty || chordData.notes.length === 0) return null;
  return chordData.notes.map((note, i) => (i === 0 ? `${note}3` : `${note}4`));
}

function triggerChord(
  instrument: KeyboardInstrument,
  chordSymbol: string,
  durationSeconds: number,
  velocity?: number,
) {
  const notes = chordToNotes(chordSymbol);
  if (!notes) return;
  instrument.triggerAttackRelease(notes, durationSeconds, undefined, velocity);
}

export function useChordPlayer() {
  const ensureReady = useCallback(
    (preset: PianoPreset = "grand") => ensureKeyboard(preset),
    [],
  );

  const playChord = useCallback(
    async (
      chordSymbol: string,
      durationSeconds: number,
      preset: PianoPreset = "grand",
    ) => {
      const instrument = await ensureKeyboard(preset);
      triggerChord(instrument, chordSymbol, durationSeconds);
    },
    [],
  );

  const playChordHit = useCallback(
    (
      chordSymbol: string,
      velocity: number,
      durationSeconds: number,
      preset: PianoPreset = "grand",
    ) => {
      const instrument = getOrCreateKeyboard(preset);
      if (!instrument) return;
      triggerChord(instrument, chordSymbol, durationSeconds, velocity);
    },
    [],
  );

  /** Play pre-resolved notes — avoids re-parsing chord on every step. */
  const playNotesHit = useCallback(
    (
      notes: string[],
      velocity: number,
      durationSeconds: number,
      preset: PianoPreset = "grand",
    ) => {
      const instrument = getOrCreateKeyboard(preset);
      if (!instrument) return;
      instrument.triggerAttackRelease(
        notes,
        durationSeconds,
        undefined,
        velocity,
      );
    },
    [],
  );

  const stopAll = useCallback(() => {
    releaseActiveKeyboard();
  }, []);

  return { playChord, playChordHit, playNotesHit, stopAll, ensureReady };
}

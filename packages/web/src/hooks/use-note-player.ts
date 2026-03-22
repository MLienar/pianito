import { useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

export function useNotePlayer() {
  const synthRef = useRef<Tone.Sampler | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const ensureReady = useCallback(async () => {
    if (synthRef.current) return Promise.resolve();
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = (async () => {
      await Tone.start();
      synthRef.current = new Tone.Sampler({
        urls: {
          C4: "C4.mp3",
          "D#4": "Ds4.mp3",
          "F#4": "Fs4.mp3",
          A4: "A4.mp3",
          C5: "C5.mp3",
          "D#5": "Ds5.mp3",
          "F#5": "Fs5.mp3",
          A5: "A5.mp3",
          C3: "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          A3: "A3.mp3",
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/",
      }).toDestination();

      await Tone.loaded();
    })();

    return initPromiseRef.current;
  }, []);

  const playNote = useCallback(
    async (note: string, tempo: number) => {
      await ensureReady();
      const beatDuration = 60 / tempo;
      synthRef.current?.triggerAttackRelease(note, beatDuration);
    },
    [ensureReady],
  );

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
      initPromiseRef.current = null;
    };
  }, []);

  return { playNote, ensureReady };
}

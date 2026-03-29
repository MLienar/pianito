import { useCallback, useEffect, useRef, useState } from "react";
import { BEATS_PER_MEASURE, COUNT_IN_BEATS } from "@/lib/constants";
import { playClick } from "@/lib/metronome";

interface UseBeatClockOptions {
  tempo: number;
  totalNotes: number;
  running: boolean;
  onBeatAdvance?: (prevNoteIndex: number) => void;
}

interface BeatClockState {
  /** Current beat index. Negative during count-in (-4 to -1), then 0..totalNotes-1 */
  beatIndex: number;
  /** Current note index (clamped to 0 during count-in) */
  noteIndex: number;
  /** Current measure index */
  measureIndex: number;
  /** Beat within current measure (0-3) */
  beatInMeasure: number;
  /** Whether we're in the count-in phase */
  isCountIn: boolean;
  /** Whether all beats have been played */
  isFinished: boolean;
}

export function useBeatClock({
  tempo,
  totalNotes,
  running,
  onBeatAdvance,
}: UseBeatClockOptions): BeatClockState {
  const [beatIndex, setBeatIndex] = useState(-COUNT_IN_BEATS);
  const startTimeRef = useRef<number | null>(null);
  const lastBeatRef = useRef(-COUNT_IN_BEATS);
  const onBeatAdvanceRef = useRef(onBeatAdvance);
  onBeatAdvanceRef.current = onBeatAdvance;

  const beatDurationMs = (60 / tempo) * 1000;

  const reset = useCallback(() => {
    startTimeRef.current = null;
    lastBeatRef.current = -COUNT_IN_BEATS;
    setBeatIndex(-COUNT_IN_BEATS);
  }, []);

  useEffect(() => {
    if (!running) {
      reset();
      return;
    }

    let rafId: number;

    function tick(now: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
        lastBeatRef.current = -COUNT_IN_BEATS;
        // Play the first count-in click immediately
        playClick(0, BEATS_PER_MEASURE, 4);
      }

      const elapsed = now - startTimeRef.current;
      const currentBeat = Math.floor(elapsed / beatDurationMs) - COUNT_IN_BEATS;
      const clampedBeat = Math.min(currentBeat, totalNotes - 1);

      if (clampedBeat !== lastBeatRef.current) {
        const prevBeat = lastBeatRef.current;
        lastBeatRef.current = clampedBeat;
        setBeatIndex(clampedBeat);

        // Play metronome click for this beat
        const beatInMeasure =
          clampedBeat < 0
            ? (clampedBeat + COUNT_IN_BEATS) % BEATS_PER_MEASURE
            : clampedBeat % BEATS_PER_MEASURE;
        playClick(beatInMeasure, BEATS_PER_MEASURE, 4);

        // Notify about the previous beat advancing (for marking misses)
        if (prevBeat >= 0) {
          onBeatAdvanceRef.current?.(prevBeat);
        }
      }

      // Check if we've passed the last beat
      if (currentBeat >= totalNotes) {
        // One final advance callback for the last note
        if (lastBeatRef.current >= 0 && lastBeatRef.current < totalNotes) {
          onBeatAdvanceRef.current?.(lastBeatRef.current);
        }
        setBeatIndex(totalNotes);
        return; // Stop the loop
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running, beatDurationMs, totalNotes, reset]);

  const noteIndex = Math.max(0, Math.min(beatIndex, totalNotes - 1));
  const measureIndex = Math.floor(noteIndex / BEATS_PER_MEASURE);
  const beatInMeasure =
    beatIndex < 0
      ? (beatIndex + COUNT_IN_BEATS) % BEATS_PER_MEASURE
      : beatIndex % BEATS_PER_MEASURE;
  const isCountIn = beatIndex < 0;
  const isFinished = beatIndex >= totalNotes;

  return {
    beatIndex,
    noteIndex,
    measureIndex,
    beatInMeasure,
    isCountIn,
    isFinished,
  };
}

import type { GridData } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chord } from "tonal";
import { playBassNote, stopBass } from "@/lib/bass-synth";
import { startDrums, stopDrums } from "@/lib/drum-engine";
import { playClick } from "@/lib/metronome";
import type { StyleId } from "@/lib/styles";
import { STYLES } from "@/lib/styles";
import { useChordPlayer } from "./use-chord-player";

const BEATS_PER_SQUARE = 4;

interface PlaybackSquare {
  index: number;
  chord: string | null;
}

function flattenGrid(gridData: GridData): PlaybackSquare[] {
  const result: PlaybackSquare[] = [];
  let offset = 0;
  for (const group of gridData.groups) {
    const groupSquares = gridData.squares.slice(
      offset,
      offset + group.squareCount,
    );
    for (let repeat = 0; repeat < group.repeatCount; repeat++) {
      for (const [i, sq] of groupSquares.entries()) {
        result.push({ index: offset + i, chord: sq.chord });
      }
    }
    offset += group.squareCount;
  }
  return result;
}

/**
 * Compute the swing delay for a given subdivision step.
 * For 16n: odd steps (the "e" of each 8th note pair) get pushed later.
 * For 8t: no swing — already triplet feel.
 * swing ranges from 0 (straight) to 1 (full triplet shuffle).
 * At full swing, pairs go from 50/50 to 66/33 (triplet feel).
 */
function swingDelayMs(
  step: number,
  subdivision: "16n" | "8t",
  swing: number,
  subdivisionMs: number,
): number {
  if (subdivision !== "16n" || swing === 0) return 0;
  if (step % 2 !== 1) return 0;
  return swing * (subdivisionMs / 3);
}

export function useGridPlayback(
  data: GridData,
  tempo: number,
  loopCount: number,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [metronome, setMetronome] = useState(false);
  const [style, setStyle] = useState<StyleId | null>(null);
  const [swing, setSwing] = useState(0);
  const [chordsEnabled, setChordsEnabled] = useState(true);
  const [bassEnabled, setBassEnabled] = useState(true);
  const [drumsEnabled, setDrumsEnabled] = useState(true);
  const { playChord, stopAll, ensureReady } = useChordPlayer();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;
  const styleRef = useRef(style);
  styleRef.current = style;
  const swingRef = useRef(swing);
  swingRef.current = swing;
  const chordsEnabledRef = useRef(chordsEnabled);
  chordsEnabledRef.current = chordsEnabled;
  const bassEnabledRef = useRef(bassEnabled);
  bassEnabledRef.current = bassEnabled;
  const drumsEnabledRef = useRef(drumsEnabled);
  drumsEnabledRef.current = drumsEnabled;
  const dataRef = useRef(data);
  dataRef.current = data;

  const clearScheduled = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    clearScheduled();
    stopAll();
    stopDrums();
    stopBass();
    setIsPlaying(false);
    setCurrentIndex(null);
  }, [clearScheduled, stopAll]);

  const toggleMetronome = useCallback(() => setMetronome((v) => !v), []);
  const toggleChords = useCallback(() => setChordsEnabled((v) => !v), []);
  const toggleBass = useCallback(() => setBassEnabled((v) => !v), []);
  const toggleDrums = useCallback(() => setDrumsEnabled((v) => !v), []);

  const play = useCallback(async () => {
    await ensureReady();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const currentStyle = styleRef.current
      ? STYLES[styleRef.current]
      : null;

    if (currentStyle && drumsEnabledRef.current) {
      startDrums(tempo, currentStyle.drums, swingRef.current);
    }

    const beatDurationMs = (60 / tempo) * 1000;
    const squareDurationSec = (60 / tempo) * BEATS_PER_SQUARE;

    const bassPattern = currentStyle?.bass ?? null;
    const subdivision = bassPattern?.subdivision ?? "16n";
    const stepsPerBeat = subdivision === "8t" ? 3 : 4;
    const stepsPerSquare = stepsPerBeat * BEATS_PER_SQUARE;
    const subdivisionMs = beatDurationMs / stepsPerBeat;
    const needsSubdivisionTicks = !!bassPattern;

    let cachedData = dataRef.current;
    let allSquares = flattenGrid(cachedData);
    let currentLoop = 0;
    let squareIdx = 0;
    let stepInSquare = 0;
    let totalSteps = 0;
    let currentChord: string | null = null;
    const startTime = performance.now();

    const playNext = () => {
      if (!isPlayingRef.current) return;

      const beatIndex = Math.floor(stepInSquare / stepsPerBeat);
      const isFirstStepOfBeat = stepInSquare % stepsPerBeat === 0;
      const isFirstStepOfSquare = stepInSquare === 0;

      if (isFirstStepOfSquare) {
        if (dataRef.current !== cachedData) {
          cachedData = dataRef.current;
          allSquares = flattenGrid(cachedData);
          squareIdx = Math.min(squareIdx, allSquares.length - 1);
        }

        if (squareIdx >= allSquares.length) {
          currentLoop++;
          if (currentLoop >= loopCount) {
            stop();
            return;
          }
          squareIdx = 0;
        }

        const sq = allSquares[squareIdx];
        if (!sq) return;

        setCurrentIndex(sq.index);
        currentChord = sq.chord;
        if (sq.chord && chordsEnabledRef.current) {
          playChord(sq.chord, squareDurationSec);
        }
      }

      if (isFirstStepOfBeat && metronomeRef.current) {
        playClick(beatIndex);
      }

      if (bassPattern && currentChord && bassEnabledRef.current) {
        const chordData = Chord.get(currentChord);
        if (!chordData.empty && chordData.tonic) {
          const offset = bassPattern.notes[stepInSquare];
          if (offset !== null && offset !== undefined) {
            playBassNote(chordData.tonic, offset, subdivision);
          }
        }
      }

      stepInSquare++;
      totalSteps++;

      if (!metronomeRef.current && !needsSubdivisionTicks) {
        const remaining = stepsPerSquare - stepInSquare;
        totalSteps += remaining;
        stepInSquare = 0;
        squareIdx++;
      } else if (!needsSubdivisionTicks && isFirstStepOfBeat) {
        const nextBeatStep = stepInSquare;
        const stepsToSkip = stepsPerBeat - (nextBeatStep % stepsPerBeat);
        if (stepsToSkip < stepsPerBeat) {
          totalSteps += stepsToSkip;
          stepInSquare += stepsToSkip;
        }
        if (stepInSquare >= stepsPerSquare) {
          stepInSquare = 0;
          squareIdx++;
        }
      } else if (stepInSquare >= stepsPerSquare) {
        stepInSquare = 0;
        squareIdx++;
      }

      const baseTime = startTime + totalSteps * subdivisionMs;
      const swingOffset = swingDelayMs(
        totalSteps,
        subdivision,
        swingRef.current,
        subdivisionMs,
      );
      const nextFireTime = baseTime + swingOffset;
      const delay = Math.max(0, nextFireTime - performance.now());
      timeoutRef.current = setTimeout(playNext, delay);
    };

    playNext();
  }, [tempo, loopCount, ensureReady, playChord, stop]);

  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      clearScheduled();
    };
  }, [clearScheduled]);

  return {
    isPlaying,
    currentIndex,
    metronome,
    toggleMetronome,
    chordsEnabled,
    toggleChords,
    bassEnabled,
    toggleBass,
    drumsEnabled,
    toggleDrums,
    style,
    selectStyle: setStyle,
    swing,
    setSwing,
    play,
    stop,
  };
}

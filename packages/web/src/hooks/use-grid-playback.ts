import type { GridData, TimeSignature } from "@pianito/shared";
import { DEFAULT_TIME_SIGNATURE } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chord } from "tonal";
import { playBassNote, stopBass } from "@/lib/bass-synth";
import { startDrums, stopDrums } from "@/lib/drum-engine";
import { toTimeSignatureKey } from "@/lib/drum-patterns";
import { playClick } from "@/lib/metronome";
import type { BassPreset, PianoPreset, Style, StyleId } from "@/lib/styles";
import { STYLES } from "@/lib/styles";
import { useChordPlayer } from "./use-chord-player";

const DEFAULT_BEATS_PER_SQUARE = 4;

interface PlaybackSquare {
  index: number;
  chord: string | null;
  nbBeats: number;
  timeSignature: TimeSignature;
}

function flattenGrid(
  gridData: GridData,
  gridTimeSignature: TimeSignature,
  selectedIndices?: Set<number>,
): PlaybackSquare[] {
  const result: PlaybackSquare[] = [];
  const { squares, groups } = gridData;
  const groupByStart = new Map(groups.map((g) => [g.start, g]));
  let i = 0;

  while (i < squares.length) {
    const group = groupByStart.get(i);
    if (group) {
      const ts = group.timeSignature ?? gridTimeSignature;
      const groupSquares = squares.slice(
        group.start,
        group.start + group.nbSquares,
      );
      for (let repeat = 0; repeat < group.repeatCount; repeat++) {
        for (const [offset, sq] of groupSquares.entries()) {
          const index = group.start + offset;
          if (!selectedIndices || selectedIndices.has(index)) {
            result.push({
              index,
              chord: sq.chord,
              nbBeats: sq.nbBeats,
              timeSignature: ts,
            });
          }
        }
      }
      i = group.start + group.nbSquares;
    } else {
      const sq = squares[i];
      if (sq && (!selectedIndices || selectedIndices.has(i))) {
        result.push({
          index: i,
          chord: sq.chord,
          nbBeats: sq.nbBeats,
          timeSignature: gridTimeSignature,
        });
      }
      i++;
    }
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
  timeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE,
  selectedSquares?: Set<number>,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [metronome, setMetronome] = useState(false);
  const [style, setStyle] = useState<StyleId | null>(null);
  const [swing, setSwing] = useState(0);
  const [chordsEnabled, setChordsEnabled] = useState(true);
  const [bassEnabled, setBassEnabled] = useState(true);
  const [drumsEnabled, setDrumsEnabled] = useState(true);
  const [isLoopingSelection, setIsLoopingSelection] = useState(false);
  const { playChord, playNotesHit, stopAll, ensureReady } = useChordPlayer();
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
  const timeSignatureRef = useRef(timeSignature);
  timeSignatureRef.current = timeSignature;
  const selectedSquaresRef = useRef(selectedSquares);
  selectedSquaresRef.current = selectedSquares;
  const isLoopingSelectionRef = useRef(isLoopingSelection);
  isLoopingSelectionRef.current = isLoopingSelection;

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
    setCurrentLoop(0);
    setIsLoopingSelection(false);
  }, [clearScheduled, stopAll]);

  const toggleMetronome = useCallback(() => setMetronome((v) => !v), []);
  const toggleChords = useCallback(() => setChordsEnabled((v) => !v), []);
  const toggleBass = useCallback(() => setBassEnabled((v) => !v), []);
  const toggleDrums = useCallback(() => setDrumsEnabled((v) => !v), []);

  const play = useCallback(async () => {
    const currentStyle: Style | null = styleRef.current
      ? STYLES[styleRef.current]
      : null;
    const pianoPreset: PianoPreset = currentStyle?.pianoPreset ?? "grand";
    await ensureReady(pianoPreset);
    isPlayingRef.current = true;
    setIsPlaying(true);
    const tsKey = toTimeSignatureKey(
      timeSignatureRef.current.numerator,
      timeSignatureRef.current.denominator,
    );

    const drumPattern = currentStyle?.drums[tsKey] ?? null;
    if (drumPattern && drumsEnabledRef.current) {
      startDrums(tempo, drumPattern, swingRef.current);
    }

    const beatDurationMs = (60 / tempo) * 1000;

    const bassPattern = currentStyle?.bass[tsKey] ?? null;
    const pianoPattern = currentStyle?.piano[tsKey] ?? null;
    const bassPreset: BassPreset = currentStyle?.bassPreset ?? "fingered";
    const subdivision =
      pianoPattern?.subdivision ??
      bassPattern?.subdivision ??
      drumPattern?.subdivision ??
      "16n";
    const stepsPerBeat = subdivision === "8t" ? 3 : 4;
    const subdivisionMs = beatDurationMs / stepsPerBeat;
    const needsSubdivisionTicks = !!bassPattern || !!pianoPattern;

    let cachedData = dataRef.current;
    let allSquares = flattenGrid(
      cachedData,
      timeSignatureRef.current,
      isLoopingSelectionRef.current ? selectedSquaresRef.current : undefined,
    );
    let loopIdx = 0;
    setCurrentLoop(1);
    let squareIdx = 0;
    let stepInSquare = 0;
    let totalSteps = 0;
    let currentChord: string | null = null;
    let currentChordData: ReturnType<typeof Chord.get> | null = null;
    let currentChordNotes: string[] | null = null;
    let currentStepsPerSquare = stepsPerBeat * DEFAULT_BEATS_PER_SQUARE;
    const startTime = performance.now();

    const playNext = () => {
      if (!isPlayingRef.current) return;

      const beatIndex = Math.floor(stepInSquare / stepsPerBeat);
      const isFirstStepOfBeat = stepInSquare % stepsPerBeat === 0;
      const isFirstStepOfSquare = stepInSquare === 0;

      if (isFirstStepOfSquare) {
        if (dataRef.current !== cachedData) {
          cachedData = dataRef.current;
          allSquares = flattenGrid(
            cachedData,
            timeSignatureRef.current,
            isLoopingSelectionRef.current
              ? selectedSquaresRef.current
              : undefined,
          );
          squareIdx = Math.min(squareIdx, allSquares.length - 1);
          stepInSquare = 0;
        }

        if (squareIdx >= allSquares.length) {
          loopIdx++;
          if (!isLoopingSelectionRef.current && loopIdx >= loopCount) {
            stop();
            return;
          }
          setCurrentLoop(loopIdx + 1);
          squareIdx = 0;
        }

        const sq = allSquares[squareIdx];
        if (!sq) return;

        currentStepsPerSquare = stepsPerBeat * sq.nbBeats;
        const squareDurationSec = (60 / tempo) * sq.nbBeats;

        setCurrentIndex(sq.index);
        currentChord = sq.chord;
        currentChordData = currentChord ? Chord.get(currentChord) : null;
        currentChordNotes =
          currentChordData && !currentChordData.empty
            ? currentChordData.notes.map((note, i) =>
                i === 0 ? `${note}3` : `${note}4`,
              )
            : null;
        if (sq.chord && chordsEnabledRef.current && !pianoPattern) {
          playChord(sq.chord, squareDurationSec, pianoPreset);
        }
      }

      if (isFirstStepOfBeat && metronomeRef.current) {
        const sq = allSquares[squareIdx];
        const ts = sq?.timeSignature ?? timeSignatureRef.current;
        playClick(beatIndex, ts.numerator, ts.denominator);
      }

      if (pianoPattern && currentChordNotes && chordsEnabledRef.current) {
        const hitIdx = stepInSquare % pianoPattern.hits.length;
        const velocity = pianoPattern.hits[hitIdx];
        if (velocity !== null && velocity !== undefined) {
          const hitDuration = (subdivisionMs * 2) / 1000;
          playNotesHit(currentChordNotes, velocity, hitDuration, pianoPreset);
        }
      }

      if (bassPattern && currentChordData && bassEnabledRef.current) {
        if (!currentChordData.empty && currentChordData.tonic) {
          const noteIdx = stepInSquare % bassPattern.notes.length;
          const note = bassPattern.notes[noteIdx];
          if (note !== null && note !== undefined) {
            playBassNote(
              currentChordData.tonic,
              note.offset,
              subdivision,
              note.velocity,
              bassPreset,
            );
          }
        }
      }

      stepInSquare++;
      totalSteps++;

      if (!metronomeRef.current && !needsSubdivisionTicks) {
        const remaining = currentStepsPerSquare - stepInSquare;
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
        if (stepInSquare >= currentStepsPerSquare) {
          stepInSquare = 0;
          squareIdx++;
        }
      } else if (stepInSquare >= currentStepsPerSquare) {
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
  }, [tempo, loopCount, ensureReady, playChord, playNotesHit, stop]);

  const playSelectionLoop = useCallback(async () => {
    if (!selectedSquares || selectedSquares.size === 0) return;
    isLoopingSelectionRef.current = true;
    setIsLoopingSelection(true);
    await play();
  }, [selectedSquares, play]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    currentIndex,
    currentLoop,
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
    playSelectionLoop,
    isLoopingSelection,
  };
}

import type { GridData } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChordPlayer } from "./use-chord-player";

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

export function useGridPlayback(
  data: GridData,
  tempo: number,
  loopCount: number,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const { playChord, stopAll, ensureReady } = useChordPlayer();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
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
    setIsPlaying(false);
    setCurrentIndex(null);
  }, [clearScheduled, stopAll]);

  const play = useCallback(async () => {
    await ensureReady();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beatDurationMs = (60 / tempo) * 1000;
    const squareDurationMs = beatDurationMs * 4;
    const squareDurationSec = (60 / tempo) * 4;

    let cachedData = dataRef.current;
    let allSquares = flattenGrid(cachedData);
    let currentLoop = 0;
    let squareIdx = 0;
    const startTime = performance.now();

    const playNext = () => {
      if (!isPlayingRef.current) return;

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

      if (sq.chord) {
        playChord(sq.chord, squareDurationSec);
      }

      squareIdx++;
      const totalElapsed = squareIdx + currentLoop * allSquares.length;
      const nextFireTime = startTime + totalElapsed * squareDurationMs;
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

  return { isPlaying, currentIndex, play, stop };
}

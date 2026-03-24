import type { GridData } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChordPlayer } from "./use-chord-player";

interface PlayingPosition {
  line: number;
  square: number;
}

export function useGridPlayback(
  data: GridData,
  tempo: number,
  loopCount: number,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] =
    useState<PlayingPosition | null>(null);
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
    setCurrentPosition(null);
  }, [clearScheduled, stopAll]);

  const play = useCallback(async () => {
    await ensureReady();
    isPlayingRef.current = true;
    setIsPlaying(true);

    const beatDurationMs = (60 / tempo) * 1000;
    const squareDurationMs = beatDurationMs * 4;
    const squareDurationSec = (60 / tempo) * 4;

    const flattenGrid = (gridData: GridData) => {
      const squares: {
        line: number;
        square: number;
        chord: string | null;
      }[] = [];
      for (const [li, line] of gridData.lines.entries()) {
        for (const [si, sq] of line.entries()) {
          squares.push({ line: li, square: si, chord: sq.chord });
        }
      }
      return squares;
    };

    let currentLoop = 0;
    let squareIdx = 0;
    const startTime = performance.now();

    const playNext = () => {
      if (!isPlayingRef.current) return;

      const allSquares = flattenGrid(dataRef.current);

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
      setCurrentPosition({ line: sq.line, square: sq.square });

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

  return { isPlaying, currentPosition, play, stop };
}

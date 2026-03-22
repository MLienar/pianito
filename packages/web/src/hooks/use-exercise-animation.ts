import { useCallback, useEffect, useRef, useState } from "react";
import { NOTE_SPACING } from "@/lib/constants";

export function useExerciseAnimation(tempo: number, isPlaying: boolean) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const tempoRef = useRef(tempo);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }

    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const speed = (tempoRef.current / 60) * NOTE_SPACING;
    setScrollOffset((prev) => prev + (delta / 1000) * speed);

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, animate]);

  function reset() {
    setScrollOffset(0);
    cancelAnimationFrame(animationRef.current);
  }

  return { scrollOffset, reset };
}

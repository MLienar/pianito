import type { NotationExercise } from "@pianito/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { NOTE_SPACING } from "@/lib/constants";
import { useExerciseAnimation } from "./use-exercise-animation";
import { useNoteAnswer } from "./use-note-answer";
import { useNotePlayer } from "./use-note-player";

export type ExerciseState = "idle" | "playing" | "finished";

export function useNotationExercise() {
  const [exerciseState, setExerciseState] = useState<ExerciseState>("idle");

  const {
    data: exercise,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<NotationExercise>({
    queryKey: ["notation-exercise"],
    queryFn: async () => {
      const res = await fetch("/api/exercises/notation?count=10&tempo=60");
      if (!res.ok) {
        throw new Error(`Failed to load exercise (${res.status})`);
      }
      return res.json();
    },
  });

  const totalNotes = exercise?.notes.length ?? 0;
  const isPlaying = exerciseState === "playing";

  const { scrollOffset, reset: resetScroll } = useExerciseAnimation(
    exercise?.tempo ?? 60,
    isPlaying,
  );

  const currentIndex = Math.min(
    Math.max(0, Math.floor(scrollOffset / NOTE_SPACING)),
    Math.max(0, totalNotes - 1),
  );

  const { playNote, ensureReady } = useNotePlayer();

  const { score, answers, feedback, handleAnswer, resetAnswers } =
    useNoteAnswer({
      exercise: exercise ?? null,
      currentIndex,
      isPlaying,
    });

  // Play note when it enters the active zone
  const lastPlayedIndexRef = useRef(-1);
  useEffect(() => {
    if (!isPlaying || !exercise) return;
    if (currentIndex === lastPlayedIndexRef.current) return;
    lastPlayedIndexRef.current = currentIndex;
    const note = exercise.notes[currentIndex];
    if (note != null) {
      playNote(note, exercise.tempo).catch(console.error);
    }
  }, [isPlaying, exercise, currentIndex, playNote]);

  // Reset played index when exercise resets
  useEffect(() => {
    if (exerciseState === "idle") {
      lastPlayedIndexRef.current = -1;
    }
  }, [exerciseState]);

  // Detect exercise completion
  useEffect(() => {
    if (
      isPlaying &&
      exercise &&
      Math.floor(scrollOffset / NOTE_SPACING) >= exercise.notes.length
    ) {
      setExerciseState("finished");
    }
  }, [isPlaying, exercise, scrollOffset]);

  function resetExercise(fetchNew: boolean) {
    setExerciseState(fetchNew ? "idle" : "playing");
    resetScroll();
    resetAnswers();
    if (fetchNew) refetch();
    if (!fetchNew) ensureReady().catch(console.error);
  }

  return {
    exercise,
    exerciseState,
    isLoading,
    fetchError,
    totalNotes,
    scrollOffset,
    currentIndex,
    score,
    answers,
    feedback,
    handleAnswer,
    resetExercise,
    refetch,
  };
}

import type { NotationExercise } from "@pianito/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NOTE_SPACING } from "@/lib/constants";
import { useExerciseAnimation } from "./use-exercise-animation";
import { useNoteAnswer } from "./use-note-answer";

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

  const { score, answers, feedback, handleAnswer, resetAnswers } =
    useNoteAnswer({
      exercise: exercise ?? null,
      currentIndex,
      isPlaying,
    });

  // Detect exercise completion
  if (
    isPlaying &&
    exercise &&
    Math.floor(scrollOffset / NOTE_SPACING) >= exercise.notes.length
  ) {
    setExerciseState("finished");
  }

  function resetExercise(fetchNew: boolean) {
    setExerciseState(fetchNew ? "idle" : "playing");
    resetScroll();
    resetAnswers();
    if (fetchNew) refetch();
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

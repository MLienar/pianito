import type { NotationExercise } from "@pianito/shared";
import { EXERCISE_LEVELS, getExerciseLevel } from "@pianito/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { NOTE_SPACING } from "@/lib/constants";
import { useExerciseAnimation } from "./use-exercise-animation";
import { useNoteAnswer } from "./use-note-answer";
import { useNotePlayer } from "./use-note-player";

export type ExerciseState = "idle" | "playing" | "finished";

export function useNotationExercise(level: number) {
  const [exerciseState, setExerciseState] = useState<ExerciseState>("idle");
  const lastPlayedIndexRef = useRef(-1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const firstLevel = EXERCISE_LEVELS[0];
  const lastLevel = EXERCISE_LEVELS[EXERCISE_LEVELS.length - 1];

  if (!firstLevel || !lastLevel) {
    throw new Error("No exercise levels configured");
  }

  const resolvedLevel = getExerciseLevel(level);
  if (!resolvedLevel) {
    navigate({ to: "/read" });
    throw new Error(`Exercise level ${level} does not exist`);
  }

  const currentLevel = resolvedLevel;
  const isLastLevel = level >= lastLevel.level;

  const {
    data: exercise,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<NotationExercise>({
    queryKey: ["notation-exercise", level],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/notation?level=${level}`);
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

  const {
    score,
    answers,
    feedback,
    handleAnswer: rawHandleAnswer,
    resetAnswers,
  } = useNoteAnswer({
    exercise: exercise ?? null,
    currentIndex,
    canAnswer: exerciseState !== "finished",
    allowedNotes: exercise?.allowedNotes,
  });

  // Reset when navigating to a different level
  // biome-ignore lint/correctness/useExhaustiveDependencies: level change must trigger reset
  useEffect(() => {
    setExerciseState("idle");
    resetScroll();
    resetAnswers();
    lastPlayedIndexRef.current = -1;
  }, [level, resetScroll, resetAnswers]);

  useEffect(() => {
    if (!isPlaying || !exercise) return;
    if (currentIndex === lastPlayedIndexRef.current) return;
    lastPlayedIndexRef.current = currentIndex;
    const note = exercise.notes[currentIndex];
    if (note != null) {
      playNote(note, exercise.tempo).catch(console.error);
    }
  }, [isPlaying, exercise, currentIndex, playNote]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: queryClient is stable
  useEffect(() => {
    if (
      isPlaying &&
      exercise &&
      currentIndex >= totalNotes - 1 &&
      scrollOffset >= totalNotes * NOTE_SPACING
    ) {
      setExerciseState("finished");
      if (score === totalNotes) {
        fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ level }),
        })
          .then(() =>
            queryClient.invalidateQueries({ queryKey: ["completions"] }),
          )
          .catch(() => {});
      }
    }
  }, [
    isPlaying,
    exercise,
    currentIndex,
    totalNotes,
    scrollOffset,
    score,
    level,
  ]);

  const start = useCallback(() => {
    setExerciseState("playing");
    resetScroll();
    ensureReady().catch(console.error);
  }, [resetScroll, ensureReady]);

  const handleAnswer = useCallback(
    (note: string) => {
      if (exerciseState === "idle") {
        start();
      }
      rawHandleAnswer(note);
    },
    [exerciseState, start, rawHandleAnswer],
  );

  const retry = useCallback(() => {
    setExerciseState("idle");
    resetScroll();
    resetAnswers();
    refetch();
  }, [resetScroll, resetAnswers, refetch]);

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
    currentLevel,
    isLastLevel,
    handleAnswer,
    retry,
  };
}

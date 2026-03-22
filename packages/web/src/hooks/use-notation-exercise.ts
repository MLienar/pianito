import type { NotationExercise } from "@pianito/shared";
import { EXERCISE_LEVELS, getExerciseLevel } from "@pianito/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANSWER_NOTES, NOTE_SPACING } from "@/lib/constants";
import { useNoteAnswer } from "./use-note-answer";
import { useNotePlayer } from "./use-note-player";

export type ExerciseState = "idle" | "playing" | "finished";

export function useNotationExercise(
  level: number,
  clef: "treble" | "bass" = "treble",
) {
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
    navigate({ to: "/read", search: { clef } });
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
    queryKey: ["notation-exercise", level, clef],
    queryFn: async () => {
      const res = await fetch(
        `/api/exercises/notation?level=${level}&clef=${clef}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to load exercise (${res.status})`);
      }
      return res.json();
    },
  });

  const totalNotes = exercise?.notes.length ?? 0;

  const { playNote, ensureReady } = useNotePlayer();

  const {
    currentIndex,
    score,
    answers,
    feedback,
    handleAnswer: rawHandleAnswer,
    resetAnswers,
  } = useNoteAnswer({
    exercise: exercise ?? null,
    canAnswer: exerciseState !== "finished",
    allowedNotes: exercise?.allowedNotes,
  });

  const targetOffset = currentIndex * NOTE_SPACING;
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    const target = targetOffset;
    let raf: number;

    function tick() {
      const diff = target - scrollRef.current;
      if (Math.abs(diff) < 0.5) {
        scrollRef.current = target;
        setScrollOffset(target);
        return;
      }
      scrollRef.current += diff * 0.15;
      setScrollOffset(scrollRef.current);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetOffset]);

  // Reset when navigating to a different level
  // biome-ignore lint/correctness/useExhaustiveDependencies: level change must trigger reset
  useEffect(() => {
    setExerciseState("idle");
    resetAnswers();
    setScrollOffset(0);
    scrollRef.current = 0;
    lastPlayedIndexRef.current = -1;
  }, [level, resetAnswers]);

  // Play note sound when currentIndex changes
  useEffect(() => {
    if (exerciseState === "idle" || !exercise) return;
    if (currentIndex === lastPlayedIndexRef.current) return;
    lastPlayedIndexRef.current = currentIndex;
    const note = exercise.notes[currentIndex];
    if (note != null) {
      playNote(note, exercise.tempo).catch(console.error);
    }
  }, [exerciseState, exercise, currentIndex, playNote]);

  // Finish when all notes have been answered
  // biome-ignore lint/correctness/useExhaustiveDependencies: queryClient is stable
  useEffect(() => {
    if (exerciseState === "playing" && exercise && currentIndex >= totalNotes) {
      setExerciseState("finished");
      if (score === totalNotes) {
        fetch("/api/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ level, clef }),
        })
          .then(() =>
            queryClient.invalidateQueries({ queryKey: ["completions"] }),
          )
          .catch(() => {});
      }
    }
  }, [exerciseState, exercise, currentIndex, totalNotes, score, level]);

  const handleAnswer = useCallback(
    (note: string) => {
      if (exerciseState === "idle") {
        setExerciseState("playing");
        ensureReady().catch(console.error);
      }
      rawHandleAnswer(note);
    },
    [exerciseState, rawHandleAnswer, ensureReady],
  );

  // Keyboard listener using the wrapped handler
  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;
  const allowedNotesRef = useRef(exercise?.allowedNotes);
  allowedNotesRef.current = exercise?.allowedNotes;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      if (!(ANSWER_NOTES as readonly string[]).includes(key)) return;
      const allowed = allowedNotesRef.current;
      if (allowed && !allowed.includes(key)) return;
      handleAnswerRef.current(key);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const retry = useCallback(() => {
    setExerciseState("idle");
    resetAnswers();
    setScrollOffset(0);
    scrollRef.current = 0;
    refetch();
  }, [resetAnswers, refetch]);

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

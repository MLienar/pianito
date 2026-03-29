import type { NotationExercise } from "@pianito/shared";
import { EXERCISE_LEVELS, getExerciseLevel } from "@pianito/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANSWER_NOTES, BEATS_PER_MEASURE, NOTE_SPACING } from "@/lib/constants";
import { useBeatClock } from "./use-beat-clock";
import { useNoteAnswer } from "./use-note-answer";
import { useNotePlayer } from "./use-note-player";

export type ExerciseState = "idle" | "countIn" | "playing" | "finished";

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
  const clef = currentLevel.clef;
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
  const tempo = exercise?.tempo ?? 60;

  const { playNote, ensureReady } = useNotePlayer();

  const clockRunning =
    exerciseState === "countIn" || exerciseState === "playing";

  const {
    beatIndex,
    noteIndex,
    measureIndex,
    beatInMeasure,
    isCountIn,
    isFinished: clockFinished,
  } = useBeatClock({
    tempo,
    totalNotes,
    running: clockRunning,
    onBeatAdvance: useCallback((prevNoteIndex: number) => {
      markMissedRef.current(prevNoteIndex);
    }, []),
  });

  const {
    score,
    answers,
    feedback,
    missed,
    handleAnswer: rawHandleAnswer,
    markMissed,
    resetAnswers,
  } = useNoteAnswer({
    exercise: exercise ?? null,
    activeNoteIndex: noteIndex,
    canAnswer: exerciseState === "playing",
  });

  // Keep a ref for the beat clock callback
  const markMissedRef = useRef(markMissed);
  markMissedRef.current = markMissed;

  // Transition from countIn to playing when count-in ends
  useEffect(() => {
    if (exerciseState === "countIn" && !isCountIn && beatIndex >= 0) {
      setExerciseState("playing");
    }
  }, [exerciseState, isCountIn, beatIndex]);

  // Play note sound when noteIndex changes during playing
  useEffect(() => {
    if (exerciseState !== "playing" || !exercise) return;
    if (noteIndex === lastPlayedIndexRef.current) return;
    lastPlayedIndexRef.current = noteIndex;
    const note = exercise.notes[noteIndex];
    if (note != null) {
      playNote(note, exercise.tempo).catch(console.error);
    }
  }, [exerciseState, exercise, noteIndex, playNote]);

  // Scroll animation driven by measure changes (not every note)
  const targetOffset = measureIndex * BEATS_PER_MEASURE * NOTE_SPACING;
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

  // Finish when clock signals completion
  // biome-ignore lint/correctness/useExhaustiveDependencies: queryClient is stable
  useEffect(() => {
    if (exerciseState === "playing" && clockFinished) {
      // Mark the last note as missed if unanswered
      markMissed(totalNotes - 1);
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
  }, [
    exerciseState,
    clockFinished,
    totalNotes,
    score,
    level,
    clef,
    markMissed,
  ]);

  // Reset when navigating to a different level
  // biome-ignore lint/correctness/useExhaustiveDependencies: level change must trigger reset
  useEffect(() => {
    setExerciseState("idle");
    resetAnswers();
    setScrollOffset(0);
    scrollRef.current = 0;
    lastPlayedIndexRef.current = -1;
  }, [level, resetAnswers]);

  const handleAnswer = useCallback(
    (note: string) => {
      if (exerciseState === "idle") {
        setExerciseState("countIn");
        ensureReady().catch(console.error);
        return;
      }
      if (exerciseState === "playing") {
        rawHandleAnswer(note);
      }
    },
    [exerciseState, rawHandleAnswer, ensureReady],
  );

  // Keyboard listener
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
    lastPlayedIndexRef.current = -1;
    refetch();
  }, [resetAnswers, refetch]);

  return {
    exercise,
    exerciseState,
    isLoading,
    fetchError,
    totalNotes,
    scrollOffset,
    noteIndex,
    score,
    answers,
    feedback,
    missed,
    currentLevel,
    isLastLevel,
    measureIndex,
    isCountIn,
    beatInMeasure,
    handleAnswer,
    retry,
  };
}

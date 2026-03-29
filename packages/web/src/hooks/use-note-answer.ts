import type { NotationExercise } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Note } from "tonal";

interface UseNoteAnswerOptions {
  exercise: NotationExercise | null;
  activeNoteIndex: number;
  canAnswer: boolean;
}

export function useNoteAnswer({
  exercise,
  activeNoteIndex,
  canAnswer,
}: UseNoteAnswerOptions) {
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null | undefined)[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exerciseRef = useRef(exercise);
  const answersRef = useRef(answers);
  const activeNoteIndexRef = useRef(activeNoteIndex);
  const canAnswerRef = useRef(canAnswer);
  exerciseRef.current = exercise;
  answersRef.current = answers;
  activeNoteIndexRef.current = activeNoteIndex;
  canAnswerRef.current = canAnswer;

  const handleAnswer = useCallback((letter: string) => {
    const ex = exerciseRef.current;
    const idx = activeNoteIndexRef.current;
    if (!canAnswerRef.current || !ex) return;
    // Already answered or missed this note
    if (answersRef.current[idx] !== undefined) return;

    const noteStr = ex.notes[idx];
    if (!noteStr) return;
    const currentNote = Note.get(noteStr);
    const correct = currentNote.letter === letter;

    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = letter;
      return next;
    });

    if (correct) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 400);
  }, []);

  const markMissed = useCallback((noteIndex: number) => {
    setAnswers((prev) => {
      if (prev[noteIndex] !== undefined) return prev;
      const next = [...prev];
      next[noteIndex] = null;
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const resetAnswers = useCallback(() => {
    setScore(0);
    setAnswers([]);
    setFeedback(null);
  }, []);

  const missed = answers.filter((a) => a === null).length;

  return {
    score,
    answers,
    feedback,
    missed,
    handleAnswer,
    markMissed,
    resetAnswers,
  };
}

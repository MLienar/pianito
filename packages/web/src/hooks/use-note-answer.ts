import type { NotationExercise } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Note } from "tonal";

interface UseNoteAnswerOptions {
  exercise: NotationExercise | null;
  canAnswer: boolean;
  allowedNotes?: string[];
}

export function useNoteAnswer({
  exercise,
  canAnswer,
  allowedNotes,
}: UseNoteAnswerOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exerciseRef = useRef(exercise);
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);
  const canAnswerRef = useRef(canAnswer);
  exerciseRef.current = exercise;
  answersRef.current = answers;
  currentIndexRef.current = currentIndex;
  canAnswerRef.current = canAnswer;

  const handleAnswer = useCallback((letter: string) => {
    const ex = exerciseRef.current;
    const idx = currentIndexRef.current;
    if (!canAnswerRef.current || !ex) return;
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

    setCurrentIndex((prev) => prev + 1);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 400);
  }, []);

  // Cleanup feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const resetAnswers = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setFeedback(null);
  }, []);

  return { currentIndex, score, answers, feedback, handleAnswer, resetAnswers };
}

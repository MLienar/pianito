import type { NotationExercise } from "@pianito/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Note } from "tonal";
import { ANSWER_NOTES } from "@/lib/constants";

interface UseNoteAnswerOptions {
  exercise: NotationExercise | null;
  currentIndex: number;
  isPlaying: boolean;
}

export function useNoteAnswer({
  exercise,
  currentIndex,
  isPlaying,
}: UseNoteAnswerOptions) {
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for stable handleAnswer callback
  const exerciseRef = useRef(exercise);
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    exerciseRef.current = exercise;
  }, [exercise]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleAnswer = useCallback((letter: string) => {
    const ex = exerciseRef.current;
    const idx = currentIndexRef.current;
    if (!isPlayingRef.current || !ex) return;
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

  // Keyboard support
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      if ((ANSWER_NOTES as readonly string[]).includes(key)) {
        handleAnswer(key);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleAnswer]);

  // Cleanup feedback timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  function resetAnswers() {
    setScore(0);
    setAnswers([]);
    setFeedback(null);
  }

  return { score, answers, feedback, handleAnswer, resetAnswers };
}

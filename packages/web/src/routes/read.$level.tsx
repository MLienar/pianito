import type { Clef } from "@pianito/shared";
import { EXERCISE_LEVELS } from "@pianito/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { AnswerButtons } from "@/components/answer-buttons";
import { Button } from "@/components/button";
import { ExerciseIntroModal } from "@/components/exercise-intro-modal";
import { ExerciseResults } from "@/components/exercise-results";
import { StaffRenderer } from "@/components/staff-renderer";
import { useNotationExercise } from "@/hooks/use-notation-exercise";

export const Route = createFileRoute("/read/$level")({
  component: ReadExercise,
  validateSearch: (search: Record<string, unknown>): { clef: Clef } => ({
    clef: search.clef === "bass" ? "bass" : "treble",
  }),
});

function ReadExercise() {
  const { level: levelParam } = Route.useParams();
  const { clef } = Route.useSearch();
  const level = Number(levelParam);
  const navigate = useNavigate();

  const introKey = `intro-dismissed-${clef}-${level}`;
  const [showIntro, setShowIntro] = useState(
    () => !localStorage.getItem(introKey),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: introKey is derived from level+clef
  useEffect(() => {
    setShowIntro(!localStorage.getItem(introKey));
  }, [level, clef]);

  const {
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
  } = useNotationExercise(level, clef);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg font-bold">Loading exercise...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-bold text-destructive">
          {fetchError.message}
        </p>
        <Button variant="primary" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!exercise) return null;

  if (showIntro && exerciseState === "idle") {
    return (
      <ExerciseIntroModal
        level={currentLevel}
        clef={clef}
        onStart={() => setShowIntro(false)}
        onDontShowAgain={() => {
          localStorage.setItem(introKey, "1");
          setShowIntro(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/read"
            search={{ clef }}
            className="text-muted-foreground hover:text-foreground"
          >
            &larr; Levels
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            Level {level}/{EXERCISE_LEVELS.length}
          </h1>
          <p className="text-muted-foreground">{currentLevel.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold font-mono">
            Score: {score}/{totalNotes}
          </span>
          {match(exerciseState)
            .with("finished", () => (
              <div className="flex gap-2">
                <Button variant="primary" size="lg" onClick={retry}>
                  Retry
                </Button>
                {!isLastLevel && (
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() =>
                      navigate({
                        to: "/read/$level",
                        params: { level: String(level + 1) },
                        search: { clef },
                      })
                    }
                  >
                    Next Level
                  </Button>
                )}
              </div>
            ))
            .with("idle", "playing", () => null)
            .exhaustive()}
        </div>
      </div>

      <StaffRenderer
        notes={exercise.notes}
        clef={exercise.clef}
        scrollOffset={scrollOffset}
        currentIndex={currentIndex}
        answers={answers}
        feedback={feedback}
      />

      {feedback &&
        match(feedback)
          .with("correct", () => (
            <div className="text-center text-xl font-bold py-2 border-3 border-border bg-accent">
              Correct!
            </div>
          ))
          .with("wrong", () => (
            <div className="text-center text-xl font-bold py-2 border-3 border-border bg-destructive text-destructive-foreground">
              Wrong!
            </div>
          ))
          .exhaustive()}

      <AnswerButtons
        disabled={exerciseState === "finished"}
        allowedNotes={exercise.allowedNotes}
        onAnswer={handleAnswer}
      />

      {match(exerciseState)
        .with("idle", () => (
          <p className="text-center text-muted-foreground">
            Press any note button to begin. Identify each note as it reaches the
            orange zone. You can also use your keyboard (C, D, E, F, G, A, B).
          </p>
        ))
        .with("finished", () => (
          <ExerciseResults score={score} total={totalNotes} />
        ))
        .with("playing", () => null)
        .exhaustive()}
    </div>
  );
}

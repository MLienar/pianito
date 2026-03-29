import { EXERCISE_LEVELS } from "@pianito/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { match } from "ts-pattern";
import { AnswerButtons } from "@/components/answer-buttons";
import { Button } from "@/components/button";
import { ExerciseResults } from "@/components/exercise-results";
import { NoteIntroCards } from "@/components/read-tour/note-intro-cards";
import { useReadTour } from "@/components/read-tour/use-read-tour";
import { StaffRenderer } from "@/components/staff-renderer";
import { useNotationExercise } from "@/hooks/use-notation-exercise";
import { useNoteFormatter } from "@/hooks/use-note-formatter";
import { parseNote } from "@/lib/staff-utils";

export const Route = createFileRoute("/read/$level")({
  component: ReadExercise,
});

function ReadExercise() {
  const { t } = useTranslation();
  const { level: levelParam } = Route.useParams();
  const level = Number(levelParam);
  const navigate = useNavigate();

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
  } = useNotationExercise(level);

  const clef = currentLevel.clef;
  const introKey = `intro-dismissed-${clef}-${level}`;
  const [showIntro, setShowIntro] = useState(
    () => !localStorage.getItem(introKey),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: introKey is derived from level+clef
  useEffect(() => {
    setShowIntro(!localStorage.getItem(introKey));
  }, [level]);

  const formatNote = useNoteFormatter();
  const referenceOctave = clef === "bass" ? 3 : 4;
  const noteNames = useMemo(
    () =>
      currentLevel.newNotes.map((note) => {
        const parsed = parseNote(`${note}${referenceOctave}`, clef);
        return formatNote(
          parsed.accidental
            ? `${parsed.letter}${parsed.accidental}`
            : parsed.letter,
        );
      }),
    [currentLevel.newNotes, clef, referenceOctave, formatNote],
  );

  const tourEnabled =
    showIntro && exerciseState === "idle" && currentLevel.newNotes.length > 0;

  useReadTour({
    introKey,
    noteNames,
    enabled: tourEnabled,
    onComplete: () => setShowIntro(false),
    onDismiss: () => setShowIntro(false),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg font-bold">{t("read.loadingExercise")}</p>
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
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!exercise) return null;

  return (
    <div className="flex flex-col gap-6 py-8">
      {tourEnabled && (
        <NoteIntroCards
          newNotes={currentLevel.newNotes}
          clef={clef}
          keySignature={currentLevel.keySignature}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/read"
            className="text-muted-foreground hover:text-foreground"
          >
            &larr; {t("read.levels")}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-1">
            {t("read.levelProgress", {
              current: level,
              total: EXERCISE_LEVELS.length,
            })}
          </h1>
          <p className="text-muted-foreground">{currentLevel.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold font-mono">
            {t("read.score", { score, total: totalNotes })}
          </span>
          {match(exerciseState)
            .with("finished", () => (
              <div className="flex gap-2">
                <Button variant="primary" size="lg" onClick={retry}>
                  {t("common.retry")}
                </Button>
                {!isLastLevel && (
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={() =>
                      navigate({
                        to: "/read/$level",
                        params: { level: String(level + 1) },
                      })
                    }
                  >
                    {t("read.nextLevel")}
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
        keySignature={exercise.keySignature}
        scrollOffset={scrollOffset}
        currentIndex={currentIndex}
        answers={answers}
        feedback={feedback}
      />

      <AnswerButtons
        disabled={exerciseState === "finished"}
        allowedNotes={exercise.allowedNotes}
        onAnswer={handleAnswer}
      />

      {match(exerciseState)
        .with("idle", () => (
          <p className="text-center text-muted-foreground">
            {t("read.instructions")}
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

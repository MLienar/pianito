interface ExerciseResultsProps {
  score: number;
  total: number;
}

export function ExerciseResults({ score, total }: ExerciseResultsProps) {
  return (
    <div className="border-3 border-border bg-secondary p-6 shadow-[var(--shadow-brutal)] text-center">
      <p className="text-2xl font-bold">Exercise Complete!</p>
      <p className="text-4xl font-bold font-mono mt-2">
        {score}/{total}
      </p>
      <p className="mt-2 text-muted-foreground">
        {score === total
          ? "Perfect score!"
          : score >= total * 0.7
            ? "Great job!"
            : "Keep practicing!"}
      </p>
    </div>
  );
}

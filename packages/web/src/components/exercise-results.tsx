import { useTranslation } from "react-i18next";

interface ExerciseResultsProps {
  score: number;
  total: number;
}

export function ExerciseResults({ score, total }: ExerciseResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="border-3 border-border bg-secondary p-6 shadow-[var(--shadow-brutal)] text-center">
      <p className="text-2xl font-bold">{t("results.exerciseComplete")}</p>
      <p className="text-4xl font-bold font-mono mt-2">
        {t("results.scoreDisplay", { score, total })}
      </p>
      <p className="mt-2 text-muted-foreground">
        {score === total
          ? t("results.perfectScore")
          : score >= total * 0.7
            ? t("results.greatJob")
            : t("results.keepPracticing")}
      </p>
    </div>
  );
}

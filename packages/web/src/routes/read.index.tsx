import type { CompletionsResponse } from "@pianito/shared";
import { getExerciseLevel, LEVEL_GROUPS } from "@pianito/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/read/")({
  component: ReadLevels,
});

const CLEF_SYMBOLS = {
  treble: "\u{1D11E}", // 𝄞
  bass: "\u{1D122}", // 𝄢
} as const;

function ReadLevels() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const { data: completions } = useQuery<CompletionsResponse>({
    queryKey: ["completions"],
    queryFn: async () => {
      const res = await fetch("/api/completions", { credentials: "include" });
      if (!res.ok) return { levels: [] };
      return res.json();
    },
    enabled: !!session,
  });

  const completedSet = useMemo(
    () => new Set(completions?.levels.map((c) => `${c.level}:${c.clef}`)),
    [completions],
  );

  return (
    <div className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("read.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("read.description")}</p>
      </div>

      <div className="flex flex-col gap-6">
        {LEVEL_GROUPS.map((group) => {
          const groupLevels = group.levels
            .map((n) => getExerciseLevel(n))
            .filter((l): l is NonNullable<typeof l> => l != null);

          if (groupLevels.length === 0) return null;

          const description =
            group.newNotes.length > 0
              ? `${t(`read.clef.${group.clef}`)} \u00b7 ${t("read.newNotes", { notes: group.newNotes.join(", ") })}`
              : t(`read.clef.${group.clef}`);

          return (
            <div
              key={`${group.name}-${group.levels[0]}`}
              className="border-3 border-border bg-card p-5 shadow-[var(--shadow-brutal)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label={group.clef}>
                  {CLEF_SYMBOLS[group.clef]}
                </span>
                <div>
                  <h2 className="text-lg font-bold">{group.name}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {groupLevels.map((el) => {
                  const completionKey = `${el.level}:${el.clef}`;
                  const isCompleted = completedSet.has(completionKey);

                  return (
                    <Link
                      key={el.level}
                      to="/read/$level"
                      params={{ level: String(el.level) }}
                    >
                      <div className="border-3 border-border bg-background p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] cursor-pointer relative">
                        {isCompleted && (
                          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-accent text-xs font-bold shadow-[1px_1px_0_0_var(--border)]">
                            ✓
                          </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">
                          {el.level}
                        </span>
                        <p className="text-sm font-bold mt-1">
                          {t("read.notesAndTempo", {
                            notes: el.count,
                            tempo: el.tempo,
                          })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

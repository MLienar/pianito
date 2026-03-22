import type { Clef, CompletionsResponse } from "@pianito/shared";
import { EXERCISE_LEVELS, SCALE_GROUPS, STEP_LABELS } from "@pianito/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/read/")({
  component: ReadLevels,
  validateSearch: (search: Record<string, unknown>): { clef: Clef } => ({
    clef: search.clef === "bass" ? "bass" : "treble",
  }),
});

const CLEF_TABS: { value: Clef; label: string }[] = [
  { value: "treble", label: "Treble Clef" },
  { value: "bass", label: "Bass Clef" },
];

function ReadLevels() {
  const { data: session } = useSession();
  const { clef: activeClef } = Route.useSearch();
  const navigate = useNavigate();

  const { data: completions } = useQuery<CompletionsResponse>({
    queryKey: ["completions"],
    queryFn: async () => {
      const res = await fetch("/api/completions", { credentials: "include" });
      if (!res.ok) return { levels: [] };
      return res.json();
    },
    enabled: !!session,
  });

  const completedSet = new Set(
    completions?.levels
      .filter((c) => c.clef === activeClef)
      .map((c) => c.level),
  );

  return (
    <div className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Read Music</h1>
        <p className="mt-1 text-muted-foreground">
          Progress through scales, from natural notes to four accidentals.
        </p>
      </div>

      <div className="flex gap-2">
        {CLEF_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() =>
              navigate({ to: "/read", search: { clef: tab.value } })
            }
            className={`border-3 border-border px-4 py-2 text-sm font-bold transition-all ${
              activeClef === tab.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-brutal)]"
                : "bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {SCALE_GROUPS.map((group, groupIndex) => {
          const groupLevels = EXERCISE_LEVELS.slice(
            groupIndex * STEP_LABELS.length,
            (groupIndex + 1) * STEP_LABELS.length,
          );

          return (
            <div
              key={group.name}
              className="border-3 border-border bg-card p-5 shadow-[var(--shadow-brutal)]"
            >
              <h2 className="text-lg font-bold">{group.name}</h2>
              <p className="text-sm text-muted-foreground">{group.scale}</p>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {groupLevels.map((el, stepIndex) => (
                  <Link
                    key={el.level}
                    to="/read/$level"
                    params={{ level: String(el.level) }}
                    search={{ clef: activeClef }}
                  >
                    <div className="border-3 border-border bg-background p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] cursor-pointer relative">
                      {completedSet.has(el.level) && (
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-accent text-xs font-bold shadow-[1px_1px_0_0_var(--border)]">
                          ✓
                        </span>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">
                        {el.level}
                      </span>
                      <p className="text-sm font-bold mt-1">
                        {STEP_LABELS[stepIndex]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {el.degrees} notes · {el.tempo} bpm
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

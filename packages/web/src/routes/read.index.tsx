import { EXERCISE_LEVELS, SCALE_GROUPS, STEP_LABELS } from "@pianito/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/read/")({
  component: ReadLevels,
});

function ReadLevels() {
  const { data: session } = useSession();

  const { data: completions } = useQuery<{ levels: number[] }>({
    queryKey: ["completions"],
    queryFn: async () => {
      const res = await fetch("/api/completions", { credentials: "include" });
      if (!res.ok) return { levels: [] };
      return res.json();
    },
    enabled: !!session,
  });

  const completedSet = new Set(completions?.levels);

  return (
    <div className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Read Music</h1>
        <p className="mt-1 text-muted-foreground">
          Progress through scales, from natural notes to four accidentals.
        </p>
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

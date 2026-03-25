import type { GridListResponse, GridSummary } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthGateModal } from "@/components/auth-gate-modal";
import { Tooltip } from "@/components/tooltip";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/accomp/")({
  component: AccompIndex,
});

function AccompIndex() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAuthenticated = !!session?.user;

  const { data, isLoading } = useQuery<GridListResponse>({
    queryKey: ["grids"],
    queryFn: async () => {
      const res = await fetch("/api/grids", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch grids");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: publicData, isLoading: isLoadingPublic } =
    useQuery<GridListResponse>({
      queryKey: ["public-grids"],
      queryFn: async () => {
        const res = await fetch("/api/grids/public");
        if (!res.ok) throw new Error("Failed to fetch public grids");
        return res.json();
      },
    });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/grids", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: t("accomp.untitled") }),
      });
      if (!res.ok) throw new Error("Failed to create grid");
      return res.json();
    },
    onSuccess: (grid) => {
      queryClient.invalidateQueries({ queryKey: ["grids"] });
      navigate({ to: "/accomp/$gridId", params: { gridId: grid.id } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/grids/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete grid");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grids"] });
      setDeletingId(null);
    },
  });

  if (!isPending && !isAuthenticated) {
    return (
      <div className="flex flex-col gap-8 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("accomp.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("accomp.description")}
          </p>
        </div>
        <AuthGateModal
          open={!isAuthenticated}
          onClose={() => navigate({ to: "/" })}
        />
      </div>
    );
  }

  const grids = data?.grids ?? [];

  return (
    <div className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("accomp.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("accomp.description")}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 border-3 border-dashed border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
          >
            <span className="text-3xl">+</span>
            <span className="font-bold">{t("accomp.createNew")}</span>
          </button>

          {grids.map((grid) => (
            <GridCard
              key={grid.id}
              grid={grid}
              isConfirming={deletingId === grid.id}
              onDelete={() => {
                if (deletingId === grid.id) {
                  deleteMutation.mutate(grid.id);
                } else {
                  setDeletingId(grid.id);
                }
              }}
              onCancelDelete={() => setDeletingId(null)}
            />
          ))}
        </div>
      )}

      {!isLoading && grids.length === 0 && (
        <p className="text-center text-muted-foreground">
          {t("accomp.noGrids")}
        </p>
      )}

      <PublicGridsSection
        publicData={publicData}
        isLoadingPublic={isLoadingPublic}
      />
    </div>
  );
}

function GridCard({
  grid,
  isConfirming,
  onDelete,
  onCancelDelete,
}: {
  grid: GridSummary;
  isConfirming: boolean;
  onDelete: () => void;
  onCancelDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-[140px] flex-col border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-hover)]">
      <Link
        to="/accomp/$gridId"
        params={{ gridId: grid.id }}
        className="flex flex-1 flex-col"
      >
        <h3 className="text-lg font-bold">{grid.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {grid.timeSignature.numerator}/{grid.timeSignature.denominator}
          </span>
          <span className="text-sm text-muted-foreground">
            {grid.tempo} {t("accomp.bpm")}
          </span>
          <span
            className={`text-xs font-bold px-1.5 py-0.5 border-2 border-border ${
              grid.visibility === "public"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t(`accomp.${grid.visibility}`)}
          </span>
        </div>
        <p className="mt-auto pt-3 text-xs text-muted-foreground">
          {t("accomp.createdAt", {
            date: new Date(grid.createdAt).toLocaleDateString(),
          })}
        </p>
      </Link>
      <div className="absolute top-3 right-3">
        {isConfirming ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="border-2 border-border bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground"
            >
              {t("accomp.deleteGrid")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancelDelete();
              }}
              className="border-2 border-border bg-card px-2 py-1 text-xs font-bold"
            >
              {t("common.cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="border-2 border-border bg-card px-2 py-1 text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
          >
            {t("accomp.deleteGrid")}
          </button>
        )}
      </div>
    </div>
  );
}

function PublicGridsSection({
  publicData,
  isLoadingPublic,
}: {
  publicData: GridListResponse | undefined;
  isLoadingPublic: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const allPublicGrids = publicData?.grids ?? [];
  const filtered = search.trim()
    ? allPublicGrids.filter((g) => {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.composer?.toLowerCase().includes(q) ||
          g.key?.toLowerCase().includes(q)
        );
      })
    : allPublicGrids;

  return (
    <div className="border-t-3 border-border pt-8">
      <h2 className="text-2xl font-bold tracking-tight">
        {t("accomp.publicGrids")}
      </h2>
      <p className="mt-1 text-muted-foreground">
        {t("accomp.publicGridsDescription")}
      </p>

      {!isLoadingPublic && allPublicGrids.length > 0 && (
        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("accomp.searchPublicGrids")}
            className="w-full max-w-sm border-3 border-border bg-background px-3 py-2 font-bold placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {isLoadingPublic ? (
        <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((grid) => (
            <PublicGridCard key={grid.id} grid={grid} />
          ))}
        </div>
      )}

      {!isLoadingPublic &&
        allPublicGrids.length > 0 &&
        filtered.length === 0 && (
          <p className="mt-4 text-center text-muted-foreground">
            {t("accomp.noResults")}
          </p>
        )}

      {!isLoadingPublic && allPublicGrids.length === 0 && (
        <p className="mt-4 text-center text-muted-foreground">
          {t("accomp.noPublicGrids")}
        </p>
      )}
    </div>
  );
}

function PublicGridCard({ grid }: { grid: GridSummary }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-[140px] flex-col border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-hover)]">
      <Link
        to="/accomp/$gridId"
        params={{ gridId: grid.id }}
        className="flex flex-1 flex-col"
      >
        <h3 className="text-lg font-bold">{grid.name}</h3>
        {grid.composer && (
          <p className="text-sm text-muted-foreground">{grid.composer}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {grid.timeSignature.numerator}/{grid.timeSignature.denominator}
          </span>
          <span className="text-sm text-muted-foreground">
            {grid.tempo} {t("accomp.bpm")}
          </span>
          {grid.key && (
            <span className="border-2 border-border px-1.5 py-0.5 text-xs font-bold">
              {grid.key}
            </span>
          )}
        </div>
      </Link>
      {!grid.userId && (
        <Tooltip content={t("accomp.community")}>
          <span className="absolute top-3 right-3">
            <BadgeCheck size={20} strokeWidth={2.5} className="text-primary" />
          </span>
        </Tooltip>
      )}
    </div>
  );
}

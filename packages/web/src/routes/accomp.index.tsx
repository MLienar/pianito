import type { GridListResponse, GridSummary } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthGateModal } from "@/components/auth-gate-modal";
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
              deletingId={deletingId}
              onDelete={(id) => {
                if (deletingId === id) {
                  deleteMutation.mutate(id);
                } else {
                  setDeletingId(id);
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

      <div className="border-t-3 border-border pt-8">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("accomp.publicGrids")}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {t("accomp.publicGridsDescription")}
        </p>

        {isLoadingPublic ? (
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {publicData?.grids?.map((grid) => (
              <PublicGridCard key={grid.id} grid={grid} />
            ))}
          </div>
        )}

        {!isLoadingPublic &&
          (!publicData?.grids || publicData.grids.length === 0) && (
            <p className="mt-4 text-center text-muted-foreground">
              {t("accomp.noPublicGrids")}
            </p>
          )}
      </div>
    </div>
  );
}

function GridCard({
  grid,
  deletingId,
  onDelete,
  onCancelDelete,
}: {
  grid: GridSummary;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const { t } = useTranslation();
  const isConfirming = deletingId === grid.id;

  return (
    <div className="relative flex min-h-[140px] flex-col border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-hover)]">
      <Link
        to="/accomp/$gridId"
        params={{ gridId: grid.id }}
        className="flex flex-1 flex-col"
      >
        <h3 className="text-lg font-bold">{grid.name}</h3>
        <div className="mt-1 flex items-center gap-2">
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
                onDelete(grid.id);
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
              onDelete(grid.id);
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
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {grid.tempo} {t("accomp.bpm")}
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 border-2 border-border bg-accent text-accent-foreground">
            {t("accomp.public")}
          </span>
        </div>
        <p className="mt-auto pt-3 text-xs text-muted-foreground">
          {t("accomp.createdAt", {
            date: new Date(grid.createdAt).toLocaleDateString(),
          })}
        </p>
      </Link>
    </div>
  );
}

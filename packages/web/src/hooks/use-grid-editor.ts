import type { Grid } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth";
import { useGridEditorStore } from "@/stores/grid-editor";

export function useGridEditor(gridId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const {
    data: serverGrid,
    isLoading,
    error,
  } = useQuery<Grid>({
    queryKey: ["grid", gridId],
    queryFn: async () => {
      const res = await fetch(`/api/grids/${gridId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch grid");
      return res.json();
    },
  });

  useEffect(() => {
    if (serverGrid) {
      useGridEditorStore.getState().initialize(serverGrid);
    }
  }, [serverGrid]);

  const readOnly = useMemo(
    () => !serverGrid || serverGrid.userId !== session?.user?.id,
    [serverGrid, session?.user?.id],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      useGridEditorStore.getState().clampTempo();
      const state = useGridEditorStore.getState();
      const name = state.name;
      const composer = state.composer?.trim() || null;
      const key = state.key?.trim() || null;
      const { tempo, loopCount, visibility, timeSignature, data } = state;
      const res = await fetch(`/api/grids/${gridId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          composer,
          key,
          tempo,
          loopCount,
          visibility,
          timeSignature,
          data,
        }),
      });
      if (!res.ok) throw new Error("Failed to save grid");
      return res.json();
    },
    onSuccess: (updatedGrid: Grid) => {
      useGridEditorStore.setState({ isDirty: false });
      queryClient.setQueryData(["grid", gridId], updatedGrid);
      queryClient.invalidateQueries({ queryKey: ["grids"] });
    },
  });

  const save = useCallback(() => saveMutation.mutate(), [saveMutation]);

  return {
    isLoading,
    isSaving: saveMutation.isPending,
    readOnly,
    error,
    save,
  };
}

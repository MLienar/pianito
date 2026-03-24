import type { Grid } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useGridEditorStore } from "@/stores/grid-editor";

export function useGridEditor(gridId: string) {
  const queryClient = useQueryClient();

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      useGridEditorStore.getState().clampTempo();
      const { name, tempo, loopCount, data } = useGridEditorStore.getState();
      const res = await fetch(`/api/grids/${gridId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tempo, loopCount, data }),
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
    error,
    save,
  };
}

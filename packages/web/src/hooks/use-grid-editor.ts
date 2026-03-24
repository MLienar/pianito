import type { Grid, GridData, GridLine } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const EMPTY_LINE: GridLine = [
  { chord: null },
  { chord: null },
  { chord: null },
  { chord: null },
];

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

  const [name, setName] = useState("");
  const [tempo, setTempo] = useState(90);
  const [loopCount, setLoopCount] = useState(1);
  const [data, setData] = useState<GridData>({ lines: [EMPTY_LINE] });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (serverGrid) {
      setName(serverGrid.name);
      setTempo(serverGrid.tempo);
      setLoopCount(serverGrid.loopCount);
      setData(serverGrid.data);
      setIsDirty(false);
    }
  }, [serverGrid]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const clampedTempo = Math.max(30, Math.min(300, tempo));
      const res = await fetch(`/api/grids/${gridId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tempo: clampedTempo, loopCount, data }),
      });
      if (!res.ok) throw new Error("Failed to save grid");
      return res.json();
    },
    onSuccess: (updatedGrid: Grid) => {
      setIsDirty(false);
      queryClient.setQueryData(["grid", gridId], updatedGrid);
      queryClient.invalidateQueries({ queryKey: ["grids"] });
    },
  });

  const markDirty = useCallback(() => setIsDirty(true), []);

  const updateName = useCallback(
    (newName: string) => {
      setName(newName);
      markDirty();
    },
    [markDirty],
  );

  const updateTempo = useCallback(
    (newTempo: number) => {
      setTempo(newTempo);
      markDirty();
    },
    [markDirty],
  );

  const clampTempo = useCallback(() => {
    setTempo((prev) => Math.max(30, Math.min(300, prev)));
  }, []);

  const updateLoopCount = useCallback(
    (count: number) => {
      const clamped = Math.max(1, Math.min(50, count));
      setLoopCount(clamped);
      markDirty();
    },
    [markDirty],
  );

  const setChord = useCallback(
    (lineIndex: number, squareIndex: number, chord: string) => {
      setData((prev) => {
        const newLines = prev.lines.map((line, li) => {
          if (li !== lineIndex) return line;
          return line.map((sq, si) =>
            si === squareIndex ? { chord } : sq,
          ) as GridLine;
        });
        return { lines: newLines };
      });
      markDirty();
    },
    [markDirty],
  );

  const clearChord = useCallback(
    (lineIndex: number, squareIndex: number) => {
      setData((prev) => {
        const newLines = prev.lines.map((line, li) => {
          if (li !== lineIndex) return line;
          return line.map((sq, si) =>
            si === squareIndex ? { chord: null } : sq,
          ) as GridLine;
        });
        return { lines: newLines };
      });
      markDirty();
    },
    [markDirty],
  );

  const addLine = useCallback(() => {
    setData((prev) => ({
      lines: [...prev.lines, [...EMPTY_LINE] as unknown as GridLine],
    }));
    markDirty();
  }, [markDirty]);

  const removeLine = useCallback(
    (lineIndex: number) => {
      setData((prev) => {
        if (prev.lines.length <= 1) return prev;
        return { lines: prev.lines.filter((_, i) => i !== lineIndex) };
      });
      markDirty();
    },
    [markDirty],
  );

  const reorderLines = useCallback(
    (fromIndex: number, toIndex: number) => {
      setData((prev) => {
        const newLines = [...prev.lines];
        const [moved] = newLines.splice(fromIndex, 1);
        if (moved) newLines.splice(toIndex, 0, moved);
        return { lines: newLines };
      });
      markDirty();
    },
    [markDirty],
  );

  const reorderSquares = useCallback(
    (lineIndex: number, fromIndex: number, toIndex: number) => {
      setData((prev) => {
        const newLines = prev.lines.map((line, li) => {
          if (li !== lineIndex) return line;
          const newLine = [...line];
          const [moved] = newLine.splice(fromIndex, 1);
          if (moved) newLine.splice(toIndex, 0, moved);
          return newLine as unknown as GridLine;
        });
        return { lines: newLines };
      });
      markDirty();
    },
    [markDirty],
  );

  const save = useCallback(() => saveMutation.mutate(), [saveMutation]);

  return {
    name,
    tempo,
    loopCount,
    data,
    isDirty,
    isLoading,
    isSaving: saveMutation.isPending,
    error,
    updateName,
    updateTempo,
    clampTempo,
    updateLoopCount,
    setChord,
    clearChord,
    addLine,
    removeLine,
    reorderLines,
    reorderSquares,
    save,
  };
}

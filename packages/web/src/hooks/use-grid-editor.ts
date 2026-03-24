import type { Grid, GridData, GridSquare } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const EMPTY_SQUARE: GridSquare = { chord: null };

function migrateGridData(data: Record<string, unknown>): GridData {
  if (
    "squares" in data &&
    Array.isArray(data.squares) &&
    "groups" in data &&
    Array.isArray(data.groups)
  ) {
    return data as unknown as GridData;
  }
  if ("lines" in data && Array.isArray(data.lines)) {
    const lines = data.lines as { chord: string | null }[][];
    const squares = lines.flat();
    const groups =
      "groups" in data && Array.isArray(data.groups)
        ? (data.groups as { lineCount: number; repeatCount: number }[]).map(
            (g) => ({
              squareCount: g.lineCount * 4,
              repeatCount: g.repeatCount,
            }),
          )
        : [{ squareCount: squares.length, repeatCount: 1 }];
    return { squares, groups };
  }
  return {
    squares: [EMPTY_SQUARE],
    groups: [{ squareCount: 1, repeatCount: 1 }],
  };
}

function findGroupForSquare(
  groups: GridData["groups"],
  squareIndex: number,
): { groupIndex: number; offsetInGroup: number } {
  let offset = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    if (!group) continue;
    if (squareIndex < offset + group.squareCount) {
      return { groupIndex: gi, offsetInGroup: squareIndex - offset };
    }
    offset += group.squareCount;
  }
  return { groupIndex: groups.length - 1, offsetInGroup: 0 };
}

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
  const [data, setData] = useState<GridData>({
    squares: [EMPTY_SQUARE],
    groups: [{ squareCount: 1, repeatCount: 1 }],
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (serverGrid) {
      setName(serverGrid.name);
      setTempo(serverGrid.tempo);
      setLoopCount(serverGrid.loopCount);
      setData(
        migrateGridData(serverGrid.data as unknown as Record<string, unknown>),
      );
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
    (index: number, chord: string | null) => {
      setData((prev) => ({
        ...prev,
        squares: prev.squares.map((sq, i) => (i === index ? { chord } : sq)),
      }));
      markDirty();
    },
    [markDirty],
  );

  const clearChord = useCallback(
    (index: number) => setChord(index, null),
    [setChord],
  );

  const addSquare = useCallback(() => {
    setData((prev) => {
      const lastGroup = prev.groups[prev.groups.length - 1];
      if (!lastGroup) return prev;
      const newGroups = [...prev.groups];
      newGroups[newGroups.length - 1] = {
        ...lastGroup,
        squareCount: lastGroup.squareCount + 1,
      };
      return {
        squares: [...prev.squares, EMPTY_SQUARE],
        groups: newGroups,
      };
    });
    markDirty();
  }, [markDirty]);

  const removeSquare = useCallback(
    (index: number) => {
      setData((prev) => {
        if (prev.squares.length <= 1) return prev;

        const { groupIndex } = findGroupForSquare(prev.groups, index);
        const group = prev.groups[groupIndex];
        if (!group) return prev;

        const newGroups = [...prev.groups];
        if (group.squareCount <= 1) {
          newGroups.splice(groupIndex, 1);
        } else {
          newGroups[groupIndex] = {
            ...group,
            squareCount: group.squareCount - 1,
          };
        }

        if (newGroups.length === 0) return prev;

        return {
          squares: prev.squares.filter((_, i) => i !== index),
          groups: newGroups,
        };
      });
      markDirty();
    },
    [markDirty],
  );

  const reorderSquares = useCallback(
    (fromIndex: number, toIndex: number) => {
      setData((prev) => {
        const newSquares = [...prev.squares];
        const [moved] = newSquares.splice(fromIndex, 1);
        if (moved) newSquares.splice(toIndex, 0, moved);
        return { ...prev, squares: newSquares };
      });
      markDirty();
    },
    [markDirty],
  );

  const updateGroupRepeatCount = useCallback(
    (groupIndex: number, repeatCount: number) => {
      const clamped = Math.max(1, Math.min(50, repeatCount));
      setData((prev) => {
        const newGroups = [...prev.groups];
        const group = newGroups[groupIndex];
        if (!group) return prev;
        newGroups[groupIndex] = { ...group, repeatCount: clamped };
        return { ...prev, groups: newGroups };
      });
      markDirty();
    },
    [markDirty],
  );

  const splitGroup = useCallback(
    (squareIndex: number) => {
      setData((prev) => {
        const { groupIndex, offsetInGroup } = findGroupForSquare(
          prev.groups,
          squareIndex,
        );
        const group = prev.groups[groupIndex];
        if (!group || group.squareCount <= 1 || offsetInGroup === 0)
          return prev;

        const newGroups = [...prev.groups];
        newGroups.splice(
          groupIndex,
          1,
          { squareCount: offsetInGroup, repeatCount: group.repeatCount },
          {
            squareCount: group.squareCount - offsetInGroup,
            repeatCount: group.repeatCount,
          },
        );
        return { ...prev, groups: newGroups };
      });
      markDirty();
    },
    [markDirty],
  );

  const mergeWithPreviousGroup = useCallback(
    (groupIndex: number) => {
      setData((prev) => {
        if (groupIndex <= 0 || groupIndex >= prev.groups.length) return prev;
        const prevGroup = prev.groups[groupIndex - 1];
        const currGroup = prev.groups[groupIndex];
        if (!prevGroup || !currGroup) return prev;

        const newGroups = [...prev.groups];
        newGroups.splice(groupIndex - 1, 2, {
          squareCount: prevGroup.squareCount + currGroup.squareCount,
          repeatCount: prevGroup.repeatCount,
        });
        return { ...prev, groups: newGroups };
      });
      markDirty();
    },
    [markDirty],
  );

  const groupSquares = useCallback(
    (startIndex: number, endIndex: number) => {
      setData((prev) => {
        if (
          startIndex < 0 ||
          endIndex >= prev.squares.length ||
          startIndex > endIndex
        )
          return prev;

        const newGroups: GridData["groups"] = [];
        let offset = 0;
        let rangeInsertIndex = -1;
        let rangeSquareCount = 0;

        for (const group of prev.groups) {
          const groupStart = offset;
          const groupEnd = offset + group.squareCount - 1;
          offset += group.squareCount;

          const overlapStart = Math.max(groupStart, startIndex);
          const overlapEnd = Math.min(groupEnd, endIndex);

          if (overlapStart > groupEnd || overlapEnd < groupStart) {
            newGroups.push(group);
            continue;
          }

          if (groupStart < overlapStart) {
            newGroups.push({
              squareCount: overlapStart - groupStart,
              repeatCount: group.repeatCount,
            });
          }

          if (rangeInsertIndex === -1) rangeInsertIndex = newGroups.length;
          rangeSquareCount += overlapEnd - overlapStart + 1;

          if (groupEnd > overlapEnd) {
            newGroups.push({
              squareCount: groupEnd - overlapEnd,
              repeatCount: group.repeatCount,
            });
          }
        }

        if (rangeInsertIndex !== -1 && rangeSquareCount > 0) {
          newGroups.splice(rangeInsertIndex, 0, {
            squareCount: rangeSquareCount,
            repeatCount: 1,
          });
        }

        return { ...prev, groups: newGroups };
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
    addSquare,
    removeSquare,
    reorderSquares,
    updateGroupRepeatCount,
    splitGroup,
    mergeWithPreviousGroup,
    groupSquares,
    save,
  };
}

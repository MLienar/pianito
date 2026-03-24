import type { Grid, GridData, GridLine } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const EMPTY_LINE: GridLine = [
  { chord: null },
  { chord: null },
  { chord: null },
  { chord: null },
];

function migrateGridData(
  data: GridData & { groups?: GridData["groups"] },
): GridData {
  if (data.groups && data.groups.length > 0) return data as GridData;
  return {
    lines: data.lines,
    groups: [{ lineCount: data.lines.length, repeatCount: 1 }],
  };
}

function findGroupForLine(
  groups: GridData["groups"],
  lineIndex: number,
): { groupIndex: number; lineOffsetInGroup: number } {
  let offset = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    if (!group) continue;
    if (lineIndex < offset + group.lineCount) {
      return { groupIndex: gi, lineOffsetInGroup: lineIndex - offset };
    }
    offset += group.lineCount;
  }
  return { groupIndex: groups.length - 1, lineOffsetInGroup: 0 };
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
    lines: [EMPTY_LINE],
    groups: [{ lineCount: 1, repeatCount: 1 }],
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (serverGrid) {
      setName(serverGrid.name);
      setTempo(serverGrid.tempo);
      setLoopCount(serverGrid.loopCount);
      setData(migrateGridData(serverGrid.data));
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
    (lineIndex: number, squareIndex: number, chord: string | null) => {
      setData((prev) => ({
        ...prev,
        lines: prev.lines.map((line, li) =>
          li !== lineIndex
            ? line
            : (line.map((sq, si) =>
                si === squareIndex ? { chord } : sq,
              ) as GridLine),
        ),
      }));
      markDirty();
    },
    [markDirty],
  );

  const clearChord = useCallback(
    (lineIndex: number, squareIndex: number) =>
      setChord(lineIndex, squareIndex, null),
    [setChord],
  );

  const addLine = useCallback(() => {
    setData((prev) => {
      const lastGroup = prev.groups[prev.groups.length - 1];
      if (!lastGroup) return prev;
      const newGroups = [...prev.groups];
      newGroups[newGroups.length - 1] = {
        ...lastGroup,
        lineCount: lastGroup.lineCount + 1,
      };
      return {
        lines: [...prev.lines, [...EMPTY_LINE] as unknown as GridLine],
        groups: newGroups,
      };
    });
    markDirty();
  }, [markDirty]);

  const removeLine = useCallback(
    (lineIndex: number) => {
      setData((prev) => {
        if (prev.lines.length <= 1) return prev;

        const { groupIndex } = findGroupForLine(prev.groups, lineIndex);
        const group = prev.groups[groupIndex];
        if (!group) return prev;

        const newGroups = [...prev.groups];
        if (group.lineCount <= 1) {
          newGroups.splice(groupIndex, 1);
        } else {
          newGroups[groupIndex] = {
            ...group,
            lineCount: group.lineCount - 1,
          };
        }

        if (newGroups.length === 0) return prev;

        return {
          lines: prev.lines.filter((_, i) => i !== lineIndex),
          groups: newGroups,
        };
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
        return { ...prev, lines: newLines };
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
        return { ...prev, lines: newLines };
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
    (lineIndex: number) => {
      setData((prev) => {
        const { groupIndex, lineOffsetInGroup } = findGroupForLine(
          prev.groups,
          lineIndex,
        );
        const group = prev.groups[groupIndex];
        if (!group || group.lineCount <= 1 || lineOffsetInGroup === 0)
          return prev;

        const newGroups = [...prev.groups];
        newGroups.splice(
          groupIndex,
          1,
          { lineCount: lineOffsetInGroup, repeatCount: group.repeatCount },
          {
            lineCount: group.lineCount - lineOffsetInGroup,
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
          lineCount: prevGroup.lineCount + currGroup.lineCount,
          repeatCount: prevGroup.repeatCount,
        });
        return { ...prev, groups: newGroups };
      });
      markDirty();
    },
    [markDirty],
  );

  const groupLines = useCallback(
    (startLine: number, endLine: number) => {
      setData((prev) => {
        if (
          startLine < 0 ||
          endLine >= prev.lines.length ||
          startLine > endLine
        )
          return prev;

        const newGroups: GridData["groups"] = [];
        let offset = 0;
        let rangeInsertIndex = -1;
        let rangeLineCount = 0;

        for (const group of prev.groups) {
          const groupStart = offset;
          const groupEnd = offset + group.lineCount - 1;
          offset += group.lineCount;

          const overlapStart = Math.max(groupStart, startLine);
          const overlapEnd = Math.min(groupEnd, endLine);

          if (overlapStart > groupEnd || overlapEnd < groupStart) {
            newGroups.push(group);
            continue;
          }

          if (groupStart < overlapStart) {
            newGroups.push({
              lineCount: overlapStart - groupStart,
              repeatCount: group.repeatCount,
            });
          }

          if (rangeInsertIndex === -1) rangeInsertIndex = newGroups.length;
          rangeLineCount += overlapEnd - overlapStart + 1;

          if (groupEnd > overlapEnd) {
            newGroups.push({
              lineCount: groupEnd - overlapEnd,
              repeatCount: group.repeatCount,
            });
          }
        }

        if (rangeInsertIndex !== -1 && rangeLineCount > 0) {
          newGroups.splice(rangeInsertIndex, 0, {
            lineCount: rangeLineCount,
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
    addLine,
    removeLine,
    reorderLines,
    reorderSquares,
    updateGroupRepeatCount,
    splitGroup,
    mergeWithPreviousGroup,
    groupLines,
    save,
  };
}

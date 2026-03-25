import type { Grid, GridData, GridSquare } from "@pianito/shared";
import { create } from "zustand";

const EMPTY_SQUARE: GridSquare = { chord: null, nbBeats: 4 };

const DEFAULT_DATA: GridData = {
  squares: [EMPTY_SQUARE],
  groups: [{ squareCount: 1, repeatCount: 1 }],
};

function migrateGridData(data: Record<string, unknown>): GridData {
  if (
    "squares" in data &&
    Array.isArray(data.squares) &&
    "groups" in data &&
    Array.isArray(data.groups)
  ) {
    const squares = (
      data.squares as { chord: string | null; nbBeats?: number }[]
    ).map((sq) => ({ chord: sq.chord, nbBeats: sq.nbBeats ?? 4 }));
    return { squares, groups: data.groups } as unknown as GridData;
  }
  if ("lines" in data && Array.isArray(data.lines)) {
    const lines = data.lines as { chord: string | null }[][];
    const squares = lines
      .flat()
      .map((sq) => ({ chord: sq.chord, nbBeats: 4 as const }));
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
  return { ...DEFAULT_DATA };
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

interface GridEditorState {
  gridId: string | null;
  name: string;
  tempo: number;
  loopCount: number;
  data: GridData;
  isDirty: boolean;
}

interface GridEditorActions {
  initialize: (grid: Grid) => void;
  reset: () => void;
  updateName: (name: string) => void;
  updateTempo: (tempo: number) => void;
  clampTempo: () => void;
  updateLoopCount: (count: number) => void;
  setChord: (index: number, chord: string | null) => void;
  clearChord: (index: number) => void;
  setSquareBeats: (index: number, nbBeats: 2 | 4) => void;
  addSquare: () => void;
  removeSquare: (index: number) => void;
  clearChords: (indices: Set<number>) => void;
  removeSquares: (indices: Set<number>) => void;
  reorderSquares: (fromIndex: number, toIndex: number) => void;
  updateGroupRepeatCount: (groupIndex: number, repeatCount: number) => void;
  splitGroup: (squareIndex: number) => void;
  mergeWithPreviousGroup: (groupIndex: number) => void;
  groupSquares: (startIndex: number, endIndex: number) => void;
}

export type GridEditorStore = GridEditorState & GridEditorActions;

const initialState: GridEditorState = {
  gridId: null,
  name: "",
  tempo: 90,
  loopCount: 1,
  data: DEFAULT_DATA,
  isDirty: false,
};

export const useGridEditorStore = create<GridEditorStore>((set, get) => ({
  ...initialState,

  initialize: (grid) =>
    set({
      gridId: grid.id,
      name: grid.name,
      tempo: grid.tempo,
      loopCount: grid.loopCount,
      data: migrateGridData(grid.data as unknown as Record<string, unknown>),
      isDirty: false,
    }),

  reset: () => set({ ...initialState }),

  updateName: (name) => set({ name, isDirty: true }),

  updateTempo: (tempo) => set({ tempo, isDirty: true }),

  clampTempo: () =>
    set((state) => ({ tempo: Math.max(30, Math.min(300, state.tempo)) })),

  updateLoopCount: (count) =>
    set({ loopCount: Math.max(1, Math.min(50, count)), isDirty: true }),

  setChord: (index, chord) =>
    set((state) => {
      if (state.data.squares[index]?.chord === chord) return state;
      return {
        data: {
          ...state.data,
          squares: state.data.squares.map((sq, i) =>
            i === index ? { ...sq, chord } : sq,
          ),
        },
        isDirty: true,
      };
    }),

  clearChord: (index) => get().setChord(index, null),

  setSquareBeats: (index, nbBeats) =>
    set((state) => {
      const sq = state.data.squares[index];
      if (!sq || sq.nbBeats === nbBeats) return state;
      return {
        data: {
          ...state.data,
          squares: state.data.squares.map((s, i) =>
            i === index ? { ...s, nbBeats } : s,
          ),
        },
        isDirty: true,
      };
    }),

  addSquare: () =>
    set((state) => {
      const lastGroup = state.data.groups[state.data.groups.length - 1];
      if (!lastGroup) return state;
      const newGroups = [...state.data.groups];
      newGroups[newGroups.length - 1] = {
        ...lastGroup,
        squareCount: lastGroup.squareCount + 1,
      };
      return {
        data: {
          squares: [...state.data.squares, EMPTY_SQUARE],
          groups: newGroups,
        },
        isDirty: true,
      };
    }),

  removeSquare: (index) =>
    set((state) => {
      if (state.data.squares.length <= 1) return state;

      const { groupIndex } = findGroupForSquare(state.data.groups, index);
      const group = state.data.groups[groupIndex];
      if (!group) return state;

      const newGroups = [...state.data.groups];
      if (group.squareCount <= 1) {
        newGroups.splice(groupIndex, 1);
      } else {
        newGroups[groupIndex] = {
          ...group,
          squareCount: group.squareCount - 1,
        };
      }

      if (newGroups.length === 0) return state;

      return {
        data: {
          squares: state.data.squares.filter((_, i) => i !== index),
          groups: newGroups,
        },
        isDirty: true,
      };
    }),

  clearChords: (indices) =>
    set((state) => {
      if (indices.size === 0) return state;
      return {
        data: {
          ...state.data,
          squares: state.data.squares.map((sq, i) =>
            indices.has(i) ? { ...sq, chord: null } : sq,
          ),
        },
        isDirty: true,
      };
    }),

  removeSquares: (indices) =>
    set((state) => {
      if (indices.size === 0) return state;
      const remaining = state.data.squares.length - indices.size;
      if (remaining < 1) return state;

      const newSquares = state.data.squares.filter((_, i) => !indices.has(i));
      const newGroups: GridData["groups"] = [];
      let offset = 0;
      for (const group of state.data.groups) {
        let kept = 0;
        for (let i = 0; i < group.squareCount; i++) {
          if (!indices.has(offset + i)) kept++;
        }
        offset += group.squareCount;
        if (kept > 0) {
          newGroups.push({ squareCount: kept, repeatCount: group.repeatCount });
        }
      }

      if (newGroups.length === 0) return state;

      return {
        data: { squares: newSquares, groups: newGroups },
        isDirty: true,
      };
    }),

  reorderSquares: (fromIndex, toIndex) =>
    set((state) => {
      const newSquares = [...state.data.squares];
      const [moved] = newSquares.splice(fromIndex, 1);
      if (moved) newSquares.splice(toIndex, 0, moved);
      return {
        data: { ...state.data, squares: newSquares },
        isDirty: true,
      };
    }),

  updateGroupRepeatCount: (groupIndex, repeatCount) =>
    set((state) => {
      const clamped = Math.max(1, Math.min(50, repeatCount));
      const group = state.data.groups[groupIndex];
      if (!group || group.repeatCount === clamped) return state;
      const newGroups = [...state.data.groups];
      newGroups[groupIndex] = { ...group, repeatCount: clamped };
      return {
        data: { ...state.data, groups: newGroups },
        isDirty: true,
      };
    }),

  splitGroup: (squareIndex) =>
    set((state) => {
      const { groupIndex, offsetInGroup } = findGroupForSquare(
        state.data.groups,
        squareIndex,
      );
      const group = state.data.groups[groupIndex];
      if (!group || group.squareCount <= 1 || offsetInGroup === 0) return state;

      const newGroups = [...state.data.groups];
      newGroups.splice(
        groupIndex,
        1,
        { squareCount: offsetInGroup, repeatCount: group.repeatCount },
        {
          squareCount: group.squareCount - offsetInGroup,
          repeatCount: group.repeatCount,
        },
      );
      return {
        data: { ...state.data, groups: newGroups },
        isDirty: true,
      };
    }),

  mergeWithPreviousGroup: (groupIndex) =>
    set((state) => {
      if (groupIndex <= 0 || groupIndex >= state.data.groups.length)
        return state;
      const prevGroup = state.data.groups[groupIndex - 1];
      const currGroup = state.data.groups[groupIndex];
      if (!prevGroup || !currGroup) return state;

      const newGroups = [...state.data.groups];
      newGroups.splice(groupIndex - 1, 2, {
        squareCount: prevGroup.squareCount + currGroup.squareCount,
        repeatCount: prevGroup.repeatCount,
      });
      return {
        data: { ...state.data, groups: newGroups },
        isDirty: true,
      };
    }),

  groupSquares: (startIndex, endIndex) =>
    set((state) => {
      if (
        startIndex < 0 ||
        endIndex >= state.data.squares.length ||
        startIndex > endIndex
      )
        return state;

      const newGroups: GridData["groups"] = [];
      let offset = 0;
      let rangeInsertIndex = -1;
      let rangeSquareCount = 0;

      for (const group of state.data.groups) {
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

      return {
        data: { ...state.data, groups: newGroups },
        isDirty: true,
      };
    }),
}));

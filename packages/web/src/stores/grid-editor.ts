import type {
  Grid,
  GridData,
  GridSquare,
  GridVisibility,
} from "@pianito/shared";
import { create } from "zustand";

const EMPTY_SQUARE: GridSquare = { chord: null, nbBeats: 4 };

const DEFAULT_DATA: GridData = {
  squares: [EMPTY_SQUARE],
  groups: [],
};

function findGroupForSquare(
  groups: GridData["groups"],
  squareIndex: number,
): number {
  return groups.findIndex(
    (g) => squareIndex >= g.start && squareIndex < g.start + g.nbSquares,
  );
}

function migrateOldGroups(
  oldGroups: { squareCount: number; repeatCount: number }[],
): GridData["groups"] {
  const newGroups: GridData["groups"] = [];
  let offset = 0;
  for (const g of oldGroups) {
    if (g.repeatCount > 1) {
      newGroups.push({
        start: offset,
        nbSquares: g.squareCount,
        repeatCount: g.repeatCount,
      });
    }
    offset += g.squareCount;
  }
  return newGroups;
}

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

    const rawGroups = data.groups as Record<string, unknown>[];
    const isNewFormat =
      rawGroups.length === 0 || (rawGroups[0] && "start" in rawGroups[0]);

    if (isNewFormat) {
      return {
        squares,
        groups: rawGroups as unknown as GridData["groups"],
      };
    }

    // Old format: { squareCount, repeatCount }[]
    const oldGroups = rawGroups as unknown as {
      squareCount: number;
      repeatCount: number;
    }[];
    return { squares, groups: migrateOldGroups(oldGroups) };
  }

  if ("lines" in data && Array.isArray(data.lines)) {
    const lines = data.lines as { chord: string | null }[][];
    const squares = lines
      .flat()
      .map((sq) => ({ chord: sq.chord, nbBeats: 4 as const }));
    const oldGroups =
      "groups" in data && Array.isArray(data.groups)
        ? (data.groups as { lineCount: number; repeatCount: number }[]).map(
            (g) => ({
              squareCount: g.lineCount * 4,
              repeatCount: g.repeatCount,
            }),
          )
        : [{ squareCount: squares.length, repeatCount: 1 }];
    return { squares, groups: migrateOldGroups(oldGroups) };
  }

  return { ...DEFAULT_DATA };
}

interface GridEditorState {
  gridId: string | null;
  name: string;
  tempo: number;
  loopCount: number;
  visibility: GridVisibility;
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
  updateVisibility: (visibility: GridVisibility) => void;
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
  deleteGroup: (groupIndex: number) => void;
  groupSquares: (startIndex: number, endIndex: number) => void;
}

export type GridEditorStore = GridEditorState & GridEditorActions;

const initialState: GridEditorState = {
  gridId: null,
  name: "",
  tempo: 90,
  loopCount: 1,
  visibility: "private",
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
      visibility: grid.visibility,
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

  updateVisibility: (visibility) => set({ visibility, isDirty: true }),

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
    set((state) => ({
      data: {
        ...state.data,
        squares: [...state.data.squares, EMPTY_SQUARE],
      },
      isDirty: true,
    })),

  removeSquare: (index) =>
    set((state) => {
      if (state.data.squares.length <= 1) return state;

      const newSquares = state.data.squares.filter((_, i) => i !== index);
      const newGroups = state.data.groups
        .map((g) => {
          if (index >= g.start && index < g.start + g.nbSquares) {
            return { ...g, nbSquares: g.nbSquares - 1 };
          }
          if (index < g.start) {
            return { ...g, start: g.start - 1 };
          }
          return g;
        })
        .filter((g) => g.nbSquares > 0);

      return {
        data: { squares: newSquares, groups: newGroups },
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
      const sortedIndices = [...indices].sort((a, b) => a - b);

      const newGroups = state.data.groups
        .map((g) => {
          const gEnd = g.start + g.nbSquares;
          let removedInside = 0;
          let removedBefore = 0;
          for (const idx of sortedIndices) {
            if (idx < g.start) removedBefore++;
            else if (idx < gEnd) removedInside++;
          }
          return {
            start: g.start - removedBefore,
            nbSquares: g.nbSquares - removedInside,
            repeatCount: g.repeatCount,
          };
        })
        .filter((g) => g.nbSquares > 0);

      return {
        data: { squares: newSquares, groups: newGroups },
        isDirty: true,
      };
    }),

  reorderSquares: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state;
      const newSquares = [...state.data.squares];
      const [moved] = newSquares.splice(fromIndex, 1);
      if (!moved) return state;
      newSquares.splice(toIndex, 0, moved);

      const newGroups = state.data.groups
        .map((g) => {
          let { start, nbSquares } = g;
          const gEnd = start + nbSquares;

          const fromInGroup = fromIndex >= start && fromIndex < gEnd;

          // Phase 1: removal at fromIndex
          if (fromInGroup) {
            nbSquares--;
          } else if (fromIndex < start) {
            start--;
          }

          // Phase 2: insertion at toIndex (relative to post-removal array)
          const newGEnd = start + nbSquares;
          if (toIndex > start && toIndex < newGEnd) {
            // Inserted strictly inside this group
            nbSquares++;
          } else if (toIndex <= start) {
            // Inserted before or at group start
            start++;
          }
          // toIndex >= newGEnd: inserted at end or after — no change

          return { start, nbSquares, repeatCount: g.repeatCount };
        })
        .filter((g) => g.nbSquares > 0);

      return {
        data: { squares: newSquares, groups: newGroups },
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
      const gi = findGroupForSquare(state.data.groups, squareIndex);
      if (gi === -1) return state;
      const group = state.data.groups[gi];
      if (!group) return state;
      const splitOffset = squareIndex - group.start;
      if (splitOffset <= 0 || splitOffset >= group.nbSquares) return state;

      const newGroups = [...state.data.groups];
      newGroups.splice(
        gi,
        1,
        {
          start: group.start,
          nbSquares: splitOffset,
          repeatCount: group.repeatCount,
        },
        {
          start: group.start + splitOffset,
          nbSquares: group.nbSquares - splitOffset,
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
      const prev = state.data.groups[groupIndex - 1];
      const curr = state.data.groups[groupIndex];
      if (!prev || !curr) return state;

      const mergedStart = prev.start;
      const mergedEnd = curr.start + curr.nbSquares;

      const newGroups = [...state.data.groups];
      newGroups.splice(groupIndex - 1, 2, {
        start: mergedStart,
        nbSquares: mergedEnd - mergedStart,
        repeatCount: prev.repeatCount,
      });
      return {
        data: { ...state.data, groups: newGroups },
        isDirty: true,
      };
    }),

  deleteGroup: (groupIndex) =>
    set((state) => {
      if (groupIndex < 0 || groupIndex >= state.data.groups.length)
        return state;
      const newGroups = state.data.groups.filter((_, i) => i !== groupIndex);
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

      const rangeStart = startIndex;
      const rangeEnd = endIndex + 1; // exclusive

      // Adjust existing groups that overlap the new range
      const adjusted: GridData["groups"] = [];
      for (const g of state.data.groups) {
        const gEnd = g.start + g.nbSquares;

        if (gEnd <= rangeStart || g.start >= rangeEnd) {
          adjusted.push(g);
          continue;
        }

        if (g.start < rangeStart) {
          adjusted.push({
            start: g.start,
            nbSquares: rangeStart - g.start,
            repeatCount: g.repeatCount,
          });
        }
        if (gEnd > rangeEnd) {
          adjusted.push({
            start: rangeEnd,
            nbSquares: gEnd - rangeEnd,
            repeatCount: g.repeatCount,
          });
        }
      }

      adjusted.push({
        start: rangeStart,
        nbSquares: rangeEnd - rangeStart,
        repeatCount: 1,
      });
      adjusted.sort((a, b) => a.start - b.start);

      return {
        data: { ...state.data, groups: adjusted },
        isDirty: true,
      };
    }),
}));

import { create } from "zustand";

export interface SquarePosition {
  line: number;
  square: number;
}

export const SQUARES_PER_LINE = 4;

function posKey(line: number, square: number): string {
  return `${line}-${square}`;
}

function lineFromKey(key: string): number {
  return Number(key.slice(0, key.indexOf("-")));
}

function toFlatIndex(pos: SquarePosition): number {
  return pos.line * SQUARES_PER_LINE + pos.square;
}

function fromFlatIndex(index: number): SquarePosition {
  return {
    line: Math.floor(index / SQUARES_PER_LINE),
    square: index % SQUARES_PER_LINE,
  };
}

interface SquareSelectionState {
  selected: Set<string>;
  anchor: SquarePosition | null;
}

interface SquareSelectionActions {
  isSelected: (line: number, square: number) => boolean;
  hasSelection: () => boolean;
  clearSelection: () => void;
  handleSquareClick: (
    line: number,
    square: number,
    metaKey: boolean,
    shiftKey: boolean,
    totalSquares: number,
  ) => boolean;
  selectedLineRange: () => { startLine: number; endLine: number } | null;
}

export type SquareSelectionStore = SquareSelectionState &
  SquareSelectionActions;

export const useSquareSelectionStore = create<SquareSelectionStore>(
  (set, get) => ({
    selected: new Set<string>(),
    anchor: null,

    isSelected: (line, square) => get().selected.has(posKey(line, square)),

    hasSelection: () => get().selected.size > 0,

    clearSelection: () => set({ selected: new Set(), anchor: null }),

    handleSquareClick: (line, square, metaKey, shiftKey, totalSquares) => {
      if (metaKey) {
        const key = posKey(line, square);
        set((state) => {
          const next = new Set(state.selected);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }
          return { selected: next, anchor: { line, square } };
        });
        return true;
      }

      const { anchor } = get();
      if (shiftKey && anchor) {
        const anchorFlat = toFlatIndex(anchor);
        const targetFlat = toFlatIndex({ line, square });
        const start = Math.min(anchorFlat, targetFlat);
        const end = Math.max(anchorFlat, targetFlat);

        const next = new Set<string>();
        for (let i = start; i <= end && i < totalSquares; i++) {
          const pos = fromFlatIndex(i);
          next.add(posKey(pos.line, pos.square));
        }
        set({ selected: next });
        return true;
      }

      return false;
    },

    selectedLineRange: () => {
      const { selected } = get();
      if (selected.size === 0) return null;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const key of selected) {
        const line = lineFromKey(key);
        if (line < min) min = line;
        if (line > max) max = line;
      }
      return { startLine: min, endLine: max };
    },
  }),
);

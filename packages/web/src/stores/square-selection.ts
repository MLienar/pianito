import { create } from "zustand";

interface SquareSelectionState {
  selected: Set<number>;
  anchor: number | null;
}

interface SquareSelectionActions {
  isSelected: (index: number) => boolean;
  hasSelection: () => boolean;
  clearSelection: () => void;
  handleSquareClick: (
    index: number,
    metaKey: boolean,
    shiftKey: boolean,
    totalSquares: number,
  ) => boolean;
  selectedRange: () => { start: number; end: number } | null;
}

export type SquareSelectionStore = SquareSelectionState &
  SquareSelectionActions;

export const useSquareSelectionStore = create<SquareSelectionStore>(
  (set, get) => ({
    selected: new Set<number>(),
    anchor: null,

    isSelected: (index) => get().selected.has(index),

    hasSelection: () => get().selected.size > 0,

    clearSelection: () => set({ selected: new Set(), anchor: null }),

    handleSquareClick: (index, metaKey, shiftKey, totalSquares) => {
      if (metaKey) {
        set((state) => {
          const next = new Set(state.selected);
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
          return { selected: next, anchor: index };
        });
        return true;
      }

      const { anchor } = get();
      if (shiftKey && anchor !== null) {
        const start = Math.min(anchor, index);
        const end = Math.max(anchor, index);

        const next = new Set<number>();
        for (let i = start; i <= end && i < totalSquares; i++) {
          next.add(i);
        }
        set({ selected: next });
        return true;
      }

      return false;
    },

    selectedRange: () => {
      const { selected } = get();
      if (selected.size === 0) return null;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const idx of selected) {
        if (idx < min) min = idx;
        if (idx > max) max = idx;
      }
      return { start: min, end: max };
    },
  }),
);

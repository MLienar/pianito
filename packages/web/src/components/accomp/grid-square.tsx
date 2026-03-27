import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { transposeChord } from "@/lib/utils";
import { useGridEditorStore } from "@/stores/grid-editor";
import { useSquareSelectionStore } from "@/stores/square-selection";
import { ChordSearch } from "./chord-search";

const RESIZE_DRAG_THRESHOLD_PX = 30;

export interface GridSquareProps {
  chord: string | null;
  nbBeats: number;
  maxBeats: number;
  isPlaying: boolean;
  index: number;
  totalSquares: number;
  onSetChord: (chord: string) => void;
  onClear: () => void;
  onSetBeats: (nbBeats: number) => void;
  groupColor?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  onAutoFocusConsumed?: () => void;
}

export function GridSquare({
  chord,
  nbBeats,
  maxBeats,
  isPlaying,
  index,
  totalSquares,
  onSetChord,
  onClear,
  onSetBeats,
  groupColor,
  readOnly,
  autoFocus,
  onAutoFocusConsumed,
}: GridSquareProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isSelected = useSquareSelectionStore((s) => s.selected.has(index));
  const handleSquareClick =
    useSquareSelectionStore.getState().handleSquareClick;

  const transpose = useGridEditorStore((s) => s.transpose);
  const displayChord = chord ? transposeChord(chord, transpose) : null;

  useEffect(() => {
    if (autoFocus && !readOnly) {
      setSearchOpen(true);
      onAutoFocusConsumed?.();
    }
  }, [autoFocus, readOnly, onAutoFocusConsumed]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (readOnly) return;
      const handled = handleSquareClick(
        index,
        e.metaKey || e.ctrlKey,
        e.shiftKey,
        totalSquares,
      );
      if (!handled) {
        setSearchOpen((prev) => !prev);
      }
    },
    [handleSquareClick, index, totalSquares, readOnly],
  );

  const dragStartX = useRef(0);
  const dragStartBeats = useRef(nbBeats);
  const lastAppliedBeats = useRef(nbBeats);

  const handleResizePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartBeats.current = nbBeats;
      lastAppliedBeats.current = nbBeats;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
    },
    [nbBeats],
  );

  const handleResizePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const delta = e.clientX - dragStartX.current;
      const beatDelta = Math.round(delta / RESIZE_DRAG_THRESHOLD_PX);
      const newBeats = Math.max(
        1,
        Math.min(maxBeats, dragStartBeats.current + beatDelta),
      );
      if (newBeats !== lastAppliedBeats.current) {
        onSetBeats(newBeats);
        lastAppliedBeats.current = newBeats;
      }
    },
    [onSetBeats, maxBeats],
  );

  const handleResizePointerUp = useCallback((e: ReactPointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      className="relative"
      {...(index === 0 ? { "data-tour": "grid-square" } : {})}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-20 w-full items-center justify-center border-3 text-lg font-bold transition-all ${
          isSelected
            ? "border-primary bg-primary/20 ring-2 ring-primary"
            : isPlaying
              ? "bg-primary text-primary-foreground shadow-[var(--shadow-brutal)] border-border"
              : displayChord
                ? "bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] border-border"
                : "bg-background text-muted-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] border-border"
        }`}
        style={
          groupColor && !isSelected ? { borderColor: groupColor } : undefined
        }
      >
        {displayChord ?? t("accomp.emptySquare")}
      </button>
      {!readOnly && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          {...(index === 0 ? { "data-tour": "resize-handle" } : {})}
          className="absolute top-0 right-0 bottom-0 z-10 w-2 cursor-col-resize opacity-0 hover:opacity-100 hover:bg-primary/30 transition-opacity"
        />
      )}
      {!readOnly && (
        <ChordSearch
          open={searchOpen}
          currentChord={chord}
          onSelect={onSetChord}
          onClear={onClear}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}

import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSquareSelectionStore } from "@/stores/square-selection";
import { ChordSearch } from "./chord-search";

const RESIZE_DRAG_THRESHOLD_PX = 30;

export interface GridSquareProps {
  chord: string | null;
  nbBeats: number;
  isPlaying: boolean;
  index: number;
  totalSquares: number;
  onSetChord: (chord: string) => void;
  onClear: () => void;
  onSetBeats: (nbBeats: 2 | 4) => void;
  groupColor?: string;
  autoFocus?: boolean;
  onAutoFocusConsumed?: () => void;
}

export function GridSquare({
  chord,
  nbBeats,
  isPlaying,
  index,
  totalSquares,
  onSetChord,
  onClear,
  onSetBeats,
  groupColor,
  autoFocus,
  onAutoFocusConsumed,
}: GridSquareProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isSelected = useSquareSelectionStore((s) => s.selected.has(index));
  const handleSquareClick =
    useSquareSelectionStore.getState().handleSquareClick;

  useEffect(() => {
    if (autoFocus) {
      setSearchOpen(true);
      onAutoFocusConsumed?.();
    }
  }, [autoFocus, onAutoFocusConsumed]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
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
    [handleSquareClick, index, totalSquares],
  );

  const dragStartX = useRef(0);
  const dragStartBeats = useRef(nbBeats);
  const dragApplied = useRef(false);

  const handleResizePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragStartX.current = e.clientX;
      dragStartBeats.current = nbBeats;
      dragApplied.current = false;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
    },
    [nbBeats],
  );

  const handleResizePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (
        dragApplied.current ||
        !e.currentTarget.hasPointerCapture(e.pointerId)
      )
        return;
      const delta = e.clientX - dragStartX.current;
      if (dragStartBeats.current === 4 && delta < -RESIZE_DRAG_THRESHOLD_PX) {
        onSetBeats(2);
        dragApplied.current = true;
      } else if (
        dragStartBeats.current === 2 &&
        delta > RESIZE_DRAG_THRESHOLD_PX
      ) {
        onSetBeats(4);
        dragApplied.current = true;
      }
    },
    [onSetBeats],
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
              : chord
                ? "bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] border-border"
                : "bg-background text-muted-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] border-border"
        }`}
        style={
          groupColor && !isSelected ? { borderColor: groupColor } : undefined
        }
      >
        {chord ?? t("accomp.emptySquare")}
      </button>
      <div
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        {...(index === 0 ? { "data-tour": "resize-handle" } : {})}
        className="absolute top-0 right-0 bottom-0 z-10 w-2 cursor-col-resize opacity-0 hover:opacity-100 hover:bg-primary/30 transition-opacity"
      />
      <ChordSearch
        open={searchOpen}
        currentChord={chord}
        onSelect={onSetChord}
        onClear={onClear}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}

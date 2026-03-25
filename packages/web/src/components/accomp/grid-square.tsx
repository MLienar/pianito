import { type MouseEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSquareSelectionStore } from "@/stores/square-selection";
import { ChordSearch } from "./chord-search";

interface GridSquareProps {
  chord: string | null;
  isPlaying: boolean;
  index: number;
  totalSquares: number;
  onSetChord: (chord: string) => void;
  onClear: () => void;
  groupColor?: string;
}

export function GridSquare({
  chord,
  isPlaying,
  index,
  totalSquares,
  onSetChord,
  onClear,
  groupColor,
}: GridSquareProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isSelected = useSquareSelectionStore((s) => s.selected.has(index));
  const handleSquareClick =
    useSquareSelectionStore.getState().handleSquareClick;

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

  return (
    <div className="relative">
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

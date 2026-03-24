import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChordSearch } from "./chord-search";

interface GridSquareProps {
  chord: string | null;
  isPlaying: boolean;
  onSetChord: (chord: string) => void;
  onClear: () => void;
}

export function GridSquare({
  chord,
  isPlaying,
  onSetChord,
  onClear,
}: GridSquareProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleClick = useCallback(() => {
    setSearchOpen((prev) => !prev);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-20 w-full items-center justify-center border-3 border-border text-lg font-bold transition-all ${
          isPlaying
            ? "bg-primary text-primary-foreground shadow-[var(--shadow-brutal)]"
            : chord
              ? "bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
              : "bg-background text-muted-foreground hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
        }`}
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

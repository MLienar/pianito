import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ROOTS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
];

const QUALITIES = [
  "",
  "m",
  "7",
  "maj7",
  "m7",
  "dim",
  "aug",
  "m7b5",
  "dim7",
  "6",
  "m6",
  "9",
  "m9",
  "sus2",
  "sus4",
];

const ALL_CHORDS = ROOTS.flatMap((root) => QUALITIES.map((q) => `${root}${q}`));
const ALL_CHORDS_LOWER = ALL_CHORDS.map((c) => c.toLowerCase());

interface ChordSearchProps {
  open: boolean;
  currentChord: string | null;
  onSelect: (chord: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ChordSearch({
  open,
  currentChord,
  onSelect,
  onClear,
  onClose,
}: ChordSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(currentChord ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(currentChord ?? "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, currentChord]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (query.trim() === "") return ALL_CHORDS.slice(0, 30);
    const q = query.toLowerCase();
    const results: string[] = [];
    for (let i = 0; i < ALL_CHORDS_LOWER.length && results.length < 30; i++) {
      const chord = ALL_CHORDS[i];
      if (chord && ALL_CHORDS_LOWER[i]?.startsWith(q)) {
        results.push(chord);
      }
    }
    return results;
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        const first = filtered[0];
        if (first) {
          onSelect(first);
          onClose();
        }
      }
    },
    [filtered, onSelect, onClose],
  );

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 z-50 mt-1 w-56 border-3 border-border bg-card shadow-[var(--shadow-brutal)]"
    >
      <div className="flex items-center gap-1 border-b-3 border-border p-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("accomp.searchChord")}
          className="flex-1 bg-transparent px-2 py-1 text-sm font-bold focus:outline-none"
        />
        {currentChord && (
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="border-2 border-border bg-background px-2 py-0.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {t("accomp.clearChord")}
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        {filtered.map((chord) => (
          <button
            key={chord}
            type="button"
            onClick={() => {
              onSelect(chord);
              onClose();
            }}
            className={`w-full px-3 py-1.5 text-left text-sm font-bold transition-colors hover:bg-primary hover:text-primary-foreground ${
              chord === currentChord ? "bg-primary/20" : ""
            }`}
          >
            {chord}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {t("accomp.noResults")}
          </p>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StyleId } from "@/lib/styles";
import { STYLE_IDS } from "@/lib/styles";
import { useGridEditorStore } from "@/stores/grid-editor";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isSaving: boolean;
  metronome: boolean;
  style: StyleId | null;
  swing: number;
  onMetronomeToggle: () => void;
  onStyleChange: (id: StyleId | null) => void;
  onSwingChange: (value: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
}

export function PlaybackControls({
  isPlaying,
  isSaving,
  metronome,
  style,
  swing,
  onMetronomeToggle,
  onStyleChange,
  onSwingChange,
  onPlay,
  onStop,
  onSave,
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  const tempo = useGridEditorStore((s) => s.tempo);
  const loopCount = useGridEditorStore((s) => s.loopCount);
  const isDirty = useGridEditorStore((s) => s.isDirty);
  const updateTempo = useGridEditorStore((s) => s.updateTempo);
  const clampTempo = useGridEditorStore((s) => s.clampTempo);
  const updateLoopCount = useGridEditorStore((s) => s.updateLoopCount);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold" htmlFor="tempo">
          {t("accomp.tempo")}
        </label>
        <input
          id="tempo"
          type="number"
          min={30}
          max={300}
          value={tempo}
          onChange={(e) => updateTempo(Number(e.target.value))}
          onBlur={clampTempo}
          disabled={isPlaying}
          className="w-20 border-3 border-border bg-background px-2 py-1 text-center font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <span className="text-xs text-muted-foreground">{t("accomp.bpm")}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-bold" htmlFor="loops">
          {t("accomp.loopCount")}
        </label>
        <input
          id="loops"
          type="number"
          min={1}
          max={50}
          value={loopCount}
          onChange={(e) => updateLoopCount(Number(e.target.value))}
          disabled={isPlaying}
          className="w-16 border-3 border-border bg-background px-2 py-1 text-center font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        onClick={onMetronomeToggle}
        className={`border-3 border-border px-4 py-1.5 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
          metronome
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {t("accomp.metronome")}
      </button>

      <StyleSelect
        style={style}
        disabled={isPlaying}
        onStyleChange={onStyleChange}
      />

      <div className="flex items-center gap-2">
        <label className="text-sm font-bold" htmlFor="swing">
          {t("accomp.swing")}
        </label>
        <div className="relative flex items-center">
          <input
            id="swing"
            type="range"
            min={0}
            max={100}
            value={Math.round(swing * 100)}
            onChange={(e) => onSwingChange(Number(e.target.value) / 100)}
            disabled={isPlaying}
            className="brutal-range h-2 w-24 cursor-pointer appearance-none border-2 border-border bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <span className="min-w-8 border-3 border-border bg-background px-1.5 py-0.5 text-center font-mono text-xs font-bold">
          {Math.round(swing * 100)}%
        </span>
      </div>

      <button
        type="button"
        onClick={isPlaying ? onStop : onPlay}
        className={`border-3 border-border px-4 py-1.5 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
          isPlaying
            ? "bg-destructive text-destructive-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {isPlaying ? t("accomp.stop") : t("accomp.play")}
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={!isDirty || isSaving}
        className="border-3 border-border bg-primary px-4 py-1.5 font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
      >
        {isSaving
          ? t("accomp.saving")
          : isDirty
            ? t("accomp.save")
            : t("accomp.saved")}
      </button>
    </div>
  );
}

function StyleSelect({
  style,
  disabled,
  onStyleChange,
}: {
  style: StyleId | null;
  disabled: boolean;
  onStyleChange: (id: StyleId | null) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const options: { value: StyleId | null; label: string }[] = [
    { value: null, label: t("accomp.styleOff") },
    ...STYLE_IDS.map((id) => ({ value: id, label: t(`accomp.styles.${id}`) })),
  ];

  const selectedLabel =
    options.find((o) => o.value === style)?.label ?? t("accomp.styleOff");

  const select = useCallback(
    (value: StyleId | null) => {
      onStyleChange(value);
      setOpen(false);
    },
    [onStyleChange],
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(
          Math.max(
            0,
            options.findIndex((o) => o.value === style),
          ),
        );
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) {
          select(options[focusedIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold">{t("accomp.style")}</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 border-3 border-border bg-background py-1.5 pr-8 pl-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {selectedLabel}
          <span className="pointer-events-none absolute right-2 text-xs font-bold">
            ▼
          </span>
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute top-full left-0 z-50 mt-1 min-w-full border-3 border-border bg-background shadow-[var(--shadow-brutal)]"
          >
            {options.map((option, i) => (
              <li
                key={option.value ?? "off"}
                role="option"
                aria-selected={option.value === style}
                onMouseDown={() => select(option.value)}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`cursor-pointer px-3 py-1.5 text-sm font-bold whitespace-nowrap ${
                  option.value === style
                    ? "bg-accent text-accent-foreground"
                    : i === focusedIndex
                      ? "bg-muted"
                      : "bg-background hover:bg-muted"
                }`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

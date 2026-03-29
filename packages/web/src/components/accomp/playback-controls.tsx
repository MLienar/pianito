import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/tooltip";
import type { StyleId } from "@/lib/styles";
import { STYLE_IDS } from "@/lib/styles";
import { useGridEditorStore } from "@/stores/grid-editor";
import { TimeSignatureSelect } from "./time-signature-select";

/* ─── Neobrutalist SVG Icons ─── */

function IconMetronome({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M12 2L7 22h10L12 2z" />
      <path d="M12 18V8" />
      <path d="M12 8l5-3" />
    </svg>
  );
}

function IconKeyboard({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <rect x="2" y="6" width="20" height="12" />
      <line x1="6" y1="6" x2="6" y2="14" />
      <line x1="10" y1="6" x2="10" y2="14" />
      <line x1="14" y1="6" x2="14" y2="14" />
      <line x1="18" y1="6" x2="18" y2="14" />
      <line x1="2" y1="14" x2="22" y2="14" />
    </svg>
  );
}

function IconBass({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M6 4v16" />
      <path d="M6 4h4c3 0 5 2 5 5s-2 5-5 5H6" />
      <circle cx="18" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconDrums({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <ellipse cx="12" cy="14" rx="9" ry="4" />
      <path d="M3 14V10c0-2.2 4-4 9-4s9 1.8 9 4v4" />
      <line x1="7" y1="2" x2="11" y2="10" />
      <line x1="17" y1="2" x2="13" y2="10" />
    </svg>
  );
}

/* ─── Instrument Toggle Button ─── */

function InstrumentToggle({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`border-3 border-border p-1.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] active:translate-y-0 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none ${
          active
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </button>
    </Tooltip>
  );
}

/* ─── Settings Row ─── */

interface SettingsProps {
  isPlaying: boolean;
  metronome: boolean;
  chordsEnabled: boolean;
  bassEnabled: boolean;
  drumsEnabled: boolean;
  style: StyleId | null;
  swing: number;
  onMetronomeToggle: () => void;
  onChordsToggle: () => void;
  onBassToggle: () => void;
  onDrumsToggle: () => void;
  onStyleChange: (id: StyleId | null) => void;
  onSwingChange: (value: number) => void;
}

export function SettingsControls({
  isPlaying,
  metronome,
  chordsEnabled,
  bassEnabled,
  drumsEnabled,
  style,
  swing,
  onMetronomeToggle,
  onChordsToggle,
  onBassToggle,
  onDrumsToggle,
  onStyleChange,
  onSwingChange,
}: SettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div data-tour="instrument-toggles" className="flex items-center gap-1">
        <InstrumentToggle
          active={metronome}
          onClick={onMetronomeToggle}
          icon={<IconMetronome />}
          label={t("accomp.metronome")}
        />
        <InstrumentToggle
          active={chordsEnabled}
          onClick={onChordsToggle}
          icon={<IconKeyboard />}
          label={t("accomp.chords")}
        />
        <InstrumentToggle
          active={bassEnabled}
          onClick={onBassToggle}
          icon={<IconBass />}
          label={t("accomp.bass")}
        />
        <InstrumentToggle
          active={drumsEnabled}
          onClick={onDrumsToggle}
          icon={<IconDrums />}
          label={t("accomp.drums")}
        />
      </div>

      <StyleSelect
        style={style}
        disabled={isPlaying}
        onStyleChange={onStyleChange}
      />

      <div data-tour="swing" className="flex items-center gap-1.5">
        <label className="text-xs font-bold" htmlFor="swing">
          {t("accomp.swing")}
        </label>
        <input
          id="swing"
          type="range"
          min={0}
          max={100}
          value={Math.round(swing * 100)}
          onChange={(e) => onSwingChange(Number(e.target.value) / 100)}
          disabled={isPlaying}
          className="brutal-range h-1.5 w-16 cursor-pointer appearance-none border-2 border-border bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="border-2 border-border bg-background px-1 py-0.5 text-center font-mono text-[10px] font-bold leading-none">
          {Math.round(swing * 100)}%
        </span>
      </div>
    </div>
  );
}

/* ─── Playback Row ─── */

interface PlaybackProps {
  isPlaying: boolean;
  isCountingDown: boolean;
  countdownNumber: number | null;
  isSaving: boolean;
  readOnly?: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
}

export function PlaybackControls({
  isPlaying,
  isCountingDown,
  countdownNumber,
  isSaving,
  readOnly,
  onPlay,
  onStop,
  onSave,
}: PlaybackProps) {
  const { t } = useTranslation();
  const tempo = useGridEditorStore((s) => s.tempo);
  const loopCount = useGridEditorStore((s) => s.loopCount);
  const timeSignature = useGridEditorStore((s) => s.timeSignature);
  const isDirty = useGridEditorStore((s) => s.isDirty);
  const updateTempo = useGridEditorStore((s) => s.updateTempo);
  const clampTempo = useGridEditorStore((s) => s.clampTempo);
  const updateLoopCount = useGridEditorStore((s) => s.updateLoopCount);
  const updateTimeSignature = useGridEditorStore((s) => s.updateTimeSignature);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <TimeSignatureSelect
        value={timeSignature}
        disabled={isPlaying || !!readOnly}
        onChange={updateTimeSignature}
      />

      <div data-tour="tempo" className="flex items-center gap-2">
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

      <div data-tour="loops" className="flex items-center gap-2">
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
        data-tour="play-button"
        onClick={isPlaying || isCountingDown ? onStop : onPlay}
        disabled={isCountingDown}
        className={`border-3 border-border px-4 py-1.5 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none disabled:translate-y-0 disabled:shadow-none ${
          isPlaying
            ? "bg-destructive text-destructive-foreground"
            : isCountingDown
              ? "bg-muted text-muted-foreground"
              : "bg-accent text-accent-foreground"
        }`}
      >
        {isCountingDown
          ? countdownNumber
          : isPlaying
            ? t("accomp.stop")
            : t("accomp.play")}
      </button>

      {!readOnly && (
        <button
          type="button"
          data-tour="save-button"
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
      )}
    </div>
  );
}

/* ─── Style Select Dropdown ─── */

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
    <div data-tour="style-select" className="flex items-center gap-1.5">
      <span className="text-xs font-bold">{t("accomp.style")}</span>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 border-3 border-border bg-background py-1 pr-7 pl-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {selectedLabel}
          <span className="pointer-events-none absolute right-1.5 text-[10px] font-bold">
            ▼
          </span>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute top-full left-0 z-50 mt-1 min-w-full border-3 border-border bg-background shadow-[var(--shadow-brutal)]"
          >
            {options.map((option, i) => (
              <div
                key={option.value ?? "off"}
                role="option"
                tabIndex={0}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

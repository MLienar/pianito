import { useTranslation } from "react-i18next";
import type { DrumPatternId } from "@/lib/drum-patterns";
import { DRUM_PATTERN_IDS, isDrumPatternId } from "@/lib/drum-patterns";
import { useGridEditorStore } from "@/stores/grid-editor";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isSaving: boolean;
  metronome: boolean;
  drumPattern: DrumPatternId | null;
  onMetronomeToggle: () => void;
  onDrumPatternChange: (id: DrumPatternId | null) => void;
  onPlay: () => void;
  onStop: () => void;
  onSave: () => void;
}

export function PlaybackControls({
  isPlaying,
  isSaving,
  metronome,
  drumPattern,
  onMetronomeToggle,
  onDrumPatternChange,
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

      <select
        value={drumPattern ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          onDrumPatternChange(isDrumPatternId(value) ? value : null);
        }}
        disabled={isPlaying}
        className="border-3 border-border bg-background px-2 py-1.5 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">{t("accomp.drumsOff")}</option>
        {DRUM_PATTERN_IDS.map((id) => (
          <option key={id} value={id}>
            {t(`accomp.drums.${id}`)}
          </option>
        ))}
      </select>

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

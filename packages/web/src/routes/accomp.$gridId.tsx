import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GridView } from "@/components/accomp/grid-view";
import {
  PlaybackControls,
  SettingsControls,
} from "@/components/accomp/playback-controls";
import { SelectionToolbar } from "@/components/accomp/selection-toolbar";
import { useGridEditor } from "@/hooks/use-grid-editor";
import { useGridPlayback } from "@/hooks/use-grid-playback";
import { useGridEditorStore } from "@/stores/grid-editor";
import { useSquareSelectionStore } from "@/stores/square-selection";

export const Route = createFileRoute("/accomp/$gridId")({
  component: GridEditor,
});

function GridEditor() {
  const { gridId } = Route.useParams();
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { isLoading, isSaving, error, save } = useGridEditor(gridId);

  const name = useGridEditorStore((s) => s.name);
  const tempo = useGridEditorStore((s) => s.tempo);
  const loopCount = useGridEditorStore((s) => s.loopCount);
  const data = useGridEditorStore((s) => s.data);
  const updateName = useGridEditorStore((s) => s.updateName);
  const groupSquares = useGridEditorStore((s) => s.groupSquares);

  const playback = useGridPlayback(data, tempo, loopCount);

  const selectedSize = useSquareSelectionStore((s) => s.selected.size);
  const clearSelection = useSquareSelectionStore((s) => s.clearSelection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useSquareSelectionStore.getState().clearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
    }
  }, [editingName]);

  const handleNameBlur = useCallback(() => {
    setEditingName(false);
    if (useGridEditorStore.getState().name.trim() === "") {
      updateName(t("accomp.untitled"));
    }
  }, [updateName, t]);

  const handleGroup = useCallback(() => {
    const range = useSquareSelectionStore.getState().selectedRange();
    if (!range) return;
    groupSquares(range.start, range.end);
    clearSelection();
  }, [groupSquares, clearSelection]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 py-8">
        <p className="text-destructive">{t("accomp.loadError")}</p>
        <Link to="/accomp" className="font-bold text-primary underline">
          {t("accomp.title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="-mx-4 border-3 border-border bg-card px-4 py-4 shadow-[var(--shadow-brutal-sm)] sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/accomp"
            className="border-3 border-border bg-background px-3 py-1 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
          >
            ←
          </Link>
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameBlur();
              }}
              className="border-b-3 border-border bg-transparent text-2xl font-bold tracking-tight focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-2xl font-bold tracking-tight hover:text-primary"
            >
              {name}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PlaybackControls
            isPlaying={playback.isPlaying}
            isSaving={isSaving}
            onPlay={playback.play}
            onStop={playback.stop}
            onSave={save}
          />

          <SettingsControls
            isPlaying={playback.isPlaying}
            metronome={playback.metronome}
            chordsEnabled={playback.chordsEnabled}
            bassEnabled={playback.bassEnabled}
            drumsEnabled={playback.drumsEnabled}
            style={playback.style}
            swing={playback.swing}
            onMetronomeToggle={playback.toggleMetronome}
            onChordsToggle={playback.toggleChords}
            onBassToggle={playback.toggleBass}
            onDrumsToggle={playback.toggleDrums}
            onStyleChange={playback.selectStyle}
            onSwingChange={playback.setSwing}
          />
        </div>
      </div>

      <GridView playingIndex={playback.currentIndex} />

      {selectedSize > 0 && (
        <SelectionToolbar
          selectionCount={selectedSize}
          onGroup={handleGroup}
          onClearSelection={clearSelection}
        />
      )}
    </div>
  );
}

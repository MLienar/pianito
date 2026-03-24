import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GridView } from "@/components/accomp/grid-view";
import { PlaybackControls } from "@/components/accomp/playback-controls";
import { SelectionToolbar } from "@/components/accomp/selection-toolbar";
import { useGridEditor } from "@/hooks/use-grid-editor";
import { useGridPlayback } from "@/hooks/use-grid-playback";
import { useSquareSelectionStore } from "@/stores/square-selection";

export const Route = createFileRoute("/accomp/$gridId")({
  component: GridEditor,
});

function GridEditor() {
  const { gridId } = Route.useParams();
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const editor = useGridEditor(gridId);
  const playback = useGridPlayback(editor.data, editor.tempo, editor.loopCount);

  const selectedSize = useSquareSelectionStore((s) => s.selected.size);
  const clearSelection = useSquareSelectionStore((s) => s.clearSelection);
  const selectedLineRange = useSquareSelectionStore((s) => s.selectedLineRange);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        useSquareSelectionStore.getState().selected.size > 0
      ) {
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
    if (editor.name.trim() === "") {
      editor.updateName(t("accomp.untitled"));
    }
  }, [editor, t]);

  const handleGroup = useCallback(() => {
    const range = selectedLineRange();
    if (!range) return;
    editor.groupLines(range.startLine, range.endLine);
    clearSelection();
  }, [selectedLineRange, editor, clearSelection]);

  if (editor.isLoading) {
    return (
      <div className="flex flex-col gap-8 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (editor.error) {
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
      <div className="flex items-center gap-4">
        <Link
          to="/accomp"
          className="border-3 border-border bg-card px-3 py-1 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
        >
          ←
        </Link>
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editor.name}
            onChange={(e) => editor.updateName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameBlur();
            }}
            className="border-b-3 border-border bg-transparent text-3xl font-bold tracking-tight focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-3xl font-bold tracking-tight hover:text-primary"
          >
            {editor.name}
          </button>
        )}
      </div>

      <PlaybackControls
        tempo={editor.tempo}
        loopCount={editor.loopCount}
        isPlaying={playback.isPlaying}
        isDirty={editor.isDirty}
        isSaving={editor.isSaving}
        onTempoChange={editor.updateTempo}
        onTempoBlur={editor.clampTempo}
        onLoopCountChange={editor.updateLoopCount}
        onPlay={playback.play}
        onStop={playback.stop}
        onSave={editor.save}
      />

      <GridView
        data={editor.data}
        playingPosition={playback.currentPosition}
        onSetChord={editor.setChord}
        onClearChord={editor.clearChord}
        onRemoveLine={editor.removeLine}
        onReorderLines={editor.reorderLines}
        onReorderSquares={editor.reorderSquares}
        onAddLine={editor.addLine}
        onUpdateGroupRepeatCount={editor.updateGroupRepeatCount}
        onSplitGroup={editor.splitGroup}
        onMergeWithPreviousGroup={editor.mergeWithPreviousGroup}
      />

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

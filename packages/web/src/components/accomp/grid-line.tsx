import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GridLine as GridLineType } from "@pianito/shared";
import { type HTMLAttributes, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GridSquare } from "./grid-square";

interface GridLineProps {
  line: GridLineType;
  lineIndex: number;
  totalLines: number;
  playingSquareIndex: number | null;
  canRemove: boolean;
  onSetChord: (squareIndex: number, chord: string) => void;
  onClearChord: (squareIndex: number) => void;
  onRemoveLine: () => void;
  onReorderSquares: (fromIndex: number, toIndex: number) => void;
  dragHandleProps?: HTMLAttributes<HTMLElement>;
}

export function GridLine({
  line,
  lineIndex,
  totalLines,
  playingSquareIndex,
  canRemove,
  onSetChord,
  onClearChord,
  onRemoveLine,
  onReorderSquares,
  dragHandleProps,
}: GridLineProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const squareIds = useMemo(
    () => line.map((_, i) => `sq-${lineIndex}-${i}`),
    [lineIndex, line],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = squareIds.indexOf(String(active.id));
      const toIndex = squareIds.indexOf(String(over.id));
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorderSquares(fromIndex, toIndex);
      }
    },
    [squareIds, onReorderSquares],
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex w-8 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground"
        title={t("accomp.dragToReorder")}
        {...dragHandleProps}
      >
        ⠿
      </button>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={squareIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid flex-1 grid-cols-4 gap-2">
            {line.map((square, squareIndex) => (
              <SortableSquareWrapper
                key={squareIds[squareIndex]}
                id={squareIds[squareIndex] ?? `sq-${lineIndex}-${squareIndex}`}
                chord={square.chord}
                isPlaying={playingSquareIndex === squareIndex}
                lineIndex={lineIndex}
                squareIndex={squareIndex}
                totalLines={totalLines}
                onSetChord={(chord) => onSetChord(squareIndex, chord)}
                onClear={() => onClearChord(squareIndex)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {canRemove && (
        <button
          type="button"
          onClick={onRemoveLine}
          className="flex h-8 w-8 items-center justify-center border-2 border-border bg-card text-xs font-bold text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground"
          title={t("accomp.removeLine")}
        >
          ×
        </button>
      )}
    </div>
  );
}

function SortableSquareWrapper({
  id,
  chord,
  isPlaying,
  lineIndex,
  squareIndex,
  totalLines,
  onSetChord,
  onClear,
}: {
  id: string;
  chord: string | null;
  isPlaying: boolean;
  lineIndex: number;
  squareIndex: number;
  totalLines: number;
  onSetChord: (chord: string) => void;
  onClear: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <GridSquare
        chord={chord}
        isPlaying={isPlaying}
        lineIndex={lineIndex}
        squareIndex={squareIndex}
        totalLines={totalLines}
        onSetChord={onSetChord}
        onClear={onClear}
      />
    </div>
  );
}

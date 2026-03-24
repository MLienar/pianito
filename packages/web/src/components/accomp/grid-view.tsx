import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GridData } from "@pianito/shared";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GridLine } from "./grid-line";

interface GridViewProps {
  data: GridData;
  playingPosition: { line: number; square: number } | null;
  onSetChord: (lineIndex: number, squareIndex: number, chord: string) => void;
  onClearChord: (lineIndex: number, squareIndex: number) => void;
  onRemoveLine: (lineIndex: number) => void;
  onReorderLines: (fromIndex: number, toIndex: number) => void;
  onReorderSquares: (
    lineIndex: number,
    fromIndex: number,
    toIndex: number,
  ) => void;
  onAddLine: () => void;
}

export function GridView({
  data,
  playingPosition,
  onSetChord,
  onClearChord,
  onRemoveLine,
  onReorderLines,
  onReorderSquares,
  onAddLine,
}: GridViewProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const lineIds = useMemo(
    () => data.lines.map((_, i) => `line-${i}`),
    [data.lines],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = lineIds.indexOf(String(active.id));
      const toIndex = lineIds.indexOf(String(over.id));
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorderLines(fromIndex, toIndex);
      }
    },
    [lineIds, onReorderLines],
  );

  return (
    <div className="flex flex-col gap-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lineIds} strategy={verticalListSortingStrategy}>
          {data.lines.map((line, lineIndex) => (
            <SortableLineWrapper
              key={`line-${lineIndex}`}
              id={`line-${lineIndex}`}
              line={line}
              lineIndex={lineIndex}
              playingSquareIndex={
                playingPosition?.line === lineIndex
                  ? playingPosition.square
                  : null
              }
              canRemove={data.lines.length > 1}
              onSetChord={(squareIndex, chord) =>
                onSetChord(lineIndex, squareIndex, chord)
              }
              onClearChord={(squareIndex) =>
                onClearChord(lineIndex, squareIndex)
              }
              onRemoveLine={() => onRemoveLine(lineIndex)}
              onReorderSquares={(from, to) =>
                onReorderSquares(lineIndex, from, to)
              }
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={onAddLine}
        className="ml-10 flex items-center justify-center gap-2 border-3 border-dashed border-border bg-card px-4 py-3 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]"
      >
        + {t("accomp.addLine")}
      </button>
    </div>
  );
}

function SortableLineWrapper({
  id,
  line,
  lineIndex,
  playingSquareIndex,
  canRemove,
  onSetChord,
  onClearChord,
  onRemoveLine,
  onReorderSquares,
}: {
  id: string;
  line: GridViewProps["data"]["lines"][number];
  lineIndex: number;
  playingSquareIndex: number | null;
  canRemove: boolean;
  onSetChord: (squareIndex: number, chord: string) => void;
  onClearChord: (squareIndex: number) => void;
  onRemoveLine: () => void;
  onReorderSquares: (fromIndex: number, toIndex: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GridLine
        line={line}
        lineIndex={lineIndex}
        playingSquareIndex={playingSquareIndex}
        canRemove={canRemove}
        onSetChord={onSetChord}
        onClearChord={onClearChord}
        onRemoveLine={onRemoveLine}
        onReorderSquares={onReorderSquares}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

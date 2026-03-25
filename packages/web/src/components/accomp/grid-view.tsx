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
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useGridEditorStore } from "@/stores/grid-editor";
import { GridSquare, type GridSquareProps } from "./grid-square";
import { getGroupColor } from "./group-colors";

interface GridViewProps {
  playingIndex: number | null;
}

export function GridView({ playingIndex }: GridViewProps) {
  const data = useGridEditorStore((s) => s.data);
  const reorderSquares = useGridEditorStore((s) => s.reorderSquares);
  const setChord = useGridEditorStore((s) => s.setChord);
  const clearChord = useGridEditorStore((s) => s.clearChord);
  const setSquareBeats = useGridEditorStore((s) => s.setSquareBeats);
  const addSquare = useGridEditorStore((s) => s.addSquare);
  const updateGroupRepeatCount = useGridEditorStore(
    (s) => s.updateGroupRepeatCount,
  );
  const deleteGroup = useGridEditorStore((s) => s.deleteGroup);

  const [autoFocusIndex, setAutoFocusIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const squareCount = data.squares.length;
  const squareIds = useMemo(
    () => Array.from({ length: squareCount }, (_, i) => `sq-${i}`),
    [squareCount],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = squareIds.indexOf(String(active.id));
      const toIndex = squareIds.indexOf(String(over.id));
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderSquares(fromIndex, toIndex);
      }
    },
    [squareIds, reorderSquares],
  );

  const handleAddSquare = useCallback(() => {
    const newIndex = useGridEditorStore.getState().data.squares.length;
    addSquare();
    setAutoFocusIndex(newIndex);
  }, [addSquare]);

  const handleAutoFocusConsumed = useCallback(() => {
    setAutoFocusIndex(null);
  }, []);

  const { squareGroupIndex, squareSeparatorInfo } = useMemo(() => {
    const sgIndex: (number | null)[] = new Array(data.squares.length).fill(
      null,
    );
    const sepInfo = new Map<
      number,
      { groupIndex: number; repeatCount: number }
    >();

    for (const [gi, group] of data.groups.entries()) {
      for (let i = 0; i < group.nbSquares; i++) {
        const idx = group.start + i;
        if (idx < data.squares.length) sgIndex[idx] = gi;
      }
      const lastIdx = group.start + group.nbSquares - 1;
      if (lastIdx < data.squares.length) {
        sepInfo.set(lastIdx, {
          groupIndex: gi,
          repeatCount: group.repeatCount,
        });
      }
    }

    return { squareGroupIndex: sgIndex, squareSeparatorInfo: sepInfo };
  }, [data.groups, data.squares.length]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={squareIds} strategy={rectSortingStrategy}>
        <div
          data-tour="grid-container"
          className="grid grid-cols-[repeat(8,1fr)] gap-2"
        >
          {data.squares.map((square, globalIndex) => {
            if (!square) return null;
            const sepInfo = squareSeparatorInfo.get(globalIndex);
            const gi = squareGroupIndex[globalIndex];
            const groupColor = gi !== null ? getGroupColor(gi) : undefined;
            return (
              <SortableSquareWrapper
                key={`sq-${globalIndex}`}
                id={`sq-${globalIndex}`}
                squareProps={{
                  chord: square.chord,
                  nbBeats: square.nbBeats,
                  isPlaying: playingIndex === globalIndex,
                  index: globalIndex,
                  totalSquares: data.squares.length,
                  onSetChord: (chord) => setChord(globalIndex, chord),
                  onClear: () => clearChord(globalIndex),
                  onSetBeats: (nb) => setSquareBeats(globalIndex, nb),
                  groupColor,
                  autoFocus: autoFocusIndex === globalIndex,
                  onAutoFocusConsumed: handleAutoFocusConsumed,
                }}
                separator={
                  sepInfo
                    ? {
                        repeatCount: sepInfo.repeatCount,
                        onRepeatCountChange: (val) =>
                          updateGroupRepeatCount(sepInfo.groupIndex, val),
                        onDelete: () => deleteGroup(sepInfo.groupIndex),
                      }
                    : undefined
                }
              />
            );
          })}
          <button
            type="button"
            data-tour="add-square"
            onClick={handleAddSquare}
            className="col-span-1 flex h-20 w-full items-center justify-center border-3 border-dashed border-border bg-background text-2xl text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-[var(--shadow-brutal)]"
          >
            +
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SeparatorInfo {
  repeatCount: number;
  onRepeatCountChange: (value: number) => void;
  onDelete: () => void;
}

function SortableSquareWrapper({
  id,
  squareProps,
  separator,
}: {
  id: string;
  squareProps: GridSquareProps;
  separator?: SeparatorInfo;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const colSpan = squareProps.nbBeats === 2 ? 1 : 2;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${colSpan}`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative"
    >
      <GridSquare {...squareProps} />
      {separator && (
        <div className="absolute z-10 flex flex-col items-center right-0 top-[50%] translate-x-1/2 -translate-y-1/2 gap-1">
          <div
            className="bg-card border-3 px-1 py-0.5 shadow-[var(--shadow-brutal-sm)]"
            style={{ borderColor: squareProps.groupColor }}
          >
            <input
              type="number"
              min={1}
              max={50}
              value={separator.repeatCount}
              onChange={(e) =>
                separator.onRepeatCountChange(Number(e.target.value))
              }
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-8 bg-transparent text-center font-mono text-xs font-bold focus:outline-none focus:bg-background"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              separator.onDelete();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-5 w-5 items-center justify-center border-2 border-destructive bg-card text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

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
    const sgIndex: number[] = [];
    const sepInfo = new Map<
      number,
      { groupIndex: number; repeatCount: number }
    >();
    let offset = 0;
    for (const [gi, group] of data.groups.entries()) {
      for (let i = 0; i < group.squareCount; i++) {
        const idx = offset + i;
        if (idx < data.squares.length) sgIndex[idx] = gi;
      }
      if (data.groups.length > 1) {
        const lastIdx = offset + group.squareCount - 1;
        if (lastIdx < data.squares.length) {
          sepInfo.set(lastIdx, {
            groupIndex: gi,
            repeatCount: group.repeatCount,
          });
        }
      }
      offset += group.squareCount;
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
            const gi = squareGroupIndex[globalIndex] ?? 0;
            const groupColor =
              data.groups.length > 1 ? getGroupColor(gi) : undefined;
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
        <div className="absolute right-0 top-0 bottom-0 z-10 flex translate-x-full flex-col items-start pl-1">
          {/* Top connector */}
          <div
            className="h-4 w-3 border-t-3 border-r-3"
            style={{ borderColor: squareProps.groupColor }}
          />
          {/* Middle section with repeat count */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="w-3 h-8 border-r-3 mb-1"
              style={{ borderColor: squareProps.groupColor }}
            />
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
            <div
              className="w-3 h-8 border-r-3 mt-1"
              style={{ borderColor: squareProps.groupColor }}
            />
          </div>
          {/* Bottom connector */}
          <div
            className="h-4 w-3 border-b-3 border-r-3"
            style={{ borderColor: squareProps.groupColor }}
          />
        </div>
      )}
    </div>
  );
}

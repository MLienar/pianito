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
import { useCallback, useMemo } from "react";
import { useGridEditorStore } from "@/stores/grid-editor";
import { GridSquare } from "./grid-square";
import { getGroupColor } from "./group-colors";

interface GridViewProps {
  playingIndex: number | null;
}

export function GridView({ playingIndex }: GridViewProps) {
  const data = useGridEditorStore((s) => s.data);
  const reorderSquares = useGridEditorStore((s) => s.reorderSquares);
  const setChord = useGridEditorStore((s) => s.setChord);
  const clearChord = useGridEditorStore((s) => s.clearChord);
  const addSquare = useGridEditorStore((s) => s.addSquare);
  const updateGroupRepeatCount = useGridEditorStore(
    (s) => s.updateGroupRepeatCount,
  );

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
        <div className="grid grid-cols-[repeat(4,1fr)] gap-2">
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
                chord={square.chord}
                isPlaying={playingIndex === globalIndex}
                index={globalIndex}
                totalSquares={data.squares.length}
                onSetChord={(chord) => setChord(globalIndex, chord)}
                onClear={() => clearChord(globalIndex)}
                groupColor={groupColor}
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
            onClick={addSquare}
            className="flex h-20 w-full items-center justify-center border-3 border-dashed border-border bg-background text-2xl text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-[var(--shadow-brutal)]"
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
  chord,
  isPlaying,
  index,
  totalSquares,
  onSetChord,
  onClear,
  separator,
  groupColor,
}: {
  id: string;
  chord: string | null;
  isPlaying: boolean;
  index: number;
  totalSquares: number;
  onSetChord: (chord: string) => void;
  onClear: () => void;
  separator?: SeparatorInfo;
  groupColor?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative"
    >
      <GridSquare
        chord={chord}
        isPlaying={isPlaying}
        index={index}
        totalSquares={totalSquares}
        onSetChord={onSetChord}
        onClear={onClear}
        groupColor={groupColor}
      />
      {separator && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex translate-x-1/2 flex-col items-center">
          <div
            className="w-0.5 flex-1"
            style={{ backgroundColor: groupColor }}
          />
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
            className="w-10 border-2 bg-background px-1 py-0.5 text-center font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ borderColor: groupColor }}
          />
          <div
            className="w-0.5 flex-1"
            style={{ backgroundColor: groupColor }}
          />
        </div>
      )}
    </div>
  );
}

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
import type { GridGroup } from "@pianito/shared";
import { Fragment, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGridEditorStore } from "@/stores/grid-editor";
import { GridSquare } from "./grid-square";

interface GridViewProps {
  playingIndex: number | null;
}

export function GridView({ playingIndex }: GridViewProps) {
  const { t } = useTranslation();
  const data = useGridEditorStore((s) => s.data);
  const reorderSquares = useGridEditorStore((s) => s.reorderSquares);
  const setChord = useGridEditorStore((s) => s.setChord);
  const clearChord = useGridEditorStore((s) => s.clearChord);
  const addSquare = useGridEditorStore((s) => s.addSquare);
  const updateGroupRepeatCount = useGridEditorStore(
    (s) => s.updateGroupRepeatCount,
  );
  const mergeWithPreviousGroup = useGridEditorStore(
    (s) => s.mergeWithPreviousGroup,
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

  const groupedSquares = useMemo(() => {
    const result: {
      group: GridGroup;
      groupIndex: number;
      squares: { globalIndex: number }[];
    }[] = [];
    let offset = 0;
    for (const [gi, group] of data.groups.entries()) {
      const squares: { globalIndex: number }[] = [];
      for (let i = 0; i < group.squareCount; i++) {
        const globalIdx = offset + i;
        if (globalIdx < data.squares.length) {
          squares.push({ globalIndex: globalIdx });
        }
      }
      result.push({ group, groupIndex: gi, squares });
      offset += group.squareCount;
    }
    return result;
  }, [data.groups, data.squares.length]);

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={squareIds} strategy={rectSortingStrategy}>
          {groupedSquares.map(({ group, groupIndex, squares }) => (
            <Fragment key={`group-${groupIndex}`}>
              {groupIndex > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 border-t-2 border-dashed border-border" />
                  <button
                    type="button"
                    onClick={() => mergeWithPreviousGroup(groupIndex)}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 border-2 border-dashed border-border hover:border-primary"
                  >
                    {t("accomp.mergeGroup")}
                  </button>
                  <div className="h-px flex-1 border-t-2 border-dashed border-border" />
                </div>
              )}

              <div className="flex gap-2">
                {data.groups.length > 1 && (
                  <div className="flex w-2 flex-col items-center">
                    <div className="flex-1 w-1 bg-primary/40 rounded-full" />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-2">
                  <div className="grid grid-cols-4 gap-2">
                    {squares.map(({ globalIndex }) => {
                      const square = data.squares[globalIndex];
                      if (!square) return null;
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
                        />
                      );
                    })}
                    {groupIndex === groupedSquares.length - 1 && (
                      <button
                        type="button"
                        onClick={addSquare}
                        className="flex h-20 w-full items-center justify-center border-3 border-dashed border-border bg-background text-2xl text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-[var(--shadow-brutal)]"
                      >
                        +
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      className="text-xs font-bold text-muted-foreground"
                      htmlFor={`group-repeat-${groupIndex}`}
                    >
                      {t("accomp.repeatCount")}
                    </label>
                    <input
                      id={`group-repeat-${groupIndex}`}
                      type="number"
                      min={1}
                      max={50}
                      value={group.repeatCount}
                      onChange={(e) =>
                        updateGroupRepeatCount(
                          groupIndex,
                          Number(e.target.value),
                        )
                      }
                      className="w-14 border-2 border-border bg-background px-1.5 py-0.5 text-center font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSquareWrapper({
  id,
  chord,
  isPlaying,
  index,
  totalSquares,
  onSetChord,
  onClear,
}: {
  id: string;
  chord: string | null;
  isPlaying: boolean;
  index: number;
  totalSquares: number;
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
        index={index}
        totalSquares={totalSquares}
        onSetChord={onSetChord}
        onClear={onClear}
      />
    </div>
  );
}

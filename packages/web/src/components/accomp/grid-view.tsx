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
import type { GridData, GridGroup } from "@pianito/shared";
import { Fragment, useCallback, useMemo } from "react";
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
  onUpdateGroupRepeatCount: (groupIndex: number, repeatCount: number) => void;
  onSplitGroup: (lineIndex: number) => void;
  onMergeWithPreviousGroup: (groupIndex: number) => void;
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
  onUpdateGroupRepeatCount,
  onSplitGroup,
  onMergeWithPreviousGroup,
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

  const groupedLines = useMemo(() => {
    const result: {
      group: GridGroup;
      groupIndex: number;
      lines: { line: GridData["lines"][number]; globalIndex: number }[];
    }[] = [];
    let offset = 0;
    for (const [gi, group] of data.groups.entries()) {
      const lines: { line: GridData["lines"][number]; globalIndex: number }[] =
        [];
      for (let i = 0; i < group.lineCount; i++) {
        const globalIdx = offset + i;
        const line = data.lines[globalIdx];
        if (line) {
          lines.push({ line, globalIndex: globalIdx });
        }
      }
      result.push({ group, groupIndex: gi, lines });
      offset += group.lineCount;
    }
    return result;
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={lineIds} strategy={verticalListSortingStrategy}>
          {groupedLines.map(({ group, groupIndex, lines }) => (
            <div key={`group-${groupIndex}`} className="relative flex gap-2">
              {data.groups.length > 1 && (
                <div className="flex w-8 flex-col items-center">
                  <div className="flex-1 w-1 bg-primary/40 rounded-full" />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3">
                {groupIndex > 0 && (
                  <div className="flex items-center gap-2 -mt-2 mb-1">
                    <div className="h-px flex-1 border-t-2 border-dashed border-border" />
                    <button
                      type="button"
                      onClick={() => onMergeWithPreviousGroup(groupIndex)}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 border-2 border-dashed border-border hover:border-primary"
                    >
                      {t("accomp.mergeGroup")}
                    </button>
                    <div className="h-px flex-1 border-t-2 border-dashed border-border" />
                  </div>
                )}

                {lines.map(({ line, globalIndex }, localIndex) => (
                  <Fragment key={`line-${globalIndex}`}>
                    {localIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => onSplitGroup(globalIndex)}
                        className="ml-10 self-start text-xs font-bold text-muted-foreground/0 hover:text-muted-foreground transition-colors px-1"
                        title={t("accomp.splitGroup")}
                      >
                        {t("accomp.splitHere")}
                      </button>
                    )}
                    <SortableLineWrapper
                      id={`line-${globalIndex}`}
                      line={line}
                      lineIndex={globalIndex}
                      totalLines={data.lines.length}
                      playingSquareIndex={
                        playingPosition?.line === globalIndex
                          ? playingPosition.square
                          : null
                      }
                      canRemove={data.lines.length > 1}
                      onSetChord={(squareIndex, chord) =>
                        onSetChord(globalIndex, squareIndex, chord)
                      }
                      onClearChord={(squareIndex) =>
                        onClearChord(globalIndex, squareIndex)
                      }
                      onRemoveLine={() => onRemoveLine(globalIndex)}
                      onReorderSquares={(from, to) =>
                        onReorderSquares(globalIndex, from, to)
                      }
                    />
                  </Fragment>
                ))}

                <div className="ml-10 flex items-center gap-2">
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
                      onUpdateGroupRepeatCount(
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
  totalLines,
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
  totalLines: number;
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
        totalLines={totalLines}
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

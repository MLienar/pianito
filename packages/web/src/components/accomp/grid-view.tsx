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
import type { TimeSignature } from "@pianito/shared";
import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useGridEditorStore } from "@/stores/grid-editor";
import { GridSquare, type GridSquareProps } from "./grid-square";
import { getGroupColor } from "./group-colors";

function getBeatsPerRow(ts: TimeSignature): number {
  return ts.numerator * 4;
}

interface GridViewProps {
  playingIndex: number | null;
}

export function GridView({ playingIndex }: GridViewProps) {
  const data = useGridEditorStore((s) => s.data);
  const timeSignature = useGridEditorStore((s) => s.timeSignature);
  const reorderSquares = useGridEditorStore((s) => s.reorderSquares);
  const setChord = useGridEditorStore((s) => s.setChord);
  const clearChord = useGridEditorStore((s) => s.clearChord);
  const setSquareBeats = useGridEditorStore((s) => s.setSquareBeats);
  const addSquare = useGridEditorStore((s) => s.addSquare);
  const updateGroupRepeatCount = useGridEditorStore(
    (s) => s.updateGroupRepeatCount,
  );
  const deleteGroup = useGridEditorStore((s) => s.deleteGroup);

  const beatsPerRow = getBeatsPerRow(timeSignature);

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

  const { squareGroupIndex, squareSeparatorInfo, tsIndicators } =
    useMemo(() => {
      const sgIndex: (number | null)[] = new Array(data.squares.length).fill(
        null,
      );
      const sepInfo = new Map<
        number,
        { groupIndex: number; repeatCount: number }
      >();
      const tsInd = new Map<number, TimeSignature>();

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
        tsInd.set(group.start, group.timeSignature ?? timeSignature);
      }

      if (data.groups.length === 0 && data.squares.length > 0) {
        tsInd.set(0, timeSignature);
      }

      return {
        squareGroupIndex: sgIndex,
        squareSeparatorInfo: sepInfo,
        tsIndicators: tsInd,
      };
    }, [data.groups, data.squares.length, timeSignature]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={squareIds} strategy={rectSortingStrategy}>
        <div
          data-tour="grid-container"
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${beatsPerRow}, 1fr)`,
          }}
        >
          {data.squares.map((square, globalIndex) => {
            if (!square) return null;
            const sepInfo = squareSeparatorInfo.get(globalIndex);
            const gi = squareGroupIndex[globalIndex];
            const groupColor = gi !== null ? getGroupColor(gi) : undefined;
            const group = gi !== null ? data.groups[gi] : undefined;
            const maxBeats =
              group?.timeSignature?.numerator ?? timeSignature.numerator;
            const tsInd = tsIndicators.get(globalIndex);
            return (
              <SortableSquareWrapper
                key={`sq-${globalIndex}`}
                id={`sq-${globalIndex}`}
                squareProps={{
                  chord: square.chord,
                  nbBeats: square.nbBeats,
                  maxBeats,
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
                tsIndicator={tsInd}
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

function TimeSignatureBadge({
  ts,
  groupColor,
}: {
  ts: TimeSignature;
  groupColor?: string;
}) {
  return (
    <div
      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 pointer-events-none"
      style={groupColor ? { color: groupColor } : undefined}
    >
      <div className="flex flex-col items-center leading-none font-mono font-black text-base opacity-60">
        <span>{ts.numerator}</span>
        <span>{ts.denominator}</span>
      </div>
    </div>
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
  tsIndicator,
}: {
  id: string;
  squareProps: GridSquareProps;
  separator?: SeparatorInfo;
  tsIndicator?: TimeSignature;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${squareProps.nbBeats}`,
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
      {tsIndicator && (
        <TimeSignatureBadge
          ts={tsIndicator}
          groupColor={squareProps.groupColor}
        />
      )}
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

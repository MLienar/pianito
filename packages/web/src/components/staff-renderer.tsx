import { memo } from "react";
import { match } from "ts-pattern";
import { NoteGlyph, StaffLines } from "@/components/staff-primitives";
import { useNoteFormatter } from "@/hooks/use-note-formatter";
import { NOTE_SPACING } from "@/lib/constants";
import { COLORS, LINE_SPACING, parseNote, STAFF_TOP } from "@/lib/staff-utils";

const STAFF_WIDTH = 800;
const SCROLL_AREA_LEFT = 120;
const SVG_HEIGHT = STAFF_TOP + 4 * LINE_SPACING + 60;

interface StaffRendererProps {
  notes: string[];
  clef: "treble" | "bass";
  scrollOffset: number;
  currentIndex: number;
  answers: (string | null)[];
  feedback: "correct" | "wrong" | null;
}

export const StaffRenderer = memo(function StaffRenderer({
  notes,
  clef,
  scrollOffset,
  currentIndex,
  answers,
  feedback,
}: StaffRendererProps) {
  const formatNote = useNoteFormatter();

  return (
    <div className="border-3 border-border bg-card p-4 shadow-[var(--shadow-brutal)] overflow-hidden">
      <svg
        viewBox={`0 0 ${STAFF_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ minHeight: 200 }}
        role="img"
        aria-label="Musical staff with notes"
      >
        <StaffLines width={STAFF_WIDTH} clef={clef} />

        <rect
          x={SCROLL_AREA_LEFT - 20}
          y={STAFF_TOP - 20}
          width={40}
          height={4 * LINE_SPACING + 40}
          fill={match(feedback)
            .with(
              "correct",
              () => "color-mix(in srgb, var(--color-accent) 20%, transparent)",
            )
            .with(
              "wrong",
              () =>
                "color-mix(in srgb, var(--color-destructive) 20%, transparent)",
            )
            .with(
              null,
              () => "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            )
            .exhaustive()}
          rx={4}
        />

        {notes.map((noteStr: string, i: number) => {
          const x = SCROLL_AREA_LEFT + i * NOTE_SPACING - scrollOffset;

          if (x < -30 || x > STAFF_WIDTH + 30) return null;

          const { y, letter, accidental, ledgerLines } = parseNote(
            noteStr,
            clef,
          );
          const isActive = i === currentIndex;
          const wasAnswered = answers[i] !== undefined;
          const wasCorrect = wasAnswered && answers[i] === letter;

          let noteColor = COLORS.foreground;
          if (wasAnswered) {
            noteColor = wasCorrect ? COLORS.accent : COLORS.destructive;
          } else if (isActive) {
            noteColor = COLORS.primary;
          }

          return (
            <NoteGlyph
              key={i}
              x={x}
              y={y}
              ledgerLines={ledgerLines}
              accidental={accidental}
              fill={noteColor}
              label={
                wasAnswered && !wasCorrect
                  ? { text: formatNote(letter), color: COLORS.destructive }
                  : undefined
              }
            />
          );
        })}
      </svg>
    </div>
  );
});

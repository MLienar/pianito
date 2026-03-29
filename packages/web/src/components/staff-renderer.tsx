import { memo } from "react";
import { Note } from "tonal";
import { match } from "ts-pattern";
import { BarLine, NoteGlyph, StaffLines } from "@/components/staff-primitives";
import { useNoteFormatter } from "@/hooks/use-note-formatter";
import { BEATS_PER_MEASURE, NOTE_SPACING } from "@/lib/constants";
import { COLORS, LINE_SPACING, parseNote, STAFF_TOP } from "@/lib/staff-utils";

const STAFF_WIDTH = 800;
const SCROLL_AREA_LEFT = 120;
const SVG_HEIGHT = STAFF_TOP + 4 * LINE_SPACING + 60;

interface StaffRendererProps {
  notes: string[];
  clef: "treble" | "bass";
  keySignature?: string[];
  scrollOffset: number;
  currentNoteIndex: number;
  currentMeasure: number;
  answers: (string | null | undefined)[];
  feedback: "correct" | "wrong" | null;
  isCountIn: boolean;
}

export const StaffRenderer = memo(function StaffRenderer({
  notes,
  clef,
  keySignature = [],
  scrollOffset,
  currentNoteIndex,
  currentMeasure,
  answers,
  feedback,
  isCountIn,
}: StaffRendererProps) {
  const formatNote = useNoteFormatter();

  const keySigAccidentals = new Set(keySignature);

  const totalMeasures = Math.ceil(notes.length / BEATS_PER_MEASURE);

  // Measure highlight position
  const measureX =
    SCROLL_AREA_LEFT +
    currentMeasure * BEATS_PER_MEASURE * NOTE_SPACING -
    scrollOffset;
  const measureWidth = BEATS_PER_MEASURE * NOTE_SPACING;

  const highlightColor = match(feedback)
    .with(
      "correct",
      () => "color-mix(in srgb, var(--color-accent) 15%, transparent)",
    )
    .with(
      "wrong",
      () => "color-mix(in srgb, var(--color-destructive) 15%, transparent)",
    )
    .with(null, () =>
      isCountIn
        ? "color-mix(in srgb, var(--color-primary) 5%, transparent)"
        : "color-mix(in srgb, var(--color-primary) 8%, transparent)",
    )
    .exhaustive();

  return (
    <div className="border-3 border-border bg-card p-4 shadow-[var(--shadow-brutal)] overflow-hidden">
      <svg
        viewBox={`0 0 ${STAFF_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ minHeight: 200 }}
        role="img"
        aria-label="Musical staff with notes"
      >
        <StaffLines
          width={STAFF_WIDTH}
          clef={clef}
          keySignature={keySignature}
        />

        {/* Measure highlight */}
        <rect
          x={measureX - NOTE_SPACING / 2}
          y={STAFF_TOP - 20}
          width={measureWidth}
          height={4 * LINE_SPACING + 40}
          fill={highlightColor}
          rx={4}
        />

        {/* Bar lines between measures */}
        {Array.from({ length: totalMeasures + 1 }, (_, m) => {
          const noteIdx = m * BEATS_PER_MEASURE;
          const barX =
            SCROLL_AREA_LEFT +
            noteIdx * NOTE_SPACING -
            scrollOffset -
            NOTE_SPACING / 2;
          if (barX < -10 || barX > STAFF_WIDTH + 10) return null;
          const isFinal = m === totalMeasures;
          return <BarLine key={m} x={barX} isDouble={isFinal} />;
        })}

        {notes.map((noteStr: string, i: number) => {
          const x = SCROLL_AREA_LEFT + i * NOTE_SPACING - scrollOffset;

          if (x < -30 || x > STAFF_WIDTH + 30) return null;

          const { y, letter, accidental, ledgerLines } = parseNote(
            noteStr,
            clef,
          );
          const n = Note.get(noteStr);
          const noteNameWithAcc = `${n.letter}${n.acc}`;
          const accidentalInKeySig = keySigAccidentals.has(noteNameWithAcc);
          const displayAccidental = accidentalInKeySig ? null : accidental;

          const isActive = i === currentNoteIndex;
          const answer = answers[i];
          const wasAnswered = answer !== undefined && answer !== null;
          const wasMissed = answer === null;
          const wasCorrect = wasAnswered && answer === letter;

          const noteColor = match(true)
            .when(
              () => wasMissed,
              () => COLORS.missed,
            )
            .when(
              () => wasAnswered && wasCorrect,
              () => COLORS.accent,
            )
            .when(
              () => wasAnswered && !wasCorrect,
              () => COLORS.destructive,
            )
            .when(
              () => isActive && !isCountIn,
              () => COLORS.primary,
            )
            .otherwise(() => COLORS.foreground);

          return (
            <NoteGlyph
              key={i}
              x={x}
              y={y}
              ledgerLines={ledgerLines}
              accidental={displayAccidental}
              fill={noteColor}
              label={
                wasAnswered && !wasCorrect
                  ? { text: formatNote(letter), color: COLORS.destructive }
                  : wasMissed
                    ? { text: formatNote(letter), color: COLORS.missed }
                    : undefined
              }
            />
          );
        })}
      </svg>
    </div>
  );
});

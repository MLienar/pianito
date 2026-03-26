import { memo } from "react";
import { Note } from "tonal";
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
  keySignature?: string[];
  scrollOffset: number;
  currentIndex: number;
  answers: (string | null)[];
  feedback: "correct" | "wrong" | null;
}

export const StaffRenderer = memo(function StaffRenderer({
  notes,
  clef,
  keySignature = [],
  scrollOffset,
  currentIndex,
  answers,
  feedback,
}: StaffRendererProps) {
  const formatNote = useNoteFormatter();

  // Build a set of accidentals covered by the key signature (e.g. "F#" → "F" is sharped)
  const keySigAccidentals = new Set(keySignature);

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
          // Suppress accidental if it's covered by the key signature
          const n = Note.get(noteStr);
          const noteNameWithAcc = `${n.letter}${n.acc}`;
          const accidentalInKeySig = keySigAccidentals.has(noteNameWithAcc);
          const displayAccidental = accidentalInKeySig ? null : accidental;
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
              accidental={displayAccidental}
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

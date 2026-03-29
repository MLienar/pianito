import type { Clef } from "@pianito/shared";
import { getNoteVariants } from "@pianito/shared";
import { NoteGlyph, StaffLines } from "@/components/staff-primitives";
import { useNoteFormatter } from "@/hooks/use-note-formatter";
import { COLORS, LINE_SPACING, parseNote, STAFF_TOP } from "@/lib/staff-utils";

const NOTE_GAP = 70;
const CLEF_WIDTH = 70;
const PADDING = 30;
const VERTICAL_PADDING = 20;
const STEM_LENGTH = 3 * LINE_SPACING;
const STAFF_MIDDLE_Y = STAFF_TOP + 2 * LINE_SPACING;

function NoteVariantsStaff({
  variants,
  clef,
  keySignature = [],
}: {
  variants: string[];
  clef: Clef;
  keySignature?: string[];
}) {
  const svgWidth = CLEF_WIDTH + variants.length * NOTE_GAP + PADDING;

  const parsedNotes = variants.map((noteStr) => parseNote(noteStr, clef));

  // Center the viewBox on the staff lines themselves
  const staffCenterY = STAFF_TOP + 2 * LINE_SPACING;
  const staffHalfHeight = 2 * LINE_SPACING;
  // Expand for notes/stems that extend beyond the staff
  const noteExtents = parsedNotes.flatMap((p) => {
    const stemUp = p.y > STAFF_MIDDLE_Y;
    const stemEnd = stemUp ? p.y - STEM_LENGTH : p.y + STEM_LENGTH;
    return [p.y, stemEnd];
  });
  const minY = Math.min(STAFF_TOP, ...noteExtents);
  const maxY = Math.max(STAFF_TOP + 4 * LINE_SPACING, ...noteExtents);
  const halfHeight =
    Math.max(staffCenterY - minY, maxY - staffCenterY) + VERTICAL_PADDING;
  const viewHeight = halfHeight * 2;

  return (
    <svg
      viewBox={`0 ${staffCenterY - halfHeight} ${svgWidth} ${viewHeight}`}
      className="w-full"
      style={{ minHeight: 140, overflow: "visible" }}
      role="img"
      aria-label="Staff showing note variants"
    >
      <StaffLines width={svgWidth} clef={clef} keySignature={keySignature} />

      {parsedNotes.map((parsed, i) => {
        const x = CLEF_WIDTH + i * NOTE_GAP + NOTE_GAP / 2;
        return (
          <NoteGlyph
            key={variants[i]}
            x={x}
            y={parsed.y}
            ledgerLines={parsed.ledgerLines}
            accidental={parsed.accidental}
            fill={COLORS.primary}
          />
        );
      })}
    </svg>
  );
}

interface NoteIntroCardsProps {
  newNotes: string[];
  clef: Clef;
  keySignature?: string[];
}

export function NoteIntroCards({
  newNotes,
  clef,
  keySignature,
}: NoteIntroCardsProps) {
  const formatNote = useNoteFormatter();
  const referenceOctave = clef === "bass" ? 3 : 4;

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {newNotes.map((note, index) => {
        const variants = getNoteVariants(note, clef);
        const parsed = parseNote(`${note}${referenceOctave}`, clef);
        const displayName = formatNote(
          parsed.accidental
            ? `${parsed.letter}${parsed.accidental}`
            : parsed.letter,
        );

        return (
          <div
            key={note}
            data-tour={`intro-note-${index}`}
            className="border-3 border-border bg-card p-4 shadow-[var(--shadow-brutal)] w-56 overflow-hidden"
          >
            <NoteVariantsStaff
              variants={variants}
              clef={clef}
              keySignature={keySignature}
            />
            <p className="text-center text-sm text-muted-foreground mt-2">
              <span className="text-xl font-bold text-foreground">
                {displayName}
              </span>
              {variants.length > 1 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({variants.join(", ")})
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

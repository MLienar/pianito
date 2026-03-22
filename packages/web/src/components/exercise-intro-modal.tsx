import type { Clef, ExerciseLevel } from "@pianito/shared";
import { getNewNotes, getNoteVariants } from "@pianito/shared";
import { useState } from "react";
import { Button } from "@/components/button";
import { NoteGlyph, StaffLines } from "@/components/staff-primitives";
import { COLORS, LINE_SPACING, parseNote, STAFF_TOP } from "@/lib/staff-utils";

const SVG_HEIGHT = STAFF_TOP + 4 * LINE_SPACING + 60;
const NOTE_GAP = 70;
const CLEF_WIDTH = 70;
const PADDING = 30;

function NoteVariantsStaff({
  variants,
  clef,
}: {
  variants: string[];
  clef: Clef;
}) {
  const svgWidth = CLEF_WIDTH + variants.length * NOTE_GAP + PADDING;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
      className="w-full"
      style={{ minHeight: 140 }}
      role="img"
      aria-label="Staff showing note variants"
    >
      <StaffLines width={svgWidth} clef={clef} />

      {variants.map((noteStr, i) => {
        const x = CLEF_WIDTH + i * NOTE_GAP + NOTE_GAP / 2;
        const { y, accidental, ledgerLines } = parseNote(noteStr, clef);

        return (
          <NoteGlyph
            key={noteStr}
            x={x}
            y={y}
            ledgerLines={ledgerLines}
            accidental={accidental}
            fill={COLORS.primary}
          />
        );
      })}
    </svg>
  );
}

interface ExerciseIntroModalProps {
  level: ExerciseLevel;
  clef: Clef;
  onStart: () => void;
  onDontShowAgain: () => void;
}

export function ExerciseIntroModal({
  level,
  clef,
  onStart,
  onDontShowAgain,
}: ExerciseIntroModalProps) {
  const newNotes = getNewNotes(level.level);
  const [page, setPage] = useState(0);

  const currentNote = newNotes[page];
  if (!currentNote) return null;

  const variants = getNoteVariants(currentNote, clef);
  const referenceOctave = clef === "bass" ? 3 : 4;
  const parsed = parseNote(`${currentNote}${referenceOctave}`, clef);
  const displayName = parsed.accidental
    ? `${parsed.letter}${parsed.accidental}`
    : parsed.letter;
  const isLast = page === newNotes.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="border-3 border-border bg-card p-8 shadow-[var(--shadow-brutal)] max-w-sm w-full mx-4 flex flex-col gap-6">
        <div>
          <p className="text-sm font-mono text-muted-foreground">
            Level {level.level}
          </p>
          <h2 className="text-2xl font-bold tracking-tight mt-1">
            {level.name}
          </h2>
        </div>

        <div className="border-3 border-border bg-background p-4">
          <NoteVariantsStaff variants={variants} clef={clef} />
          <p className="text-center text-xl font-bold mt-2">
            {displayName}
            {variants.length > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({variants.join(", ")})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-mono">
            {page + 1} / {newNotes.length}
          </span>
          <div className="flex gap-2">
            {page > 0 && (
              <Button variant="default" onClick={() => setPage(page - 1)}>
                Previous
              </Button>
            )}
            {isLast ? (
              <Button variant="accent" onClick={onStart}>
                Start
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setPage(page + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onDontShowAgain}
        >
          Don't show again for this level
        </Button>
      </div>
    </div>
  );
}

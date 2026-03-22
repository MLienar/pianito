import { memo } from "react";
import { Note } from "tonal";
import { match } from "ts-pattern";
import { NOTE_SPACING } from "@/lib/constants";

// Staff geometry constants
const STAFF_WIDTH = 800;
const STAFF_TOP = 40;
const LINE_SPACING = 24;
const NOTE_RADIUS = 10;
const SCROLL_AREA_LEFT = 120;
const SVG_HEIGHT = STAFF_TOP + 4 * LINE_SPACING + 60;

const LETTER_STEPS: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

const STEM_X_INSET = 1;

// Theme-aware color tokens (CSS variable values)
const COLORS = {
  foreground: "var(--color-foreground)",
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  destructive: "var(--color-destructive)",
};

interface ParsedNote {
  y: number;
  letter: string;
  accidental: string | null;
  ledgerLines: number[];
}

function parseNote(noteStr: string, clef: "treble" | "bass"): ParsedNote {
  const n = Note.get(noteStr);
  const letter = n.letter;
  const octave = n.oct ?? 4;
  const step = LETTER_STEPS[letter] ?? 0;

  const bottomLineY = STAFF_TOP + 4 * LINE_SPACING;
  const stepsFromRef = match(clef)
    .with("treble", () => (octave - 4) * 7 + step - 2)
    .with("bass", () => (octave - 2) * 7 + step - 4)
    .exhaustive();
  const y = bottomLineY - stepsFromRef * (LINE_SPACING / 2);

  const accidental = match(n.acc)
    .with("#", () => "\u266F")
    .with("b", () => "\u266D")
    .with("##", () => "\u{1D12A}")
    .with("bb", () => "\u{1D12B}")
    .otherwise(() => null);

  const ledgerLines: number[] = [];
  const topLine = STAFF_TOP;
  const bottomLine = STAFF_TOP + 4 * LINE_SPACING;
  for (let ly = topLine - LINE_SPACING; ly >= y - 1; ly -= LINE_SPACING) {
    ledgerLines.push(ly);
  }
  for (let ly = bottomLine + LINE_SPACING; ly <= y + 1; ly += LINE_SPACING) {
    ledgerLines.push(ly);
  }

  return { y, letter, accidental, ledgerLines };
}

interface StaffRendererProps {
  notes: string[];
  clef: "treble" | "bass";
  scrollOffset: number;
  currentIndex: number;
  isPlaying: boolean;
  answers: (string | null)[];
  feedback: "correct" | "wrong" | null;
}

export const StaffRenderer = memo(function StaffRenderer({
  notes,
  clef,
  scrollOffset,
  currentIndex,
  isPlaying,
  answers,
  feedback,
}: StaffRendererProps) {
  return (
    <div className="border-3 border-border bg-card p-4 shadow-[var(--shadow-brutal)] overflow-hidden">
      <svg
        viewBox={`0 0 ${STAFF_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ minHeight: 200 }}
        role="img"
        aria-label="Musical staff with notes"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={i}
            x1={0}
            y1={STAFF_TOP + i * LINE_SPACING}
            x2={STAFF_WIDTH}
            y2={STAFF_TOP + i * LINE_SPACING}
            stroke={COLORS.foreground}
            strokeWidth={1.5}
          />
        ))}

        <text
          x={20}
          y={STAFF_TOP + 3.3 * LINE_SPACING}
          fontSize={72}
          fontFamily="serif"
          fill={COLORS.foreground}
        >
          {match(clef)
            .with("treble", () => "\u{1D11E}")
            .with("bass", () => "\u{1D122}")
            .exhaustive()}
        </text>

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
          const isActive = i === currentIndex && isPlaying;
          const wasAnswered = answers[i] !== undefined;
          const wasCorrect = wasAnswered && answers[i] === letter;

          let noteColor = COLORS.foreground;
          if (wasAnswered) {
            noteColor = wasCorrect ? COLORS.accent : COLORS.destructive;
          } else if (isActive) {
            noteColor = COLORS.primary;
          }

          const stemUp = y > STAFF_TOP + 2 * LINE_SPACING;
          const stemX = stemUp
            ? x - NOTE_RADIUS + STEM_X_INSET
            : x + NOTE_RADIUS - STEM_X_INSET;
          const stemEndY = stemUp ? y - 3 * LINE_SPACING : y + 3 * LINE_SPACING;

          return (
            <g key={i}>
              {ledgerLines.map((ly, li) => (
                <line
                  key={li}
                  x1={x - 18}
                  y1={ly}
                  x2={x + 18}
                  y2={ly}
                  stroke={COLORS.foreground}
                  strokeWidth={1.5}
                />
              ))}

              {accidental && (
                <text
                  x={x - NOTE_RADIUS - 14}
                  y={y + 5}
                  fontSize={20}
                  fontFamily="serif"
                  fill={COLORS.foreground}
                  textAnchor="middle"
                >
                  {accidental}
                </text>
              )}

              <ellipse
                cx={x}
                cy={y}
                rx={NOTE_RADIUS}
                ry={NOTE_RADIUS * 0.8}
                fill={noteColor}
                stroke={COLORS.foreground}
                strokeWidth={2}
                transform={`rotate(-15, ${x}, ${y})`}
              />

              <line
                x1={stemX}
                y1={y}
                x2={stemX}
                y2={stemEndY}
                stroke={COLORS.foreground}
                strokeWidth={2}
              />

              {wasAnswered && !wasCorrect && (
                <text
                  x={x}
                  y={y - 20}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight="bold"
                  fill={COLORS.destructive}
                  fontFamily="var(--font-sans)"
                >
                  {letter}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

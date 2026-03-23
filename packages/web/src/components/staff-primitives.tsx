import {
  CLEF_SYMBOLS,
  COLORS,
  LINE_SPACING,
  NOTE_RADIUS,
  STAFF_TOP,
  STEM_X_INSET,
} from "@/lib/staff-utils";

export function StaffLines({
  width,
  clef,
}: {
  width: number;
  clef: "treble" | "bass";
}) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <line
          key={i}
          x1={0}
          y1={STAFF_TOP + i * LINE_SPACING}
          x2={width}
          y2={STAFF_TOP + i * LINE_SPACING}
          stroke={COLORS.foreground}
          strokeWidth={1.5}
        />
      ))}
      <text
        x={20}
        y={
          clef === "treble"
            ? STAFF_TOP + 3.3 * LINE_SPACING
            : STAFF_TOP + 2.8 * LINE_SPACING
        }
        fontSize={72}
        fontFamily="serif"
        fill={COLORS.foreground}
      >
        {CLEF_SYMBOLS[clef]}
      </text>
    </>
  );
}

export function NoteGlyph({
  x,
  y,
  ledgerLines,
  accidental,
  fill,
  label,
}: {
  x: number;
  y: number;
  ledgerLines: number[];
  accidental: string | null;
  fill: string;
  label?: { text: string; color: string };
}) {
  const stemUp = y > STAFF_TOP + 2 * LINE_SPACING;
  const stemX = stemUp
    ? x - NOTE_RADIUS + STEM_X_INSET
    : x + NOTE_RADIUS - STEM_X_INSET;
  const stemEndY = stemUp ? y - 3 * LINE_SPACING : y + 3 * LINE_SPACING;

  return (
    <g>
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
        fill={fill}
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

      {label && (
        <text
          x={x}
          y={y - 20}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill={label.color}
          fontFamily="var(--font-sans)"
        >
          {label.text}
        </text>
      )}
    </g>
  );
}

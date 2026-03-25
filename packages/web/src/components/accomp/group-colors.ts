const GROUP_COLORS = [
  "#e57373", // red
  "#64b5f6", // blue
  "#81c784", // green
  "#ffb74d", // orange
  "#ba68c8", // purple
  "#4dd0e1", // cyan
  "#fff176", // yellow
  "#f06292", // pink
] as const;

export function getGroupColor(groupIndex: number): string {
  return GROUP_COLORS[groupIndex % GROUP_COLORS.length];
}

export const NOTE_SPACING = 100;
export const ANSWER_NOTES = ["C", "D", "E", "F", "G", "A", "B"] as const;

export const LANGUAGES = [
  { code: "en", shortLabel: "EN", label: "English" },
  { code: "fr", shortLabel: "FR", label: "Français" },
  { code: "es", shortLabel: "ES", label: "Español" },
  { code: "zh", shortLabel: "中", label: "中文" },
] as const;

export const NOTATIONS = [
  { code: "letter", label: "A B C D E F G" },
  { code: "solfege", label: "Do Ré Mi Fa Sol La Si" },
] as const;

export const SOLFEGE_MAP: Record<string, string> = {
  C: "Do",
  D: "Ré",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

export const THEMES = [
  { code: "default", label: "Cream", color: "#ff6b35" },
  { code: "ocean", label: "Ocean", color: "#2563eb" },
  { code: "forest", label: "Forest", color: "#16a34a" },
  { code: "sunset", label: "Sunset", color: "#e11d48" },
  { code: "midnight", label: "Midnight", color: "#a78bfa" },
] as const;

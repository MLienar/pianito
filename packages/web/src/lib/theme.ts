export function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("pianito-theme", theme);
}

export function getStoredTheme(): string {
  return localStorage.getItem("pianito-theme") ?? "default";
}

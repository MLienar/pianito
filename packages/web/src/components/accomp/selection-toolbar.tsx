import { useTranslation } from "react-i18next";

interface SelectionToolbarProps {
  selectionCount: number;
  onGroup: () => void;
  onClearChords: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function SelectionToolbar({
  selectionCount,
  onGroup,
  onClearChords,
  onDelete,
  onClearSelection,
}: SelectionToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 border-3 border-border bg-card px-5 py-3 shadow-[var(--shadow-brutal)]">
      <span className="text-sm font-bold text-muted-foreground">
        {t("accomp.selectedCount", { count: selectionCount })}
      </span>

      <button
        type="button"
        onClick={onGroup}
        className="border-3 border-border bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
      >
        {t("accomp.groupSelection")}
      </button>

      <button
        type="button"
        onClick={onClearChords}
        className="border-3 border-border bg-muted px-4 py-1.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
      >
        {t("accomp.clearChords")}
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="border-3 border-border bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
      >
        {t("accomp.deleteSelection")}
      </button>

      <button
        type="button"
        onClick={onClearSelection}
        className="border-3 border-border bg-background px-3 py-1.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
      >
        ×
      </button>
    </div>
  );
}

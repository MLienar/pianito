import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { signOut } from "@/lib/auth";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
      setValue("");
    }
  }, [open]);

  const handleDelete = useCallback(async () => {
    if (value !== "DELETE") return;
    setDeleting(true);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await signOut();
        await navigate({ to: "/" });
        return;
      }
    } finally {
      setDeleting(false);
    }
  }, [value, navigate]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md border-3 border-border bg-card p-0 shadow-[var(--shadow-brutal-lg)] backdrop:bg-foreground/50"
    >
      {open && (
        <div className="p-6">
          <h2 className="mb-2 text-xl font-bold text-destructive">
            {t("settings.deleteAccount")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t("settings.deleteAccountConfirmation")}
          </p>
          <p className="mb-2 text-sm font-bold">{t("settings.typeDelete")}</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="DELETE"
            className="mb-4 w-full border-3 border-border bg-background px-4 py-2 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-3 border-border bg-card px-4 py-2 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={value !== "DELETE" || deleting}
              className="flex-1 border-3 border-border bg-destructive px-4 py-2 font-bold text-destructive-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
            >
              {deleting ? t("settings.deleting") : t("settings.deleteButton")}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

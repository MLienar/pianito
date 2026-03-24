import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface AuthGateModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthGateModal({ open, onClose }: AuthGateModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md border-3 border-border bg-card p-0 shadow-[var(--shadow-brutal-lg)] backdrop:bg-foreground/50"
    >
      {open && (
        <div className="p-6">
          <h2 className="mb-2 text-xl font-bold">{t("accomp.authRequired")}</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {t("accomp.authRequiredDescription")}
          </p>
          <div className="flex gap-3">
            <Link to="/signup" className="flex-1">
              <button
                type="button"
                className="w-full border-3 border-border bg-primary px-4 py-2 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
              >
                {t("common.signUp")}
              </button>
            </Link>
            <Link to="/login" className="flex-1">
              <button
                type="button"
                className="w-full border-3 border-border bg-card px-4 py-2 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
              >
                {t("common.signIn")}
              </button>
            </Link>
          </div>
        </div>
      )}
    </dialog>
  );
}

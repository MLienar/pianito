import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeleteAccountModal } from "@/components/delete-account-modal";
import { usePreferences, useUpdatePreference } from "@/hooks/use-preferences";
import { useSession } from "@/lib/auth";
import { LANGUAGES, NOTATIONS, THEMES } from "@/lib/constants";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const { data: preferences } = usePreferences();
  const { mutate: updatePreference } = useUpdatePreference();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  if (isPending || !session) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">{t("settings.title")}</h1>

      {/* Language */}
      <section className="border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)]">
        <h2 className="mb-4 text-xl font-bold">{t("settings.language")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("settings.languageDescription")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => updatePreference({ language: lang.code })}
              className={`border-3 border-border px-4 py-3 text-left font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
                preferences?.language === lang.code
                  ? "bg-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Notation */}
      <section className="border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)]">
        <h2 className="mb-4 text-xl font-bold">{t("settings.notation")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("settings.notationDescription")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {NOTATIONS.map((notation) => (
            <button
              key={notation.code}
              type="button"
              onClick={() => updatePreference({ notation: notation.code })}
              className={`border-3 border-border px-4 py-3 text-left font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
                preferences?.notation === notation.code
                  ? "bg-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {notation.label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="border-3 border-border bg-card p-6 shadow-[var(--shadow-brutal)]">
        <h2 className="mb-4 text-xl font-bold">{t("settings.theme")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("settings.themeDescription")}
        </p>
        <div className="grid grid-cols-5 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.code}
              type="button"
              onClick={() => updatePreference({ theme: theme.code })}
              className={`flex flex-col items-center gap-2 border-3 border-border px-3 py-4 font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
                preferences?.theme === theme.code
                  ? "bg-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <span
                className="h-8 w-8 border-3 border-border"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-xs">{theme.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="border-3 border-destructive bg-card p-6 shadow-[4px_4px_0px_0px_var(--color-destructive)]">
        <h2 className="mb-4 text-xl font-bold text-destructive">
          {t("settings.dangerZone")}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("settings.deleteAccountDescription")}
        </p>
        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="border-3 border-border bg-destructive px-6 py-3 font-bold text-destructive-foreground transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none"
        >
          {t("settings.deleteAccount")}
        </button>
      </section>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}

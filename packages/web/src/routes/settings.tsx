import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/lib/auth";
import { LANGUAGES } from "@/lib/constants";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  if (isPending || !session) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">{t("settings.title")}</h1>

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
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`border-3 border-border px-4 py-3 text-left font-bold transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)] active:translate-y-0 active:shadow-none ${
                i18n.language === lang.code
                  ? "bg-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

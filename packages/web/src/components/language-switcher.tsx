import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "zh", label: "中" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-1 text-xs font-bold border-2 border-border transition-all ${
            i18n.language === lang.code
              ? "bg-primary text-primary-foreground"
              : "bg-card hover:bg-muted"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

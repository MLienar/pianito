import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signIn, signUp } from "@/lib/auth";
import { Button } from "./button";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isSignup
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    if (result.error) {
      setError(
        result.error.message ??
          (isSignup ? t("auth.failedCreate") : t("auth.failedSignIn")),
      );
      setLoading(false);
    } else {
      navigate({ to: isSignup ? "/settings" : "/" });
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md border-3 border-border bg-card p-8 shadow-[var(--shadow-brutal)]">
        <h1 className="text-3xl font-bold">
          {isSignup ? t("auth.createAccount") : t("common.signIn")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isSignup ? t("auth.startJourney") : t("auth.welcomeBack")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <div className="border-3 border-border bg-destructive p-3 text-sm font-semibold text-destructive-foreground">
              {error}
            </div>
          )}

          {isSignup && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{t("auth.name")}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
                placeholder={t("auth.namePlaceholder")}
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t("auth.email")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
              placeholder={t("auth.emailPlaceholder")}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t("auth.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              className="border-3 border-border bg-background p-3 font-mono text-sm outline-none focus:shadow-[var(--shadow-brutal-sm)]"
              placeholder={t("auth.passwordPlaceholder")}
            />
          </label>

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="mt-2 p-3"
          >
            {loading
              ? isSignup
                ? t("auth.creatingAccount")
                : t("auth.signingIn")
              : isSignup
                ? t("auth.createAccount")
                : t("common.signIn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm">
          {isSignup ? t("auth.alreadyHaveAccount") : t("auth.dontHaveAccount")}
          <Link
            to={isSignup ? "/login" : "/signup"}
            className="font-bold underline decoration-2 underline-offset-2 hover:text-primary"
          >
            {isSignup ? t("common.signIn") : t("common.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}

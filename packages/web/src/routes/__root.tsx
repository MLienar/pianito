import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signOut, useSession } from "@/lib/auth";

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/router-devtools").then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    )
  : () => null;

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b-3 border-border bg-card p-4 shadow-[var(--shadow-brutal)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight hover:text-primary"
            >
              pianito
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isPending ? null : session ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">
                  {session.user.name}
                </span>
                <Button onClick={handleSignOut} size="sm">
                  {t("common.signOut")}
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm">{t("common.signIn")}</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    {t("common.signUp")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </div>
  );
}

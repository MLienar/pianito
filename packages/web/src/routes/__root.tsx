import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/button";
import { UserMenu } from "@/components/user-menu";
import { useSyncPreferences } from "@/hooks/use-preferences";
import { signOut, useSession } from "@/lib/auth";
import { applyTheme, getStoredTheme } from "@/lib/theme";

// Apply stored theme immediately to prevent flash
if (typeof document !== "undefined") {
  applyTheme(getStoredTheme());
}

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

  useSyncPreferences();

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
            {isPending ? null : session ? (
              <UserMenu
                userName={session.user.name}
                onSignOut={handleSignOut}
              />
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

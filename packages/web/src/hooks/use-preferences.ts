import type { UserPreference } from "@pianito/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/lib/auth";
import { applyTheme } from "@/lib/theme";

async function fetchPreferences(): Promise<UserPreference> {
  const res = await fetch("/api/preferences", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch preferences");
  return res.json();
}

async function patchPreference(
  body: Partial<UserPreference>,
): Promise<UserPreference> {
  const res = await fetch("/api/preferences", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update preferences");
  return res.json();
}

/** Fetches preferences (read-only, no side effects). */
export function usePreferences() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["preferences"],
    queryFn: fetchPreferences,
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
  });
}

/** Call once in the root layout to sync language + theme from server preferences. */
export function useSyncPreferences() {
  const { data } = usePreferences();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!data) return;
    const { language, theme } = data;
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    if (document.documentElement.dataset.theme !== theme) {
      applyTheme(theme);
    }
  }, [data, i18n]);
}

export function useUpdatePreference() {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();

  return useMutation({
    mutationFn: patchPreference,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
      if (i18n.language !== data.language) {
        i18n.changeLanguage(data.language);
      }
      if (document.documentElement.dataset.theme !== data.theme) {
        applyTheme(data.theme);
      }
    },
  });
}

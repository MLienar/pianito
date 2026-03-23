import { auth } from "../auth.js";

export async function getSessionUser(request: {
  headers: Record<string, string | string[] | undefined>;
}) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value)
      headers.append(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

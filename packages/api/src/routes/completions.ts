import { EXERCISE_LEVELS } from "@pianito/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { auth } from "../auth.js";
import { db } from "../db/index.js";
import { lessonCompletion } from "../db/schema.js";

async function getSessionUser(request: {
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

export async function completionRoutes(app: FastifyInstance) {
  app.get("/api/completions", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const rows = await db
      .select({ level: lessonCompletion.level })
      .from(lessonCompletion)
      .where(eq(lessonCompletion.userId, user.id));

    return { levels: rows.map((r) => r.level) };
  });

  app.post<{ Body: { level: number } }>(
    "/api/completions",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { level } = request.body;
      const maxLevel = EXERCISE_LEVELS[EXERCISE_LEVELS.length - 1]?.level ?? 0;
      if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
        return reply.status(400).send({ error: "Invalid level" });
      }

      const existing = await db
        .select({ id: lessonCompletion.id })
        .from(lessonCompletion)
        .where(
          and(
            eq(lessonCompletion.userId, user.id),
            eq(lessonCompletion.level, level),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return { ok: true };
      }

      await db.insert(lessonCompletion).values({ userId: user.id, level });
      return { ok: true };
    },
  );
}

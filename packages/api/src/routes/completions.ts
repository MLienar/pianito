import {
  type CompleteBody,
  type CompleteResponse,
  type CompletionsResponse,
  defaultClefSchema,
  type ErrorResponse,
  EXERCISE_LEVELS,
} from "@pianito/shared";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { lessonCompletion } from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

export async function completionRoutes(app: FastifyInstance) {
  app.get<{ Reply: CompletionsResponse | ErrorResponse }>(
    "/api/completions",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const rows = await db
        .select({
          level: lessonCompletion.level,
          clef: lessonCompletion.clef,
        })
        .from(lessonCompletion)
        .where(eq(lessonCompletion.userId, user.id));

      return { levels: rows };
    },
  );

  app.post<{ Body: CompleteBody; Reply: CompleteResponse | ErrorResponse }>(
    "/api/completions",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { level } = request.body;
      const clef = defaultClefSchema.parse(request.body.clef);
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
            eq(lessonCompletion.clef, clef),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return { ok: true };
      }

      await db
        .insert(lessonCompletion)
        .values({ userId: user.id, level, clef });
      return { ok: true };
    },
  );
}

import type {
  ErrorResponse,
  UpdatePreferenceBody,
  UserPreference,
} from "@pianito/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { userPreference } from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

const DEFAULT_PREFERENCES: UserPreference = {
  notation: "letter",
  theme: "default",
  language: "en",
};

const preferenceFields = {
  notation: userPreference.notation,
  theme: userPreference.theme,
  language: userPreference.language,
};

export async function preferenceRoutes(app: FastifyInstance) {
  app.get<{ Reply: UserPreference | ErrorResponse }>(
    "/api/preferences",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const [row] = await db
        .insert(userPreference)
        .values({ userId: user.id })
        .onConflictDoNothing({ target: userPreference.userId })
        .returning(preferenceFields);

      if (row) {
        return row;
      }

      // Row already existed, fetch it
      const [existing] = await db
        .select(preferenceFields)
        .from(userPreference)
        .where(eq(userPreference.userId, user.id))
        .limit(1);

      return existing ?? DEFAULT_PREFERENCES;
    },
  );

  app.patch<{
    Body: UpdatePreferenceBody;
    Reply: UserPreference | ErrorResponse;
  }>("/api/preferences", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const body = request.body;
    if (!body || Object.keys(body).length === 0) {
      return reply
        .status(400)
        .send({ error: "At least one preference field is required" });
    }

    const [updated] = await db
      .insert(userPreference)
      .values({ userId: user.id, ...body })
      .onConflictDoUpdate({
        target: userPreference.userId,
        set: { ...body, updatedAt: new Date() },
      })
      .returning(preferenceFields);

    return updated ?? DEFAULT_PREFERENCES;
  });
}

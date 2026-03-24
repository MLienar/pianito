import type { ErrorResponse } from "@pianito/shared";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import {
  account,
  grid,
  lessonCompletion,
  progress,
  session,
  user,
  userPreference,
} from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

export async function accountRoutes(app: FastifyInstance) {
  app.delete<{ Reply: { ok: true } | ErrorResponse }>(
    "/api/account",
    async (request, reply) => {
      const currentUser = await getSessionUser(request);
      if (!currentUser) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const userId = currentUser.id;

      await db.transaction(async (tx) => {
        await tx
          .delete(lessonCompletion)
          .where(eq(lessonCompletion.userId, userId));
        await tx.delete(grid).where(eq(grid.userId, userId));
        await tx.delete(progress).where(eq(progress.userId, userId));
        await tx
          .delete(userPreference)
          .where(eq(userPreference.userId, userId));
        await tx.delete(session).where(eq(session.userId, userId));
        await tx.delete(account).where(eq(account.userId, userId));
        await tx.delete(user).where(eq(user.id, userId));
      });

      return { ok: true };
    },
  );
}

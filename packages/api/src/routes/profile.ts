import type {
  ErrorResponse,
  UpdateUserProfileBody,
  UserProfile,
} from "@pianito/shared";
import {
  updateUserProfileBodySchema,
  userProfileSchema,
} from "@pianito/shared";
import { and, eq, ne } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/profile - Get current user profile
  app.get<{ Reply: UserProfile | ErrorResponse }>(
    "/api/profile",
    async (request, reply) => {
      const sessionUser = await getSessionUser(request);
      if (!sessionUser) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      // Fetch user with username from database
      const [currentUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, sessionUser.id))
        .limit(1);

      if (!currentUser) {
        return reply.status(404).send({ error: "User not found" });
      }

      const userResult = userProfileSchema.safeParse({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        username: currentUser.username || null,
        image: currentUser.image || null,
        createdAt: currentUser.createdAt.toISOString(),
        updatedAt: currentUser.updatedAt.toISOString(),
      });

      if (!userResult.success) {
        return reply.status(500).send({ error: "Failed to format user data" });
      }

      return userResult.data;
    },
  );

  // PATCH /api/profile - Update user profile
  app.patch<{
    Body: UpdateUserProfileBody;
    Reply: UserProfile | ErrorResponse;
  }>("/api/profile", async (request, reply) => {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const bodyResult = updateUserProfileBodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({ error: bodyResult.error.message });
    }

    const { username } = bodyResult.data;

    // Check if username is already taken (excluding current user)
    if (username !== undefined && username !== null) {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.username, username), ne(user.id, sessionUser.id)))
        .limit(1);

      if (existingUser.length > 0) {
        return reply.status(409).send({ error: "Username already taken" });
      }
    }

    // Update user profile
    const updateData: Partial<{ username: string | null }> = {};
    if (username !== undefined) {
      updateData.username = username;
    }

    const [updatedUser] = await db
      .update(user)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(user.id, sessionUser.id))
      .returning();

    if (!updatedUser) {
      return reply.status(500).send({ error: "Failed to update profile" });
    }

    const profileResult = userProfileSchema.safeParse({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      username: updatedUser.username || null,
      image: updatedUser.image || null,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    });

    if (!profileResult.success) {
      return reply
        .status(500)
        .send({ error: "Failed to format updated user data" });
    }

    return profileResult.data;
  });
}

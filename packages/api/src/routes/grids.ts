import {
  type CreateGridBody,
  createGridBodySchema,
  type ErrorResponse,
  type Grid,
  type GridListResponse,
  type UpdateGridBody,
  updateGridBodySchema,
} from "@pianito/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { grid } from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

export async function gridRoutes(app: FastifyInstance) {
  app.get<{ Reply: GridListResponse | ErrorResponse }>(
    "/api/grids",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const rows = await db
        .select({
          id: grid.id,
          name: grid.name,
          tempo: grid.tempo,
          createdAt: grid.createdAt,
        })
        .from(grid)
        .where(eq(grid.userId, user.id))
        .orderBy(desc(grid.createdAt));

      return {
        grids: rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  );

  app.get<{ Params: { id: string }; Reply: Grid | ErrorResponse }>(
    "/api/grids/:id",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const rows = await db
        .select()
        .from(grid)
        .where(and(eq(grid.id, request.params.id), eq(grid.userId, user.id)))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return reply.status(404).send({ error: "Grid not found" });
      }

      return {
        ...row,
        data: row.data as Grid["data"],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    },
  );

  app.post<{ Body: CreateGridBody; Reply: Grid | ErrorResponse }>(
    "/api/grids",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const body = createGridBodySchema.parse(request.body);

      const rows = await db
        .insert(grid)
        .values({
          userId: user.id,
          name: body.name,
          tempo: body.tempo,
          loopCount: body.loopCount,
          data: body.data,
        })
        .returning();

      const row = rows[0];
      if (!row) {
        return reply.status(500).send({ error: "Failed to create grid" });
      }
      return reply.status(201).send({
        ...row,
        data: row.data as Grid["data"],
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
    },
  );

  app.patch<{
    Params: { id: string };
    Body: UpdateGridBody;
    Reply: Grid | ErrorResponse;
  }>("/api/grids/:id", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const body = updateGridBodySchema.parse(request.body);

    const rows = await db
      .update(grid)
      .set({ ...body, updatedAt: sql`now()` })
      .where(and(eq(grid.id, request.params.id), eq(grid.userId, user.id)))
      .returning();

    const row = rows[0];
    if (!row) {
      return reply.status(404).send({ error: "Grid not found" });
    }

    return {
      ...row,
      data: row.data as Grid["data"],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  app.delete<{ Params: { id: string }; Reply: { ok: true } | ErrorResponse }>(
    "/api/grids/:id",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const rows = await db
        .delete(grid)
        .where(and(eq(grid.id, request.params.id), eq(grid.userId, user.id)))
        .returning({ id: grid.id });

      if (rows.length === 0) {
        return reply.status(404).send({ error: "Grid not found" });
      }

      return { ok: true };
    },
  );
}

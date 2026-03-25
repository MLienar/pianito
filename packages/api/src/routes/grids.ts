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
        swing: Number(row.swing),
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
          metronome: body.metronome,
          style: body.style,
          swing: body.swing.toString(),
          chordsEnabled: body.chordsEnabled,
          bassEnabled: body.bassEnabled,
          drumsEnabled: body.drumsEnabled,
        })
        .returning();

      const row = rows[0];
      if (!row) {
        return reply.status(500).send({ error: "Failed to create grid" });
      }
      return reply.status(201).send({
        ...row,
        data: row.data as Grid["data"],
        swing: Number(row.swing),
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

    // Convert swing to string for database storage and handle other fields
    const updateData: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.tempo !== undefined) updateData.tempo = body.tempo;
    if (body.loopCount !== undefined) updateData.loopCount = body.loopCount;
    if (body.data !== undefined) updateData.data = body.data;
    if (body.metronome !== undefined) updateData.metronome = body.metronome;
    if (body.style !== undefined) updateData.style = body.style;
    if (body.swing !== undefined) updateData.swing = body.swing.toString();
    if (body.chordsEnabled !== undefined)
      updateData.chordsEnabled = body.chordsEnabled;
    if (body.bassEnabled !== undefined)
      updateData.bassEnabled = body.bassEnabled;
    if (body.drumsEnabled !== undefined)
      updateData.drumsEnabled = body.drumsEnabled;

    const rows = await db
      .update(grid)
      .set(updateData)
      .where(and(eq(grid.id, request.params.id), eq(grid.userId, user.id)))
      .returning();

    const row = rows[0];
    if (!row) {
      return reply.status(404).send({ error: "Grid not found" });
    }

    return {
      ...row,
      data: row.data as Grid["data"],
      swing: Number(row.swing),
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

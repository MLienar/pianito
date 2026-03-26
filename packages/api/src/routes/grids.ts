import {
  type CreateGridBody,
  createGridBodySchema,
  type ErrorResponse,
  type Grid,
  type GridListResponse,
  type UpdateGridBody,
  updateGridBodySchema,
} from "@pianito/shared";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { grid } from "../db/schema.js";
import { getSessionUser } from "../lib/session.js";

const gridSummaryColumns = {
  id: grid.id,
  userId: grid.userId,
  name: grid.name,
  composer: grid.composer,
  key: grid.key,
  tempo: grid.tempo,
  visibility: grid.visibility,
  timeSignature: grid.timeSignature,
  createdAt: grid.createdAt,
};

function toGridListResponse(
  rows: { createdAt: Date; [k: string]: unknown }[],
): GridListResponse {
  return {
    grids: rows.map((r) => ({
      ...(r as Record<string, unknown>),
      createdAt: r.createdAt.toISOString(),
    })) as GridListResponse["grids"],
  };
}

export async function gridRoutes(app: FastifyInstance) {
  app.get<{ Reply: GridListResponse | ErrorResponse }>(
    "/api/grids",
    async (request, reply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const rows = await db
        .select(gridSummaryColumns)
        .from(grid)
        .where(eq(grid.userId, user.id))
        .orderBy(desc(grid.createdAt));

      return toGridListResponse(rows);
    },
  );

  app.get<{ Reply: GridListResponse | ErrorResponse }>(
    "/api/grids/public",
    async (_request, _reply) => {
      const rows = await db
        .select(gridSummaryColumns)
        .from(grid)
        .where(or(eq(grid.visibility, "public"), isNull(grid.userId)))
        .orderBy(desc(grid.createdAt));

      return toGridListResponse(rows);
    },
  );

  app.get<{ Params: { id: string }; Reply: Grid | ErrorResponse }>(
    "/api/grids/:id",
    async (request, reply) => {
      const user = await getSessionUser(request);

      const rows = await db
        .select()
        .from(grid)
        .where(
          and(
            eq(grid.id, request.params.id),
            or(
              eq(grid.visibility, "public"),
              isNull(grid.userId),
              user ? eq(grid.userId, user.id) : sql`false`,
            ),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        return reply.status(404).send({ error: "Grid not found" });
      }

      return {
        ...row,
        data: row.data as Grid["data"],
        style: row.style as Grid["style"],
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
          composer: body.composer,
          key: body.key,
          tempo: body.tempo,
          loopCount: body.loopCount,
          visibility: body.visibility,
          timeSignature: body.timeSignature,
          data: body.data,
          metronome: body.metronome,
          style: body.style,
          swing: body.swing,
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

/**
 * Seeds the database with community grids from a JSON file.
 *
 * Usage:
 *   pnpm tsx scripts/seed-community-grids.ts <path-to-community-grids.json>
 *
 * Example:
 *   pnpm tsx scripts/seed-community-grids.ts ../shared/scripts/community-grids.json
 *
 * Idempotent: skips grids whose name already exists as a community grid (userId IS NULL).
 * Pass --replace to delete all existing community grids and re-insert.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { isNull } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { grid } from "../src/db/schema.js";

interface GridInput {
  name: string;
  composer: string | null;
  key: string | null;
  tempo: number;
  timeSignature?: { numerator: number; denominator: number };
  loopCount: number;
  visibility: "public" | "private";
  data: {
    squares: { chord: string | null; nbBeats: number }[];
    groups: { start: number; nbSquares: number; repeatCount: number }[];
  };
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error(
      "Usage: pnpm tsx scripts/seed-community-grids.ts <community-grids.json>",
    );
    process.exit(1);
  }

  const replace = process.argv.includes("--replace");

  const grids: GridInput[] = JSON.parse(readFileSync(jsonPath, "utf-8"));
  console.log(`Loaded ${grids.length} grids from ${jsonPath}`);

  if (replace) {
    const deleted = await db
      .delete(grid)
      .where(isNull(grid.userId))
      .returning({ id: grid.id });
    console.log(`Deleted ${deleted.length} existing community grids`);
  }

  // Fetch existing community grid names to skip duplicates
  const existing = await db
    .select({ name: grid.name })
    .from(grid)
    .where(isNull(grid.userId));

  const existingNames = new Set(existing.map((r) => r.name));

  const toInsert = grids.filter((g) => !existingNames.has(g.name));
  const skipped = grids.length - toInsert.length;

  if (skipped > 0) {
    console.log(`Skipping ${skipped} grids that already exist`);
  }

  if (toInsert.length === 0) {
    console.log("Nothing to insert.");
    process.exit(0);
  }

  // Bulk insert — community grids have userId = null, visibility = public
  const rows = await db
    .insert(grid)
    .values(
      toInsert.map((g) => ({
        userId: null,
        name: g.name,
        composer: g.composer,
        key: g.key,
        tempo: g.tempo,
        timeSignature: g.timeSignature ?? { numerator: 4, denominator: 4 },
        loopCount: g.loopCount,
        visibility: "public" as const,
        data: g.data,
      })),
    )
    .returning({ id: grid.id, name: grid.name });

  console.log(`Inserted ${rows.length} community grids`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

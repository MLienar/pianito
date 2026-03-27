import { migrate } from "drizzle-orm/postgres-js/migrator";
import { MIGRATIONS_FOLDER } from "../config.js";
import { db } from "./index.js";

export async function runMigrations() {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

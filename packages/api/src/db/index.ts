import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Parse the URL manually to handle passwords with special characters (e.g. + /)
// that would make new URL() fail
const match = databaseUrl.match(
  /^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/,
);
if (!match) {
  throw new Error(
    "DATABASE_URL must match postgresql://user:password@host:port/database",
  );
}
const [, user, password, host, port, database] = match;

export const client = postgres({
  host,
  port: Number(port),
  user,
  password,
  database,
  max: 5,
  prepare: false, // Required for PgBouncer transaction pooling mode
});

export const db = drizzle(client, { schema });

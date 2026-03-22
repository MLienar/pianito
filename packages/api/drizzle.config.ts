import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL as string;

// Parse the URL manually to handle passwords with special characters (e.g. + /)
const match = databaseUrl?.match(
  /^postgresql:\/\/([^:]+):(.+)@([^:]+):(\d+)\/(.+)$/,
);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: match
    ? {
        host: match[3],
        port: Number(match[4]),
        user: match[1],
        password: match[2],
        database: match[5],
      }
    : { url: databaseUrl },
});

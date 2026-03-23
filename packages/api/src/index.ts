import "dotenv/config";
import cors from "@fastify/cors";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import Fastify from "fastify";
import { auth } from "./auth.js";
import { CORS_ORIGIN } from "./config.js";
import { db } from "./db/index.js";
import { accountRoutes } from "./routes/account.js";
import { completionRoutes } from "./routes/completions.js";
import { healthRoutes } from "./routes/health.js";
import { notationRoutes } from "./routes/notation.js";
import { preferenceRoutes } from "./routes/preferences.js";

const app = Fastify({ logger: true });

await migrate(db, { migrationsFolder: "./drizzle" });

await app.register(cors, {
  origin: CORS_ORIGIN,
  credentials: true,
});

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value) headers.append(key, value.toString());
    });

    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    reply.send(response.body ? await response.text() : null);
  },
});

await app.register(accountRoutes);
await app.register(completionRoutes);
await app.register(healthRoutes);
await app.register(notationRoutes);
await app.register(preferenceRoutes);

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

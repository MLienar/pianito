import "dotenv/config";
import cors from "@fastify/cors";
import { toNodeHandler } from "better-auth/node";
import Fastify from "fastify";
import { auth } from "./auth.js";
import { CORS_ORIGIN } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { notationRoutes } from "./routes/notation.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: CORS_ORIGIN,
  credentials: true,
});

const authHandler = toNodeHandler(auth);
app.all("/api/auth/*", async (request, reply) => {
  await authHandler(request.raw, reply.raw);
});

await app.register(healthRoutes);
await app.register(notationRoutes);

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

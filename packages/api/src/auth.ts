import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { CORS_ORIGIN } from "./config.js";
import { db } from "./db/index.js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [CORS_ORIGIN],
});

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, accounts, sessionsAuth, users, verifications } from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-32chars-min",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessionsAuth,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

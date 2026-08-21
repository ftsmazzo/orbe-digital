import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, users, sessionsAuth, accounts, verifications } from "./index";

const auth = betterAuth({
  baseURL: "http://localhost:3001",
  secret: process.env.BETTER_AUTH_SECRET ?? "orbe-prod-secret-change-me-please-32",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessionsAuth,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: { enabled: true },
});

try {
  const r = await auth.api.signInEmail({
    body: {
      email: "daniel@danielherculis.com.br",
      password: "orbe-demo-2026",
    },
  });
  console.log("OK", JSON.stringify(r).slice(0, 500));
} catch (e) {
  console.error("FAIL", e);
  process.exit(1);
}

import postgres from "postgres";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, users, sessionsAuth, accounts, verifications, organizations, memberships } from "./index";
import { eq } from "drizzle-orm";

const sql = postgres(process.env.DATABASE_URL!);

await sql`delete from memberships`;
await sql`delete from account`;
await sql`delete from session`;
await sql`delete from "user"`;

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

const email = "daniel@danielherculis.com.br";
const password = "orbe-demo-2026";

try {
  const signedUp = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Daniel Herculis",
    },
  });
  console.log("signUp OK", signedUp.user?.id, signedUp.user?.email);
} catch (e) {
  console.error("signUp FAIL", e);
  await sql.end();
  process.exit(1);
}

const [org] =
  (await db.select().from(organizations).where(eq(organizations.slug, "daniel-herculis"))) ||
  [];

let orgId = org?.id;
if (!orgId) {
  const [created] = await db
    .insert(organizations)
    .values({ name: "Daniel Herculis Consultoria", slug: "daniel-herculis" })
    .returning();
  orgId = created.id;
}

const userRows = await sql`select id, email from "user"`;
console.log("users after signup", userRows);

await db.insert(memberships).values({
  organizationId: orgId!,
  userId: userRows[0].id,
  role: "owner",
});

try {
  const signedIn = await auth.api.signInEmail({
    body: { email, password },
  });
  console.log("signIn OK", signedIn.user?.email);
} catch (e) {
  console.error("signIn FAIL", e);
  await sql.end();
  process.exit(1);
}

await sql.end();

import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  accounts,
  db,
  memberships,
  organizations,
  sessionsAuth,
  users,
  verifications,
} from "./index";

async function seed() {
  const email = "daniel@danielherculis.com.br";
  const password = "orbe-demo-2026";

  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
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

  // clear previous auth rows for a clean seed
  await db.delete(memberships);
  await db.delete(accounts);
  await db.delete(sessionsAuth);
  await db.delete(users);

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "daniel-herculis"));

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: "Daniel Herculis Consultoria", slug: "daniel-herculis" })
      .returning();
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Daniel Herculis",
      },
    });
  } catch {
    // fallback manual insert if API signup fails in CLI context
    const userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      name: "Daniel Herculis",
      email,
      emailVerified: true,
    });
    await db.insert(accounts).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      issuer: "local:credential",
      userId,
      password: await hashPassword(password),
    });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new Error("User not created");

  await db.insert(memberships).values({
    organizationId: org.id,
    userId: user.id,
    role: "owner",
  });

  const signedIn = await auth.api.signInEmail({
    body: { email, password },
  });

  console.log("Seed OK");
  console.log(`  Org: ${org.name}`);
  console.log(`  Login: ${email}`);
  console.log(`  Senha: ${password}`);
  console.log(`  SignIn: ${signedIn.user?.email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

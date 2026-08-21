import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { accounts, memberships, organizations, users } from "./schema";

async function seed() {
  const orgName = "Daniel Herculis Consultoria";
  const email = "daniel@danielherculis.com.br";
  const password = "orbe-demo-2026";

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "daniel-herculis"));

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: orgName, slug: "daniel-herculis" })
      .returning();
  }

  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "Daniel Herculis",
        email,
        emailVerified: true,
      })
      .returning();

    const hashed = await hashPassword(password);
    await db.insert(accounts).values({
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashed,
    });
  }

  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, user.id));

  if (!membership) {
    await db.insert(memberships).values({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
    });
  }

  console.log("Seed OK");
  console.log(`  Org: ${org.name}`);
  console.log(`  Login: ${email}`);
  console.log(`  Senha: ${password}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

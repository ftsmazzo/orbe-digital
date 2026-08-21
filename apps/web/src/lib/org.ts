import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db, memberships, organizations } from "./db";

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentOrg() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [membership] = await db
    .select({
      id: memberships.id,
      role: memberships.role,
      organizationId: memberships.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      userId: memberships.userId,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!membership) {
    redirect("/login");
  }

  return {
    session,
    membership,
    orgId: membership.organizationId,
    orgName: membership.organizationName,
    userId: session.user.id,
  };
}

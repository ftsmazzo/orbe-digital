import { eq } from "drizzle-orm";
import { buildOrgCalendarIcs, icsResponse } from "@/lib/agenda/ics";
import { verifyCalendarToken } from "@/lib/agenda/feed-token";
import { db, organizations } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const orgId = verifyCalendarToken(token);
  if (!orgId) {
    return new Response("Calendario nao encontrado.", { status: 404 });
  }

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!org) {
    return new Response("Calendario nao encontrado.", { status: 404 });
  }

  const body = await buildOrgCalendarIcs(org.id, org.name);
  return icsResponse(body, "subscribe", "orbe-agenda.ics");
}

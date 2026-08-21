import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { CRM_STAGES } from "@orbe/shared";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

const clientSchema = z.object({
  name: z.string().min(1),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  sector: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  stage: z.enum(CRM_STAGES).default("lead"),
});

export async function GET() {
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(clients).where(eq(clients.organizationId, orgId));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { orgId } = await getCurrentOrg();
  const input = clientSchema.parse(await request.json());
  const [client] = await db.insert(clients).values({ ...input, organizationId: orgId }).returning();
  return NextResponse.json(client, { status: 201 });
}

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ACTION_STATUSES, PERSPECTIVES } from "@orbe/shared";
import { actionItems, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

const actionSchema = z.object({
  title: z.string().min(1),
  how: z.string().optional(),
  sector: z.string().optional(),
  ownerName: z.string().optional(),
  perspective: z.enum(PERSPECTIVES).optional(),
  status: z.enum(ACTION_STATUSES).default("nao_iniciado"),
  dueDate: z.string().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId)));
  return NextResponse.json(rows);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const input = actionSchema.parse(await request.json());
  const [action] = await db
    .insert(actionItems)
    .values({ ...input, organizationId: orgId, clientId: id, dueDate: input.dueDate ? new Date(input.dueDate) : undefined })
    .returning();
  return NextResponse.json(action, { status: 201 });
}

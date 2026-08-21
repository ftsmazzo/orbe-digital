import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { CRM_STAGES } from "@orbe/shared";
import { clients, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  tradeName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  stage: z.enum(CRM_STAGES).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  return client ? NextResponse.json(client) : NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const input = patchSchema.parse(await request.json());
  const [client] = await db
    .update(clients)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.organizationId, orgId)))
    .returning();
  return client ? NextResponse.json(client) : NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId)));
  return NextResponse.json({ ok: true });
}

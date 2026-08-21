import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { clients, db, diagnostics, proposals } from "@/lib/db";
import { generateProposalHtml } from "@/lib/agents/proposal";
import { getCurrentOrg } from "@/lib/org";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(proposals).where(and(eq(proposals.clientId, id), eq(proposals.organizationId, orgId)));
  return NextResponse.json(rows);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
  const [diagnostic] = await db.select().from(diagnostics).where(and(eq(diagnostics.clientId, id), eq(diagnostics.organizationId, orgId))).orderBy(desc(diagnostics.createdAt)).limit(1);
  const [proposal] = await db.insert(proposals).values({
    organizationId: orgId,
    clientId: id,
    title: `Proposta ORBE - ${client.name}`,
    contentHtml: generateProposalHtml(client, diagnostic),
    status: "rascunho",
  }).returning();
  return NextResponse.json(proposal, { status: 201 });
}

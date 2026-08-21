import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { actionItems, clients, db, indicators, reports } from "@/lib/db";
import { generateReportHtml } from "@/lib/agents/report";
import { getCurrentOrg } from "@/lib/org";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(reports).where(and(eq(reports.clientId, id), eq(reports.organizationId, orgId)));
  return NextResponse.json(rows);
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [client] = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.organizationId, orgId))).limit(1);
  if (!client) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
  const [indicatorRows, actionRows] = await Promise.all([
    db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
    db.select().from(actionItems).where(and(eq(actionItems.clientId, id), eq(actionItems.organizationId, orgId))),
  ]);
  const [report] = await db.insert(reports).values({
    organizationId: orgId,
    clientId: id,
    type: "mensal",
    title: `Relatorio ORBE - ${client.name}`,
    contentHtml: generateReportHtml(client, indicatorRows, actionRows),
  }).returning();
  return NextResponse.json(report, { status: 201 });
}

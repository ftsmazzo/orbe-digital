import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { diagnostics, db } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const body = await request.json();
  const [diagnostic] = await db
    .update(diagnostics)
    .set({
      payload: body.payload,
      maturity: body.maturity,
      gaps: body.gaps,
      priorities: body.priorities,
      risks: body.risks,
      openQuestions: body.openQuestions,
      updatedAt: new Date(),
    })
    .where(and(eq(diagnostics.id, id), eq(diagnostics.organizationId, orgId)))
    .returning();
  return diagnostic ? NextResponse.json(diagnostic) : NextResponse.json({ error: "Diagnostico nao encontrado" }, { status: 404 });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId, userId } = await getCurrentOrg();
  const [diagnostic] = await db
    .update(diagnostics)
    .set({ validated: true, validatedAt: new Date(), validatedById: userId, updatedAt: new Date() })
    .where(and(eq(diagnostics.id, id), eq(diagnostics.organizationId, orgId)))
    .returning();
  return diagnostic ? NextResponse.json(diagnostic) : NextResponse.json({ error: "Diagnostico nao encontrado" }, { status: 404 });
}

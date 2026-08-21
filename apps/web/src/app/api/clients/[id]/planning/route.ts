import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PERSPECTIVES } from "@orbe/shared";
import { db, goals, indicators } from "@/lib/db";
import { getCurrentOrg } from "@/lib/org";

const goalSchema = z.object({ type: z.literal("goal"), title: z.string().min(1), notes: z.string().optional(), year: z.number() });
const indicatorSchema = z.object({
  type: z.literal("indicator"),
  goalId: z.string().uuid().optional(),
  perspective: z.enum(PERSPECTIVES),
  name: z.string().min(1),
  direction: z.string().default("aumentar"),
  unit: z.string().default("numero"),
  year: z.number(),
  planned: z.record(z.string(), z.number().nullable()).default({}),
  actual: z.record(z.string(), z.number().nullable()).default({}),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const [goalRows, indicatorRows] = await Promise.all([
    db.select().from(goals).where(and(eq(goals.clientId, id), eq(goals.organizationId, orgId))),
    db.select().from(indicators).where(and(eq(indicators.clientId, id), eq(indicators.organizationId, orgId))),
  ]);
  return NextResponse.json({ goals: goalRows, indicators: indicatorRows });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await getCurrentOrg();
  const body = await request.json();
  if (body.type === "goal") {
    const input = goalSchema.parse(body);
    const [goal] = await db.insert(goals).values({ organizationId: orgId, clientId: id, title: input.title, notes: input.notes, year: input.year }).returning();
    return NextResponse.json(goal, { status: 201 });
  }
  const input = indicatorSchema.parse(body);
  const [indicator] = await db.insert(indicators).values({ ...input, organizationId: orgId, clientId: id }).returning();
  return NextResponse.json(indicator, { status: 201 });
}

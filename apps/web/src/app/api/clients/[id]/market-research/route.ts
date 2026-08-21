import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { PERSPECTIVES, type Perspective } from "@orbe/shared";
import { clients, db, indicators, marketInsights } from "@/lib/db";
import { researchMarketEnriched, type MarketScope } from "@/lib/agents/market-research-apify";
import { requireOrg } from "@/lib/org";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const org = await requireOrg();
    if (!org) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

    const { id: clientId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const scope = (String(body.scope ?? "regional") as MarketScope) || "regional";
    if (scope !== "regional" && scope !== "global") {
      return NextResponse.json({ error: "Alcance invalido." }, { status: 400 });
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.organizationId, org.orgId)))
      .limit(1);
    if (!client) return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });

    const research = await researchMarketEnriched({
      clientName: client.name,
      sector: String(body.sector || client.sector || "servicos"),
      city: client.city,
      scope,
      region: String(body.region || client.city || ""),
      website: body.website ? String(body.website) : undefined,
    });

    const [insight] = await db
      .insert(marketInsights)
      .values({
        organizationId: org.orgId,
        clientId,
        scope: research.scope,
        region: research.region,
        sector: research.sector,
        summary:
          research.source === "heuristic"
            ? `[Heuristica] ${research.summary}`
            : `[Apify+Claude] ${research.summary}`,
        payload: research.payload,
      })
      .returning();

    const applyIndicators = Boolean(body.applyIndicators);
    let indicatorsCreated = 0;
    if (applyIndicators) {
      const year = new Date().getFullYear();
      for (const item of research.payload.indicadores_sugeridos) {
        const perspective = item.perspectiva as Perspective;
        if (!PERSPECTIVES.includes(perspective)) continue;
        await db.insert(indicators).values({
          organizationId: org.orgId,
          clientId,
          perspective,
          name: item.nome,
          direction: "aumentar",
          unit: item.unidade || "numero",
          year,
          planned: {},
          actual: {},
        });
        indicatorsCreated += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      source: research.source,
      insightId: insight.id,
      indicatorsCreated,
    });
  } catch (error) {
    console.error("[POST market-research]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha na pesquisa de mercado." },
      { status: 500 },
    );
  }
}

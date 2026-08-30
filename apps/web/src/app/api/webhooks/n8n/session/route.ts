import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { clients, consultingSessions, db, diagnostics } from "@/lib/db";
import { extractDiagnosticFromTranscript } from "@/lib/agents/extract";
import { retrieveKnowledge } from "@/lib/knowledge/retrieve";
import { persistFitFromTranscript } from "@/lib/sales/persist-fit";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  if (secret !== (process.env.N8N_CALLBACK_SECRET ?? "dev-callback")) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const sessionId = String(body.sessionId ?? "");
  const transcript = String(body.transcript ?? body.transcriptRaw ?? "");
  const [session] = await db.select().from(consultingSessions).where(eq(consultingSessions.id, sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });

  const knowledge = await retrieveKnowledge({
    orgId: session.organizationId,
    query: transcript.slice(0, 2000),
  });
  const extracted = await extractDiagnosticFromTranscript(transcript, body.clientName ?? "Cliente", knowledge);
  await db
    .update(consultingSessions)
    .set({
      transcriptRaw: transcript,
      transcriptSegments: Array.isArray(body.segments) ? body.segments : [{ speaker: "Cliente", text: transcript }],
      status: "pronto",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(consultingSessions.id, sessionId));

  await db.insert(diagnostics).values({
    organizationId: session.organizationId,
    clientId: session.clientId,
    sessionId,
    payload: extracted.payload,
    maturity: extracted.maturity,
    gaps: extracted.gaps,
    priorities: extracted.priorities,
    risks: extracted.risks,
    openQuestions: extracted.openQuestions,
  });

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
  await persistFitFromTranscript({
    orgId: session.organizationId,
    clientId: session.clientId,
    sessionId,
    sessionKind: session.kind,
    transcript,
    clientName: String(body.clientName ?? client?.name ?? "Cliente"),
  }).catch((error) => console.error("[n8n/session] fit", error));

  return NextResponse.json({ ok: true, source: extracted.source });
}

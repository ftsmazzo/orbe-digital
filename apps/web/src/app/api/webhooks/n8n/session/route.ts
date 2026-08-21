import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { consultingSessions, db, diagnostics } from "@/lib/db";
import { extractDiagnosticFromTranscript } from "@/lib/agents/extract";

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

  const extracted = extractDiagnosticFromTranscript(transcript, body.clientName ?? "Cliente");
  await db
    .update(consultingSessions)
    .set({
      transcriptRaw: transcript,
      transcriptSegments: Array.isArray(body.segments) ? body.segments : [{ speaker: "Cliente", text: transcript }],
      status: "pronto",
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

  return NextResponse.json({ ok: true });
}

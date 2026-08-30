import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { clients, consultingSessions, db } from "@/lib/db";
import { persistFitFromTranscript } from "@/lib/sales/persist-fit";
import { formatSessionMarkdown } from "@/lib/sessions/format-transcript";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  if (secret !== (process.env.N8N_CALLBACK_SECRET ?? "dev-callback")) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const sessionId = String(body.sessionId ?? "");
  const transcript = formatSessionMarkdown(String(body.transcript ?? body.transcriptRaw ?? ""));
  const [session] = await db.select().from(consultingSessions).where(eq(consultingSessions.id, sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });

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

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
  await persistFitFromTranscript({
    orgId: session.organizationId,
    clientId: session.clientId,
    sessionId,
    sessionKind: session.kind,
    transcript,
    clientName: String(body.clientName ?? client?.name ?? "Cliente"),
  }).catch((error) => console.error("[n8n/session] fit", error));

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { clients, consultingSessions, db, diagnostics } from "@/lib/db";
import { extractDiagnosticFromTranscript, mockTranscript } from "@/lib/agents/extract";
import { getCurrentOrg } from "@/lib/org";
import { putObject } from "@/lib/storage";

export async function GET() {
  const { orgId } = await getCurrentOrg();
  const rows = await db.select().from(consultingSessions).where(eq(consultingSessions.organizationId, orgId)).orderBy(desc(consultingSessions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { orgId, userId } = await getCurrentOrg();
  const formData = await request.formData();
  const clientId = String(formData.get("clientId") ?? "");
  const [client] = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId))).limit(1);
  if (!client) return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });

  const audio = formData.get("audio");
  const hasAudio = audio instanceof File && audio.size > 0;
  const [session] = await db
    .insert(consultingSessions)
    .values({
      organizationId: orgId,
      clientId,
      title: String(formData.get("title") || `Sessao ORBE - ${client.name}`),
      consentGiven: formData.get("consentGiven") === "true" || formData.get("consentGiven") === "on",
      consentAt: new Date(),
      status: hasAudio ? "processando" : "gravando",
      createdById: userId,
    })
    .returning();

  if (hasAudio) {
    const stored = await putObject(audio, `sessions/${session.id}`);
    await db.update(consultingSessions).set({ audioKey: stored.key, audioUrl: stored.url, mimeType: audio.type, status: "processando" }).where(eq(consultingSessions.id, session.id));

    if (process.env.N8N_WEBHOOK_STT) {
      await fetch(process.env.N8N_WEBHOOK_STT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, clientId, audioKey: stored.key, callbackSecret: process.env.N8N_CALLBACK_SECRET }),
      });
    } else {
      const transcript = mockTranscript(client.name);
      const extracted = extractDiagnosticFromTranscript(transcript, client.name);
      await db.update(consultingSessions).set({ transcriptRaw: transcript, transcriptSegments: [{ speaker: "ORBE", text: transcript }], status: "pronto" }).where(eq(consultingSessions.id, session.id));
      await db.insert(diagnostics).values({
        organizationId: orgId,
        clientId,
        sessionId: session.id,
        payload: extracted.payload,
        maturity: extracted.maturity,
        gaps: extracted.gaps,
        priorities: extracted.priorities,
        risks: extracted.risks,
        openQuestions: extracted.openQuestions,
      });
    }
  }

  return NextResponse.json(session, { status: 201 });
}

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { clients, consultingSessions, db, diagnostics } from "@/lib/db";
import { extractDiagnosticFromTranscript, mockTranscript } from "@/lib/agents/extract";
import { getCurrentOrg, requireOrg } from "@/lib/org";
import { putObject } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  const org = await requireOrg();
  if (!org) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const rows = await db
    .select()
    .from(consultingSessions)
    .where(eq(consultingSessions.organizationId, org.orgId))
    .orderBy(desc(consultingSessions.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const org = await requireOrg();
    if (!org) return NextResponse.json({ error: "Sessao expirada. Faca login de novo." }, { status: 401 });
    const { orgId, userId } = org;
    const formData = await request.formData();
    const clientId = String(formData.get("clientId") ?? "").trim();
    if (!clientId) {
      return NextResponse.json({ error: "Selecione um cliente." }, { status: 400 });
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    const audio = formData.get("audio");
    const hasAudio = audio instanceof File && audio.size > 0;
    const pastedTranscript = String(formData.get("transcript") ?? "").trim();
    const consent =
      formData.get("consentGiven") === "true" || formData.get("consentGiven") === "on";

    if (!hasAudio && !pastedTranscript) {
      return NextResponse.json(
        { error: "Envie audio gravado/arquivo ou cole a transcricao." },
        { status: 400 },
      );
    }

    const [session] = await db
      .insert(consultingSessions)
      .values({
        organizationId: orgId,
        clientId,
        title: String(formData.get("title") || `Sessao ORBE - ${client.name}`),
        consentGiven: consent,
        consentAt: consent ? new Date() : undefined,
        status: hasAudio || pastedTranscript ? "processando" : "gravando",
        createdById: userId,
      })
      .returning();

    if (pastedTranscript && !hasAudio) {
      const extracted = extractDiagnosticFromTranscript(pastedTranscript, client.name);
      await db
        .update(consultingSessions)
        .set({
          transcriptRaw: pastedTranscript,
          transcriptSegments: [{ speaker: "ORBE", text: pastedTranscript }],
          status: "pronto",
          updatedAt: new Date(),
        })
        .where(eq(consultingSessions.id, session.id));
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
    } else if (hasAudio && audio instanceof File) {
      const stored = await putObject(audio, `sessions/${session.id}`);
      await db
        .update(consultingSessions)
        .set({
          audioKey: stored.key,
          audioUrl: stored.url,
          mimeType: audio.type || "audio/mp4",
          status: "processando",
          updatedAt: new Date(),
        })
        .where(eq(consultingSessions.id, session.id));

      if (process.env.N8N_WEBHOOK_STT) {
        const baseUrl = process.env.BETTER_AUTH_URL ?? "";
        const callbackSecret = process.env.N8N_CALLBACK_SECRET ?? "dev-callback";
        await fetch(process.env.N8N_WEBHOOK_STT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            clientId,
            clientName: client.name,
            audioKey: stored.key,
            mimeType: audio.type || "audio/mp4",
            callbackSecret,
            audioDownloadUrl: `${baseUrl}/api/internal/sessions/${session.id}/audio`,
            callbackUrl: `${baseUrl}/api/webhooks/n8n/session`,
          }),
        }).catch(() => {
          // nao derruba a sessao se o webhook falhar; fica em processando
        });
      } else {
        const transcript = mockTranscript(client.name);
        const extracted = extractDiagnosticFromTranscript(transcript, client.name);
        await db
          .update(consultingSessions)
          .set({
            transcriptRaw: transcript,
            transcriptSegments: [{ speaker: "ORBE", text: transcript }],
            status: "pronto",
            updatedAt: new Date(),
          })
          .where(eq(consultingSessions.id, session.id));
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

    await db
      .update(clients)
      .set({ stage: "sessao", updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("[POST /api/sessions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar sessao." },
      { status: 500 },
    );
  }
}

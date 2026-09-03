import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { clients, consultingSessions, db } from "@/lib/db";
import { mockTranscript } from "@/lib/agents/extract";
import { requireOrg } from "@/lib/org";
import { persistFitFromTranscript } from "@/lib/sales/persist-fit";
import { formatSessionMarkdown } from "@/lib/sessions/format-transcript";
import { putObject } from "@/lib/storage";
import { audioTooLargeForWhisper, triggerSessionStt } from "@/lib/sessions/stt";

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

    const sessionKind = String(formData.get("kind") || "estrategica");
    const [session] = await db
      .insert(consultingSessions)
      .values({
        organizationId: orgId,
        clientId,
        title: String(formData.get("title") || `Sessao ORBE - ${client.name}`),
        kind: sessionKind,
        consentGiven: consent,
        consentAt: consent ? new Date() : undefined,
        status: hasAudio || pastedTranscript ? "processando" : "gravando",
        createdById: userId,
      })
      .returning();

    if (pastedTranscript && !hasAudio) {
      const transcript = formatSessionMarkdown(pastedTranscript);
      await db
        .update(consultingSessions)
        .set({
          transcriptRaw: transcript,
          transcriptSegments: [{ speaker: "ORBE", text: transcript }],
          status: "pronto",
          updatedAt: new Date(),
        })
        .where(eq(consultingSessions.id, session.id));
      await persistFitFromTranscript({
        orgId,
        clientId,
        sessionId: session.id,
        sessionKind,
        transcript,
        clientName: client.name,
      }).catch((error) => console.error("[sessions] fit", error));
    } else if (hasAudio && audio instanceof File) {
      try {
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
          if (audioTooLargeForWhisper(audio.size)) {
            await db
              .update(consultingSessions)
              .set({
                status: "erro",
                errorMessage:
                  "Audio acima de 24 MB — o Whisper nao aceita. Baixe, corte em trechos de ~20 min e envie de novo nesta sessao.",
                updatedAt: new Date(),
              })
              .where(eq(consultingSessions.id, session.id));
          } else {
            const fired = await triggerSessionStt({
              sessionId: session.id,
              clientId,
              clientName: client.name,
              audioKey: stored.key,
              mimeType: audio.type || "audio/mp4",
            });
            if (!fired.ok) {
              await db
                .update(consultingSessions)
                .set({
                  status: "erro",
                  errorMessage: fired.error,
                  updatedAt: new Date(),
                })
                .where(eq(consultingSessions.id, session.id));
              return NextResponse.json(
                { error: "Audio salvo, mas o STT nao aceitou o pedido. Tente de novo.", id: session.id },
                { status: 502 },
              );
            }
          }
        } else {
          const transcript = formatSessionMarkdown(mockTranscript(client.name));
          await db
            .update(consultingSessions)
            .set({
              transcriptRaw: transcript,
              transcriptSegments: [{ speaker: "ORBE", text: transcript }],
              status: "pronto",
              updatedAt: new Date(),
            })
            .where(eq(consultingSessions.id, session.id));
          await persistFitFromTranscript({
            orgId,
            clientId,
            sessionId: session.id,
            sessionKind,
            transcript,
            clientName: client.name,
          }).catch((error) => console.error("[sessions] fit", error));
        }
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Falha ao gravar/enviar audio.";
        await db
          .update(consultingSessions)
          .set({
            status: "erro",
            errorMessage: message,
            updatedAt: new Date(),
          })
          .where(eq(consultingSessions.id, session.id));
        return NextResponse.json({ error: message, id: session.id }, { status: 500 });
      }
    }

    await db
      .update(clients)
      .set({ stage: "sessao", updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.organizationId, orgId)));

    const [fresh] = await db
      .select()
      .from(consultingSessions)
      .where(eq(consultingSessions.id, session.id))
      .limit(1);
    return NextResponse.json(fresh ?? session, { status: 201 });
  } catch (error) {
    console.error("[POST /api/sessions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar sessao." },
      { status: 500 },
    );
  }
}

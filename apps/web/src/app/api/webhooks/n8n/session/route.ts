import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { clients, consultingSessions, db } from "@/lib/db";
import { persistFitFromTranscript } from "@/lib/sales/persist-fit";
import { formatSessionMarkdown } from "@/lib/sessions/format-transcript";
import { fireNextSttPart } from "@/lib/sessions/prepare-stt";
import {
  parseSttProgress,
  segmentsWithProgress,
  type SttProgress,
} from "@/lib/sessions/stt-progress";

export const runtime = "nodejs";
export const maxDuration = 120;

async function finishTranscript(opts: {
  sessionId: string;
  transcript: string;
  segments: { speaker?: string; text: string }[];
  clientName: string;
  organizationId: string;
  clientId: string;
  sessionKind: string;
}) {
  await db
    .update(consultingSessions)
    .set({
      transcriptRaw: opts.transcript,
      transcriptSegments: opts.segments,
      status: "pronto",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(consultingSessions.id, opts.sessionId));

  await persistFitFromTranscript({
    orgId: opts.organizationId,
    clientId: opts.clientId,
    sessionId: opts.sessionId,
    sessionKind: opts.sessionKind,
    transcript: opts.transcript,
    clientName: opts.clientName,
  }).catch((error) => console.error("[n8n/session] fit", error));
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  if (secret !== (process.env.N8N_CALLBACK_SECRET ?? "dev-callback")) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const body = await request.json();
  const sessionId = String(body.sessionId ?? "");
  const transcript = formatSessionMarkdown(String(body.transcript ?? body.transcriptRaw ?? ""));
  const [session] = await db.select().from(consultingSessions).where(eq(consultingSessions.id, sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
  const clientName = String(body.clientName ?? client?.name ?? "Cliente");
  const progress = parseSttProgress(session.transcriptSegments);
  const queryPart = url.searchParams.get("part");
  const bodyPart = body.partIndex ?? body.part;
  const incomingRun = url.searchParams.get("run") ?? body.sttRunId ?? body.runId;
  if (progress?.runId && incomingRun && String(incomingRun) !== progress.runId) {
    return NextResponse.json({ ok: true, stale: true });
  }
  const chunked = Boolean(progress && (progress.chunked || progress.total > 1));

  if (!chunked) {
    await finishTranscript({
      sessionId,
      transcript,
      segments: Array.isArray(body.segments) ? body.segments : [{ speaker: "Cliente", text: transcript }],
      clientName,
      organizationId: session.organizationId,
      clientId: session.clientId,
      sessionKind: session.kind,
    });
    return NextResponse.json({ ok: true });
  }

  const nextEmpty = progress!.texts.findIndex((text) => text == null);
  const parsedPart = Number(queryPart ?? bodyPart);
  const partIndex = Number.isInteger(parsedPart) && parsedPart >= 0 ? parsedPart : nextEmpty;
  if (partIndex < 0 || partIndex >= progress!.total) {
    return NextResponse.json({ error: "Parte STT invalida" }, { status: 400 });
  }

  if (progress!.texts[partIndex] != null) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const texts = [...progress!.texts];
  texts[partIndex] = transcript;
  const done = texts.filter((text) => text != null).length;
  const nextProgress: SttProgress = {
    ...progress!,
    texts,
    done,
    phase: done >= progress!.total ? "montando" : "transcrevendo",
    lastPartAt: new Date().toISOString(),
  };

  if (done < progress!.total) {
    await db
      .update(consultingSessions)
      .set({
        status: "processando",
        errorMessage: null,
        transcriptSegments: segmentsWithProgress(nextProgress, session.transcriptSegments),
        updatedAt: new Date(),
      })
      .where(eq(consultingSessions.id, sessionId));

    const fired = await fireNextSttPart(sessionId);
    if (!fired.ok) {
      await db
        .update(consultingSessions)
        .set({
          status: "erro",
          errorMessage: fired.error ?? "Falha ao disparar a proxima parte do audio.",
          updatedAt: new Date(),
        })
        .where(eq(consultingSessions.id, sessionId));
      return NextResponse.json({ error: fired.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, done, total: progress!.total });
  }

  const assembled = formatSessionMarkdown(
    texts
      .map((text) => (text ?? "").trim())
      .filter(Boolean)
      .join("\n\n"),
  );
  await finishTranscript({
    sessionId,
    transcript: assembled,
    segments: texts.map((text, index) => ({
      speaker: `Parte ${index + 1}`,
      text: text ?? "",
    })),
    clientName,
    organizationId: session.organizationId,
    clientId: session.clientId,
    sessionKind: session.kind,
  });

  return NextResponse.json({ ok: true, done, total: progress!.total });
}

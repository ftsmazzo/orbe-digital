import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { consultingSessions, db } from "@/lib/db";
import { getObject } from "@/lib/storage";
import { extensionForAudioMime } from "@/lib/sessions/split-audio";
import { nextPendingPartIndex, parseSttProgress } from "@/lib/sessions/stt-progress";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  return secret === (process.env.N8N_CALLBACK_SECRET ?? "dev-callback");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(eq(consultingSessions.id, id))
    .limit(1);

  if (!session?.audioKey) {
    return NextResponse.json({ error: "Audio nao encontrado" }, { status: 404 });
  }

  const url = new URL(request.url);
  const partParam = url.searchParams.get("part");
  const progress = parseSttProgress(session.transcriptSegments);

  let key = session.audioKey;
  let mime = session.mimeType;
  if (progress?.partKeys.length) {
    const requested = partParam != null ? Number(partParam) : nextPendingPartIndex(progress);
    const index = Number.isInteger(requested) && requested >= 0 ? requested : 0;
    const partKey = progress.partKeys[index];
    if (partKey) {
      key = partKey;
      mime = "audio/mpeg";
    }
  }

  const bytes = await getObject(key);
  if (!bytes) {
    return NextResponse.json({ error: "Arquivo indisponivel" }, { status: 404 });
  }

  const ext = extensionForAudioMime(mime);
  const contentType = mime || (ext === "m4a" ? "audio/mp4" : `audio/${ext}`);
  const body = Buffer.from(bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="session-${session.id}.${ext}"`,
      "cache-control": "no-store",
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const status = String(payload.status ?? "erro");
  const errorMessage = String(payload.errorMessage ?? payload.error ?? "Falha no STT");

  await db
    .update(consultingSessions)
    .set({
      status: status === "erro" || status === "error" ? "erro" : (status as "processando"),
      errorMessage,
      updatedAt: new Date(),
    })
    .where(and(eq(consultingSessions.id, id)));

  return NextResponse.json({ ok: true });
}

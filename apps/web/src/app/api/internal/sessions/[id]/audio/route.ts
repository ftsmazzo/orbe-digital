import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { consultingSessions, db } from "@/lib/db";
import { getObject } from "@/lib/storage";

function authorized(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  return secret === (process.env.N8N_CALLBACK_SECRET ?? "dev-callback");
}

/** Whisper/OpenAI valida pelo nome do arquivo — `.audio` é rejeitado. */
function extensionForMime(mime: string | null | undefined) {
  const m = (mime || "").toLowerCase().split(";")[0].trim();
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg") || m.includes("oga")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m === "audio/mpeg" || m === "audio/mp3" || m.includes("mpga")) return "mp3";
  if (m.includes("flac")) return "flac";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "m4a";
  return "webm";
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

  const bytes = await getObject(session.audioKey);
  if (!bytes) {
    return NextResponse.json({ error: "Arquivo indisponivel" }, { status: 404 });
  }

  const ext = extensionForMime(session.mimeType);
  const contentType = session.mimeType || (ext === "m4a" ? "audio/mp4" : `audio/${ext}`);
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

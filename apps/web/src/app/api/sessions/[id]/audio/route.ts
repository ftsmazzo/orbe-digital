import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { consultingSessions, db } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { getObject } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

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

/** Download autenticado para o consultor — nao depende do n8n. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const org = await requireOrg();
  if (!org) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await context.params;
  const [session] = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.id, id), eq(consultingSessions.organizationId, org.orgId)))
    .limit(1);

  if (!session?.audioKey) {
    return NextResponse.json({ error: "Audio nao encontrado nesta sessao." }, { status: 404 });
  }

  const bytes = await getObject(session.audioKey);
  if (!bytes) {
    return NextResponse.json({ error: "Arquivo indisponivel no armazenamento." }, { status: 404 });
  }

  const ext = extensionForMime(session.mimeType);
  const contentType = session.mimeType || (ext === "m4a" ? "audio/mp4" : `audio/${ext}`);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="sessao-${session.id}.${ext}"`,
      "cache-control": "no-store",
    },
  });
}

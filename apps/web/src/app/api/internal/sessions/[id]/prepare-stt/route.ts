import { NextResponse } from "next/server";
import { prepareAndStartStt } from "@/lib/sessions/prepare-stt";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request) {
  const secret = request.headers.get("x-orbe-callback-secret");
  return secret === (process.env.N8N_CALLBACK_SECRET ?? "dev-callback");
}

/** Job interno: detecta audio longo, quebra e dispara STT por parte. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prepareAndStartStt(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao preparar STT.";
    console.error("[prepare-stt]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

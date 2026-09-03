export const WHISPER_MAX_BYTES = 24 * 1024 * 1024;

export function audioTooLargeForWhisper(size: number) {
  return size > WHISPER_MAX_BYTES;
}

export async function triggerSessionStt(opts: {
  sessionId: string;
  clientId: string;
  clientName: string;
  audioKey: string;
  mimeType?: string | null;
  partIndex?: number;
  partTotal?: number;
  runId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const webhook = process.env.N8N_WEBHOOK_STT?.trim();
  if (!webhook) return { ok: false, error: "STT nao configurado (N8N_WEBHOOK_STT)." };

  const baseUrl = (process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "").replace(/\/$/, "");
  const callbackSecret = process.env.N8N_CALLBACK_SECRET ?? "dev-callback";
  const chunked = opts.partIndex != null && opts.partTotal != null && opts.partTotal > 1;
  const audioQuery = chunked ? `?part=${opts.partIndex}` : "";
  const callbackParams = new URLSearchParams();
  if (chunked) {
    callbackParams.set("part", String(opts.partIndex));
    callbackParams.set("total", String(opts.partTotal));
  }
  if (opts.runId) callbackParams.set("run", opts.runId);
  const callbackQuery = callbackParams.toString() ? `?${callbackParams.toString()}` : "";

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sessionId: opts.sessionId,
      clientId: opts.clientId,
      clientName: opts.clientName,
      audioKey: opts.audioKey,
      mimeType: opts.mimeType || "audio/webm",
      callbackSecret,
      partIndex: opts.partIndex,
      partTotal: opts.partTotal,
      sttRunId: opts.runId,
      audioDownloadUrl: `${baseUrl}/api/internal/sessions/${opts.sessionId}/audio${audioQuery}`,
      callbackUrl: `${baseUrl}/api/webhooks/n8n/session${callbackQuery}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, error: `Falha ao disparar STT (${response.status}). ${detail.slice(0, 200)}` };
  }
  return { ok: true };
}

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
}): Promise<{ ok: boolean; error?: string }> {
  const webhook = process.env.N8N_WEBHOOK_STT?.trim();
  if (!webhook) return { ok: false, error: "STT nao configurado (N8N_WEBHOOK_STT)." };

  const baseUrl = (process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "").replace(/\/$/, "");
  const callbackSecret = process.env.N8N_CALLBACK_SECRET ?? "dev-callback";

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
      audioDownloadUrl: `${baseUrl}/api/internal/sessions/${opts.sessionId}/audio`,
      callbackUrl: `${baseUrl}/api/webhooks/n8n/session`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, error: `Falha ao disparar STT (${response.status}). ${detail.slice(0, 200)}` };
  }
  return { ok: true };
}

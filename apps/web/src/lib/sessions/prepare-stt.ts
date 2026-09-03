import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { clients, consultingSessions, db } from "@/lib/db";
import { getObject, putBytes } from "@/lib/storage";
import {
  extensionForAudioMime,
  shouldSplitAudio,
  splitAudioToMp3Chunks,
  probeDurationSeconds,
} from "@/lib/sessions/split-audio";
import {
  parseSttProgress,
  segmentsWithProgress,
  type SttProgress,
} from "@/lib/sessions/stt-progress";
import { triggerSessionStt } from "@/lib/sessions/stt";

const preparing = new Set<string>();

async function failSession(sessionId: string, message: string) {
  await db
    .update(consultingSessions)
    .set({ status: "erro", errorMessage: message, updatedAt: new Date() })
    .where(eq(consultingSessions.id, sessionId));
}

async function saveProgress(
  sessionId: string,
  progress: SttProgress,
  extra?: { errorMessage?: string | null; status?: "processando" },
) {
  const [session] = await db
    .select({ transcriptSegments: consultingSessions.transcriptSegments })
    .from(consultingSessions)
    .where(eq(consultingSessions.id, sessionId))
    .limit(1);

  await db
    .update(consultingSessions)
    .set({
      status: extra?.status ?? "processando",
      errorMessage: extra?.errorMessage === undefined ? null : extra.errorMessage,
      transcriptSegments: segmentsWithProgress(progress, session?.transcriptSegments),
      updatedAt: new Date(),
    })
    .where(eq(consultingSessions.id, sessionId));
}

export async function markSttPreparing(sessionId: string) {
  const startedAt = new Date().toISOString();
  await saveProgress(sessionId, {
    v: 1,
    phase: "preparando",
    done: 0,
    total: 1,
    chunked: false,
    partKeys: [],
    texts: [null],
    startedAt,
    runId: randomUUID(),
  });
}

export async function fireNextSttPart(sessionId: string) {
  const [session] = await db.select().from(consultingSessions).where(eq(consultingSessions.id, sessionId)).limit(1);
  if (!session) return { ok: false as const, error: "Sessao nao encontrada" };
  const progress = parseSttProgress(session.transcriptSegments);
  if (!progress) return { ok: false as const, error: "Progresso STT ausente" };

  const next = progress.texts.findIndex((text) => text == null);
  if (next < 0) return { ok: true as const };

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
  const partKey = progress.partKeys[next] ?? session.audioKey;
  if (!partKey) return { ok: false as const, error: "Parte de audio ausente" };

  return triggerSessionStt({
    sessionId,
    clientId: session.clientId,
    clientName: client?.name ?? "Cliente",
    audioKey: partKey,
    mimeType: progress.partKeys.length ? "audio/mpeg" : session.mimeType,
    partIndex: progress.total > 1 ? next : undefined,
    partTotal: progress.total > 1 ? progress.total : undefined,
    runId: progress.runId,
  });
}

export async function prepareAndStartStt(sessionId: string) {
  if (preparing.has(sessionId)) return;
  preparing.add(sessionId);
  try {
    await prepareAndStartSttInner(sessionId);
  } finally {
    preparing.delete(sessionId);
  }
}

async function prepareAndStartSttInner(sessionId: string) {
  const [session] = await db.select().from(consultingSessions).where(eq(consultingSessions.id, sessionId)).limit(1);
  if (!session?.audioKey) {
    await failSession(sessionId, "Audio nao encontrado para transcrever.");
    return;
  }
  if (!process.env.N8N_WEBHOOK_STT?.trim()) {
    await failSession(sessionId, "STT nao configurado (N8N_WEBHOOK_STT).");
    return;
  }

  const existing = parseSttProgress(session.transcriptSegments);
  const startedAt = existing?.startedAt ?? new Date().toISOString();
  const runId = existing?.runId ?? randomUUID();
  await saveProgress(sessionId, {
    v: 1,
    phase: "preparando",
    done: 0,
    total: 1,
    chunked: false,
    partKeys: [],
    texts: [null],
    startedAt,
    runId,
  });

  const bytes = await getObject(session.audioKey);
  if (!bytes || bytes.length === 0) {
    await failSession(sessionId, "Arquivo de audio indisponivel no armazenamento.");
    return;
  }

  const tmp = await mkdtemp(path.join(tmpdir(), "orbe-stt-"));
  try {
    const ext = extensionForAudioMime(session.mimeType);
    const inputPath = path.join(tmp, `source.${ext}`);
    await writeFile(inputPath, Buffer.from(bytes));

    const duration = await probeDurationSeconds(inputPath);
    const split = shouldSplitAudio(bytes.length, duration);

    if (!split) {
      await saveProgress(sessionId, {
        v: 1,
        phase: "transcrevendo",
        done: 0,
        total: 1,
        chunked: false,
        partKeys: [],
        texts: [null],
        startedAt,
        runId,
      });
      const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
      const fired = await triggerSessionStt({
        sessionId,
        clientId: session.clientId,
        clientName: client?.name ?? "Cliente",
        audioKey: session.audioKey,
        mimeType: session.mimeType,
        runId,
      });
      if (!fired.ok) await failSession(sessionId, fired.error ?? "Falha ao disparar STT.");
      return;
    }

    const partPaths = await splitAudioToMp3Chunks(inputPath, path.join(tmp, "parts"));
    if (partPaths.length === 0) {
      await failSession(sessionId, "Nao foi possivel quebrar o audio para transcrever.");
      return;
    }

    const partKeys: string[] = [];
    for (let i = 0; i < partPaths.length; i += 1) {
      const buf = await readFile(partPaths[i]);
      const key = `sessions/${sessionId}/part-${String(i).padStart(3, "0")}.mp3`;
      await putBytes(buf, key, "audio/mpeg");
      partKeys.push(key);
    }

    const chunked = partKeys.length > 1;
    await saveProgress(sessionId, {
      v: 1,
      phase: "transcrevendo",
      done: 0,
      total: partKeys.length,
      chunked,
      partKeys,
      texts: partKeys.map(() => null),
      startedAt,
      runId,
    });

    const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId)).limit(1);
    const fired = await triggerSessionStt({
      sessionId,
      clientId: session.clientId,
      clientName: client?.name ?? "Cliente",
      audioKey: partKeys[0],
      mimeType: "audio/mpeg",
      partIndex: chunked ? 0 : undefined,
      partTotal: chunked ? partKeys.length : undefined,
      runId,
    });
    if (!fired.ok) await failSession(sessionId, fired.error ?? "Falha ao disparar STT.");
  } finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => undefined);
  }
}

export function enqueueSessionStt(sessionId: string) {
  after(async () => {
    try {
      await prepareAndStartStt(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao preparar transcricao.";
      console.error("[stt] prepare", error);
      await failSession(sessionId, message);
    }
  });
}

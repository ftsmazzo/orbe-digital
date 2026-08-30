import { and, asc, eq } from "drizzle-orm";
import { clientDocuments, consultingSessions, db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { formatSessionMarkdown, SESSION_KIND_LABEL } from "@/lib/sessions/format-transcript";

export const SESSION_MEMORY_KIND = "memoria";
export const SESSION_MEMORY_TITLE = "Memoria das sessoes";

type MemoryPayload = {
  sessionIds?: string[];
  sessionCount?: number;
  rebuiltAt?: string;
};

export async function loadSessionMemory(orgId: string, clientId: string) {
  const [row] = await db
    .select()
    .from(clientDocuments)
    .where(
      and(
        eq(clientDocuments.organizationId, orgId),
        eq(clientDocuments.clientId, clientId),
        eq(clientDocuments.kind, SESSION_MEMORY_KIND),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function loadSessionsWithText(orgId: string, clientId: string) {
  const rows = await db
    .select()
    .from(consultingSessions)
    .where(and(eq(consultingSessions.organizationId, orgId), eq(consultingSessions.clientId, clientId)))
    .orderBy(asc(consultingSessions.createdAt));
  return rows.filter((row) => row.transcriptRaw?.trim());
}

export function buildSessionMemoryMarkdown(
  clientName: string,
  sessions: { id: string; title: string; kind: string; createdAt: Date; transcriptRaw: string | null }[],
) {
  const chapters = sessions.map((session, index) => {
    const kind = SESSION_KIND_LABEL[session.kind] ?? session.kind;
    const body = formatSessionMarkdown(session.transcriptRaw ?? "");
    return `## Sessao ${index + 1} — ${session.title}\n\n- Tipo: ${kind}\n- Data: ${formatDateTime(session.createdAt)}\n\n${body}`;
  });

  return [
    `# Memoria das sessoes — ${clientName}`,
    "",
    "Documento vivo. Cada reuniao entra como um capitulo. Fit comercial e ciclo ORBE leem daqui, nao de cada sessao isolada.",
    "",
    `${sessions.length} sessao(oes) no acervo.`,
    "",
    chapters.join("\n\n---\n\n"),
  ].join("\n");
}

export async function rebuildSessionMemory(opts: { orgId: string; clientId: string; clientName: string }) {
  const sessions = await loadSessionsWithText(opts.orgId, opts.clientId);
  const markdown = sessions.length
    ? buildSessionMemoryMarkdown(opts.clientName, sessions)
    : `# Memoria das sessoes — ${opts.clientName}\n\nAinda nao ha transcricao nesta empresa.`;
  const payload: MemoryPayload = {
    sessionIds: sessions.map((row) => row.id),
    sessionCount: sessions.length,
    rebuiltAt: new Date().toISOString(),
  };

  const existing = await loadSessionMemory(opts.orgId, opts.clientId);
  if (existing) {
    const [updated] = await db
      .update(clientDocuments)
      .set({
        title: SESSION_MEMORY_TITLE,
        extractedText: markdown,
        status: sessions.length ? "pronto" : "recebido",
        source: "sessoes",
        payload,
        updatedAt: new Date(),
      })
      .where(eq(clientDocuments.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(clientDocuments)
    .values({
      organizationId: opts.orgId,
      clientId: opts.clientId,
      title: SESSION_MEMORY_TITLE,
      kind: SESSION_MEMORY_KIND,
      mimeType: "text/markdown",
      extractedText: markdown,
      status: sessions.length ? "pronto" : "recebido",
      source: "sessoes",
      payload,
    })
    .returning();
  return created;
}

export async function ensureSessionMemory(opts: { orgId: string; clientId: string; clientName: string }) {
  const sessions = await loadSessionsWithText(opts.orgId, opts.clientId);
  const memory = await loadSessionMemory(opts.orgId, opts.clientId);
  const stored = ((memory?.payload ?? {}) as MemoryPayload).sessionIds ?? [];
  const current = sessions.map((row) => row.id);
  const same = current.length === stored.length && current.every((id, index) => id === stored[index]);
  if (memory && same) return memory;
  return rebuildSessionMemory(opts);
}

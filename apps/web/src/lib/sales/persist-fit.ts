import { and, eq } from "drizzle-orm";
import type { SalesQualification } from "@orbe/shared";
import { clients, db } from "@/lib/db";
import { suggestFitFromTranscript } from "@/lib/sales/suggest-fit";
import { ensureSessionMemory } from "@/lib/sessions/session-memory";

export async function persistFitFromTranscript(opts: {
  orgId: string;
  clientId: string;
  sessionId?: string;
  sessionKind?: string | null;
  transcript: string;
  clientName: string;
  force?: boolean;
}) {
  const kind = opts.sessionKind ?? "";
  if (!opts.force && kind && kind !== "estrategica") {
    await ensureSessionMemory({
      orgId: opts.orgId,
      clientId: opts.clientId,
      clientName: opts.clientName,
    });
    return { skipped: "nao_estrategica" as const };
  }

  const memory = await ensureSessionMemory({
    orgId: opts.orgId,
    clientId: opts.clientId,
    clientName: opts.clientName,
  });
  const text = memory?.extractedText?.trim() || opts.transcript.trim();
  if (!text) return { skipped: "sem transcricao" as const };

  const [client] = await db
    .select({ salesQualification: clients.salesQualification })
    .from(clients)
    .where(and(eq(clients.id, opts.clientId), eq(clients.organizationId, opts.orgId)))
    .limit(1);
  if (!client) return { skipped: "cliente" as const };

  const current = (client.salesQualification ?? {}) as SalesQualification;
  const suggestion = await suggestFitFromTranscript(text, opts.clientName);

  const next: SalesQualification = {
    ...current,
    criteria: suggestion.criteria,
    score: suggestion.score,
    scoreLabel: suggestion.label,
    suggestedLabel: suggestion.label,
    suggestedReasons: suggestion.reasons,
    suggestedAt: new Date().toISOString(),
    suggestedSessionId: opts.sessionId,
  };

  await db
    .update(clients)
    .set({ salesQualification: next, updatedAt: new Date() })
    .where(and(eq(clients.id, opts.clientId), eq(clients.organizationId, opts.orgId)));

  return { label: suggestion.label, score: suggestion.score };
}

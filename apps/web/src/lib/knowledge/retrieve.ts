import { eq } from "drizzle-orm";
import { db, knowledgeChunks, knowledgeSources } from "@/lib/db";
import { formatMethodForPrompt } from "@/lib/agents/tools/method-canon";
import { cardsForQuery, formatCardsForPrompt, type PrincipleCard } from "@/lib/knowledge/canon";
import type { Perspective } from "@orbe/shared";

export async function retrieveKnowledge(opts: {
  orgId: string;
  query: string;
  perspective?: Perspective;
}): Promise<string> {
  const cards = cardsForQuery(opts.query, opts.perspective, 5);
  const cardBlock = formatCardsForPrompt(cards);

  const sources = await db
    .select()
    .from(knowledgeSources)
    .where(eq(knowledgeSources.organizationId, opts.orgId));
  if (!sources.length) {
    return `${formatMethodForPrompt()}\n\nBASE PRINCIPIOS ORBE (fichas):\n${cardBlock}`;
  }

  const sourceIds = sources.map((s) => s.id);
  const chunks = await db.select().from(knowledgeChunks).where(eq(knowledgeChunks.organizationId, opts.orgId));
  const qTokens = opts.query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  const ranked = chunks
    .map((chunk) => {
      const hay = chunk.content.toLowerCase();
      const src = sources.find((s) => s.id === chunk.sourceId);
      let score = src?.weight ?? 1;
      for (const t of qTokens) if (hay.includes(t)) score += 1;
      return { chunk, src, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const uploaded = ranked
    .map((r) => `[Upload: ${r.src?.title ?? "fonte"}]\n${r.chunk.content.slice(0, 900)}`)
    .join("\n\n");

  void sourceIds;
  return `${formatMethodForPrompt()}\n\nBASE PRINCIPIOS ORBE (fichas):\n${cardBlock}\n\nTRECHOS ENVIADOS PELO CONSULTOR:\n${uploaded || "(nenhum PDF ainda)"}`;
}

export type { PrincipleCard };

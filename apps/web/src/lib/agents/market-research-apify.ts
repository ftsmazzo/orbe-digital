import { completeJson, hasAnthropicKey } from "@/lib/ai/claude";
import { crawlWebsite, hasApifyToken, runGoogleSearch, type CrawlPage, type SearchHit } from "@/lib/apify/client";
import {
  researchMarket,
  type MarketResearchInput,
  type MarketResearchResult,
  type MarketScope,
} from "@/lib/agents/market-research";
import { researchMarketFromWeb } from "@/lib/agents/market-research-web";

type ClaudeMarketResponse = {
  summary?: string;
  indicadores_sugeridos?: { perspectiva: string; nome: string; unidade: string; referencia: string }[];
  contexto_mercado?: string[];
  riscos_mercado?: string[];
  oportunidades?: string[];
  perguntas_validadas?: string[];
  fontes_orientacao?: string[];
  personalizacao_comercial?: string[];
};

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

async function synthesizeWithClaude(opts: {
  input: MarketResearchInput;
  hits: SearchHit[];
  pages: CrawlPage[];
  knowledge?: string;
}): Promise<MarketResearchResult> {
  const { input, hits, pages } = opts;
  const sector = (input.sector || "servicos").trim();
  const region =
    input.scope === "global"
      ? input.region?.trim() || "mercado amplo"
      : input.region?.trim() || input.city?.trim() || "regiao do cliente";

  const system = `Voce e o pesquisador de mercado do Metodo ORBE (fase R - Resultar).
Sintetize insights acionaveis para planejamento de metas/KPIs.
Nao invente numeros oficiais. Se nao houver dado confiavel, diga para validar com o cliente.
Responda SOMENTE JSON.`;

  const user = `Cliente: ${input.clientName}
Setor: ${sector}
Escopo: ${input.scope}
Regiao/alcance: ${region}

Resultados de busca (Apify):
${JSON.stringify(hits.slice(0, 8), null, 2)}

Paginas do site do cliente (se houver):
${JSON.stringify(
  pages.map((p) => ({ url: p.url, title: p.title, text: p.text.slice(0, 1500) })),
  null,
  2,
)}

Principios ORBE (fonte; nao inventar numero):
${(opts.knowledge ?? "").slice(0, 2500)}

Retorne:
{
  "summary": "string",
  "indicadores_sugeridos": [{ "perspectiva": "financeira|clientes|processos|aprendizagem", "nome": "", "unidade": "", "referencia": "" }],
  "contexto_mercado": [],
  "riscos_mercado": [],
  "oportunidades": [],
  "perguntas_validadas": [],
  "fontes_orientacao": ["inclua URLs quando disponiveis"],
  "personalizacao_comercial": []
}`;

  const raw = await completeJson<ClaudeMarketResponse>({ system, user, maxTokens: 3500 });
  const fontes = list(raw.fontes_orientacao);
  const fromHits = hits
    .filter((h) => h.url)
    .slice(0, 6)
    .map((h) => `${h.title || "Fonte"}: ${h.url}`);

  return {
    summary:
      raw.summary?.trim() ||
      `Pesquisa ${input.scope} (Apify+Claude) para ${input.clientName} — ${sector} / ${region}.`,
    scope: input.scope,
    region,
    sector,
    payload: {
      alcance: input.scope === "regional" ? "regional" : "global",
      indicadores_sugeridos: Array.isArray(raw.indicadores_sugeridos)
        ? raw.indicadores_sugeridos.map((item) => ({
            perspectiva: String(item.perspectiva ?? "financeira"),
            nome: String(item.nome ?? "Indicador"),
            unidade: String(item.unidade ?? "numero"),
            referencia: String(item.referencia ?? "Validar com o cliente."),
          }))
        : researchMarket(input).payload.indicadores_sugeridos,
      contexto_mercado: list(raw.contexto_mercado),
      riscos_mercado: list(raw.riscos_mercado),
      oportunidades: list(raw.oportunidades),
      perguntas_validadas: list(raw.perguntas_validadas),
      fontes_orientacao: [...new Set([...fontes, ...fromHits])].slice(0, 12),
      personalizacao_comercial: list(raw.personalizacao_comercial),
      coleta: {
        provider: "apify+claude",
        searchHits: hits.length,
        crawlPages: pages.length,
      },
    },
  };
}

export async function researchMarketEnriched(
  input: MarketResearchInput & { website?: string | null; knowledge?: string },
): Promise<MarketResearchResult & { source: "apify+claude" | "tavily+llm" | "sonar+llm" | "heuristic" }> {
  if (!hasApifyToken()) {
    const web = await researchMarketFromWeb(input).catch(() => null);
    if (web) return web;
    return { ...researchMarket(input), source: "heuristic" };
  }

  const sector = (input.sector || "servicos").trim();
  const place =
    input.scope === "regional"
      ? input.region?.trim() || input.city?.trim() || "Brasil"
      : input.region?.trim() || "Brasil / global";

  const queries =
    input.scope === "regional"
      ? [
          `${sector} mercado ${place}`,
          `${sector} concorrentes ${place}`,
        ]
      : [
          `${sector} market trends Brasil`,
          `${sector} benchmarks industria`,
        ];

  try {
    const [hits, pages] = await Promise.all([
      runGoogleSearch(queries, 8),
      input.website?.trim()
        ? crawlWebsite(input.website.trim(), 8).catch(() => [] as CrawlPage[])
        : Promise.resolve([] as CrawlPage[]),
    ]);

    if (hasAnthropicKey()) {
      try {
        const synthesized = await synthesizeWithClaude({ input, hits, pages, knowledge: input.knowledge });
        return { ...synthesized, source: "apify+claude" };
      } catch (error) {
        console.error("[market-research] Claude sintese falhou:", error);
      }
    }

    const base = researchMarket(input);
    return {
      ...base,
      summary: `${base.summary} (coleta Apify: ${hits.length} hits, ${pages.length} paginas — sintese heuristica).`,
      payload: {
        ...base.payload,
        fontes_orientacao: [
          ...hits.filter((h) => h.url).map((h) => `${h.title}: ${h.url}`),
          ...base.payload.fontes_orientacao,
        ].slice(0, 12),
      },
      source: "apify+claude",
    };
  } catch (error) {
    console.error("[market-research] Apify falhou, tentando busca web:", error);
    const web = await researchMarketFromWeb(input).catch(() => null);
    if (web) return web;
    return { ...researchMarket(input), source: "heuristic" };
  }
}

export type { MarketScope, MarketResearchInput, MarketResearchResult };

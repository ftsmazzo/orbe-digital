import { completeJson, hasOpenRouterKey } from "@/lib/ai/claude";
import type { MarketResearchInput, MarketResearchResult } from "@/lib/agents/market-research";

export type WebResearchSource = "tavily+llm" | "sonar+llm";

type SearchHit = { title: string; url: string; snippet: string };

function tavilyKey() {
  return process.env.TAVILY_API_KEY?.trim() || "";
}

export function hasWebResearch() {
  return Boolean(tavilyKey() || hasOpenRouterKey());
}

async function searchTavily(query: string): Promise<SearchHit[]> {
  const key = tavilyKey();
  if (!key) return [];
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: "basic",
      max_results: 8,
      include_answer: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`Tavily ${response.status}`);
  }
  const json = (await response.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return (json.results ?? []).map((row) => ({
    title: row.title ?? "Fonte",
    url: row.url ?? "",
    snippet: (row.content ?? "").slice(0, 400),
  }));
}

async function searchSonar(query: string): Promise<{ hits: SearchHit[]; answer: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() || process.env.OPEN_ROUTER_API_KEY?.trim();
  if (!apiKey) return { hits: [], answer: "" };
  const model = process.env.OPENROUTER_SEARCH_MODEL?.trim() || "perplexity/sonar";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.BETTER_AUTH_URL ?? "https://orbe-app.kxryyk.easypanel.host",
      "X-Title": "ORBE Digital",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "Pesquise na web. Responda em portugues, curto. Nao invente numero oficial. Cite URLs.",
        },
        { role: "user", content: query },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter search ${response.status}: ${detail.slice(0, 180)}`);
  }
  const json = (await response.json()) as {
    choices?: { message?: { content?: string; annotations?: { url?: string; title?: string }[] } }[];
    citations?: string[];
  };
  const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
  const citations = json.citations ?? [];
  const hits = citations.slice(0, 8).map((url) => ({ title: url, url, snippet: "" }));
  return { hits, answer };
}

type Synth = {
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
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export async function researchMarketFromWeb(
  input: MarketResearchInput & { knowledge?: string },
): Promise<(MarketResearchResult & { source: WebResearchSource }) | null> {
  const sector = (input.sector || "servicos").trim();
  const place =
    input.scope === "regional"
      ? input.region?.trim() || input.city?.trim() || "Brasil"
      : input.region?.trim() || "Brasil";
  const query = `${sector} mercado ${place} concorrentes tendencias ${input.clientName}`;

  let hits: SearchHit[] = [];
  let answer = "";
  let source: WebResearchSource = "sonar+llm";

  if (tavilyKey()) {
    hits = await searchTavily(query);
    source = "tavily+llm";
  } else if (hasOpenRouterKey()) {
    const sonar = await searchSonar(query);
    hits = sonar.hits;
    answer = sonar.answer;
    source = "sonar+llm";
  } else {
    return null;
  }

  if (!hits.length && !answer) return null;

  const raw = await completeJson<Synth>({
    system: `Voce sintetiza pesquisa de mercado para o Metodo ORBE (fase R).
Use so o que as fontes sustentam. Nao invente numero oficial. JSON somente.`,
    user: `Cliente: ${input.clientName}
Setor: ${sector}
Regiao: ${place}

Resposta da busca:
${answer.slice(0, 4000)}

Fontes:
${JSON.stringify(hits.slice(0, 8))}

Principios:
${(input.knowledge ?? "").slice(0, 1500)}

Retorne:
{
  "summary": "",
  "indicadores_sugeridos": [{ "perspectiva": "financeira|clientes|processos|aprendizagem", "nome": "", "unidade": "", "referencia": "validar com o cliente" }],
  "contexto_mercado": [],
  "riscos_mercado": [],
  "oportunidades": [],
  "perguntas_validadas": [],
  "fontes_orientacao": [],
  "personalizacao_comercial": []
}`,
    maxTokens: 2500,
  });

  const region = place;
  return {
    source,
    summary: raw.summary?.trim() || `Pesquisa web (${source}) — ${sector} / ${place}.`,
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
        : [],
      contexto_mercado: list(raw.contexto_mercado),
      riscos_mercado: list(raw.riscos_mercado),
      oportunidades: list(raw.oportunidades),
      perguntas_validadas: list(raw.perguntas_validadas),
      fontes_orientacao: [
        ...list(raw.fontes_orientacao),
        ...hits.filter((hit) => hit.url).map((hit) => `${hit.title}: ${hit.url}`),
      ].slice(0, 12),
      personalizacao_comercial: list(raw.personalizacao_comercial),
      coleta: { provider: source, searchHits: hits.length },
    },
  };
}

import type { MarketResearchInput, MarketResearchResult, MarketScope } from "@/lib/agents/market-research";
import { researchMarketFromWeb } from "@/lib/agents/market-research-web";

export async function researchMarketEnriched(
  input: MarketResearchInput & { website?: string | null; knowledge?: string },
): Promise<MarketResearchResult & { source: "tavily+llm" | "sonar+llm" }> {
  const web = await researchMarketFromWeb(input);
  if (!web) {
    throw new Error(
      "Pesquisa R precisa de TAVILY_API_KEY ou OpenRouter (perplexity/sonar). Nao inventamos mercado.",
    );
  }
  return web;
}

export type { MarketScope, MarketResearchInput, MarketResearchResult };

export type MarketScope = "regional" | "global";

export type MarketResearchInput = {
  clientName: string;
  sector?: string | null;
  city?: string | null;
  scope: MarketScope;
  region?: string | null;
};

export type MarketResearchResult = {
  summary: string;
  scope: MarketScope;
  region: string;
  sector: string;
  payload: {
    alcance: string;
    indicadores_sugeridos: { perspectiva: string; nome: string; unidade: string; referencia: string }[];
    contexto_mercado: string[];
    riscos_mercado: string[];
    oportunidades: string[];
    perguntas_validadas: string[];
    fontes_orientacao: string[];
    personalizacao_comercial: string[];
  };
};

export function researchMarket(input: MarketResearchInput): MarketResearchResult {
  const sector = (input.sector || "servicos").trim();
  const city = (input.city || "").trim();
  const region =
    input.scope === "global"
      ? input.region?.trim() || "mercado global / multiplo"
      : input.region?.trim() || city || "regiao do cliente (a validar)";

  const isRetail = /moda|varejo|comercio|alim|loja|confec/i.test(sector);
  const isService = /servic|consult|agencia|saas|tech|ti/i.test(sector);

  const indicadores = [
    {
      perspectiva: "financeira",
      nome: isRetail ? "Margem bruta (%)" : "Margem de contribuicao (%)",
      unidade: "percentual",
      referencia:
        input.scope === "regional"
          ? `Comparar com media do setor ${sector} na regiao ${region} (faixa tipica a validar com dados locais).`
          : `Benchmark setorial amplo para ${sector} em mercados de maior escala.`,
    },
    {
      perspectiva: "clientes",
      nome: isRetail ? "Ticket medio (R$)" : "Receita recorrente / cliente (R$)",
      unidade: "numero",
      referencia:
        input.scope === "regional"
          ? `Ajustar ao poder de compra e concorrencia local em ${region}.`
          : "Usar referencias nacionais/internacionais do segmento e canais digitais.",
    },
    {
      perspectiva: "processos",
      nome: "Prazo medio de ciclo (dias)",
      unidade: "numero",
      referencia: "Do pedido/lead ate recebimento ou entrega — comparar com praticas do setor.",
    },
    {
      perspectiva: "aprendizagem",
      nome: "Rotina de revisao de indicadores (vezes/mes)",
      unidade: "numero",
      referencia: "Meta tipica ORBE: ritual semanal ou quinzenal com donos claros.",
    },
  ];

  if (isService) {
    indicadores.push({
      perspectiva: "clientes",
      nome: "Taxa de conversao comercial (%)",
      unidade: "percentual",
      referencia: "Personalizar funil conforme canal dominante na regiao ou no mercado-alvo.",
    });
  }

  const contexto =
    input.scope === "regional"
      ? [
          `Empresa ${input.clientName} com foco regional em ${region}, setor ${sector}.`,
          "Priorizar concorrentes locais, sazonalidade da cidade/UF e canais de aquisicao presenciais + digitais da praca.",
          "Indicadores devem refletir realidade de demanda e custo locais, nao so medias nacionais.",
        ]
      : [
          `Empresa ${input.clientName} com alcance global/amplo no setor ${sector}.`,
          "Priorizar tendencias de categoria, canais digitais escalaveis e benchmarks de players maiores.",
          "Separar metas por mercado-alvo (pais/regiao) quando o comercial for multiplo.",
        ];

  const oportunidades =
    input.scope === "regional"
      ? [
          "Posicionamento hiperlocal na proposta comercial (praça, publico e diferenciais da regiao).",
          "Parcerias e canais de indicacao locais.",
          isRetail ? "Campanhas sazonais alinhadas ao calendario da cidade." : "Ofertas recorrentes calibradas ao ticket local.",
        ]
      : [
          "Narrativa comercial por persona/mercado, nao generica.",
          "Pacotes e precificacao adaptados a diferentes geografias.",
          "Uso de canais digitais 24x7 como opcional (add-on), sem misturar ao nucleo ORBE.",
        ];

  const personalizacao = [
    "Usar estes indicadores como base do Resultar (metas/KPIs) antes de fechar a proposta.",
    "Validar faixas numericas com o cliente — este rascunho nao inventa numeros oficiais.",
    input.scope === "regional"
      ? `Deixar explícito na proposta: contexto de ${region}.`
      : "Deixar explícito na proposta: alcance amplo/global e premissas por mercado.",
  ];

  const summary =
    input.scope === "regional"
      ? `Pesquisa regional (rascunho) para ${input.clientName} em ${region}, setor ${sector}: sugerimos indicadores e angulos comerciais calibrados a praca local.`
      : `Pesquisa de mercado amplo/global (rascunho) para ${input.clientName}, setor ${sector}: sugerimos benchmarks de categoria e personalizacao comercial por alcance.`;

  return {
    summary,
    scope: input.scope,
    region,
    sector,
    payload: {
      alcance: input.scope === "regional" ? "regional" : "global",
      indicadores_sugeridos: indicadores,
      contexto_mercado: contexto,
      riscos_mercado: [
        "Dados de mercado sem fonte primaria devem ser validados antes de apresentar ao cliente.",
        "Concorrencia e sazonalidade mudam rapidamente — revisar a cada ciclo.",
      ],
      oportunidades,
      perguntas_validadas: [
        "Qual a area geografica real de atuacao hoje?",
        "Quais 3 concorrentes o cliente mais sente na pratica?",
        "Quais indicadores ja acompanha (mesmo que informalmente)?",
      ],
      fontes_orientacao: [
        "Heuristica ORBE + setor/cidade informados no CRM (rascunho).",
        "Proximo passo: enriquecer com fontes oficiais/IBGE/setoriais ou agente web quando disponivel.",
      ],
      personalizacao_comercial: personalizacao,
    },
  };
}

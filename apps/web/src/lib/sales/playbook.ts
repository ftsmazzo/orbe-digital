import type { OrgPriceBookItem, OrgSettings } from "@orbe/shared";

/** Playbook comercial padrao (Metodologia de vendas.xlsx). */
export const DEFAULT_SALES_PLAYBOOK = {
  version: 1,
  opening: {
    title: "Abertura – posicionamento",
    script:
      "O objetivo dessa conversa nao e vender nada agora. E entender seu negocio, identificar gargalos estrategicos e ver se faz sentido um acompanhamento.",
  },
  sections: [
    {
      id: "contexto",
      title: "Contexto do negocio",
      questions: [
        "Hoje, como o negocio gera receita?",
        "Quais sao suas principais linhas de faturamento?",
        "Quantas pessoas estao envolvidas na operacao?",
        "Qual foi o faturamento medio dos ultimos meses?",
      ],
    },
    {
      id: "problema",
      title: "Problema central",
      questions: [
        "Qual e o principal problema que mais te tira energia hoje?",
        "Onde voce sente que toma decisoes no escuro?",
        "Se isso continuar igual pelos proximos 6 meses, o que acontece?",
        "Por que isso ainda nao foi resolvido?",
        "O que voce ja tentou?",
      ],
    },
    {
      id: "impacto",
      title: "Impacto financeiro e estrategico",
      questions: [
        "Quanto esse problema custa por mes (estimado)?",
        "Qual decisao voce adia por falta de clareza?",
      ],
    },
    {
      id: "caminho",
      title: "Caminho e fechamento mental",
      questions: [
        "Se eu te devolver clareza de direcao e rotina de CEO em 90-180 dias, o que muda?",
        "Quem decide o investimento alem de voce?",
      ],
    },
  ],
  sheets: [
    "1. Conversa estrategica",
    "1. Conversa estrategica (copia)",
    "2. Entendendo o cliente",
    "3. Abordagem de fechamento",
    "4. Metas e politica de preco",
  ],
  qualificationCriteria: [
    { id: "responsabilidade", label: "Assume responsabilidade" },
    { id: "numeros", label: "Relacao com numeros" },
    { id: "disciplina", label: "Disciplina / comportamento" },
    { id: "investimento", label: "Relacao com investimento" },
    { id: "decisao", label: "Perfil decisorio" },
  ],
  pricePolicy: {
    principle: "Preco e filtro. Quem nao respeita o valor, nao respeita o processo.",
    neverAccept: [
      "Trabalhar so esse mes",
      "Reduzir escopo mantendo preco",
      "Ajustar valor para fechar logo",
    ],
    refuseScript:
      "Pelo que analisamos, acredito que este nao e o momento ideal para esse tipo de acompanhamento. Prefiro ser honesto agora.",
  },
} as const;

export const DEFAULT_PRICE_BOOK: OrgPriceBookItem[] = [
  {
    id: "diagnostico",
    name: "Diagnostico Estrategico",
    level: "diagnostico",
    minPrice: 1500,
    description: "Analise financeira e estrategica + 3 gargalos + direcionamento.",
  },
  {
    id: "ciclo",
    name: "Ciclo ORBE",
    level: "ciclo",
    minPrice: 4500,
    description: "Acompanhamento O-R-B-E com metas, KPIs e rotina.",
  },
  {
    id: "premium",
    name: "ORBE Premium",
    level: "premium",
    minPrice: 8000,
    description: "Poucos clientes, alto comprometimento, agenda prioritaria.",
  },
];

export function mergeOrgSettings(raw?: Record<string, unknown> | null): OrgSettings {
  const settings = (raw ?? {}) as OrgSettings;
  return {
    playbookVersion: settings.playbookVersion ?? DEFAULT_SALES_PLAYBOOK.version,
    priceBook: settings.priceBook?.length ? settings.priceBook : DEFAULT_PRICE_BOOK,
    monthlyRevenueGoal: settings.monthlyRevenueGoal ?? 50000,
    localHolidays: settings.localHolidays ?? [],
  };
}

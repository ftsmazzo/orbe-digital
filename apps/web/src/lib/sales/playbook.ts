import type { OrgPriceBookItem, OrgSettings } from "@orbe/shared";

/** Compilado de Metodologia de vendas_v1 — conversa estrategica + filtro ideal/problema. */
export const DEFAULT_SALES_PLAYBOOK = {
  version: 2,
  sheets: [
    "Conversa estrategica — roteiro (abertura, contexto, problema, impacto, visao, devolutiva, convite)",
    "Conversa estrategica — fases (sobrevivencia / organizacao / crescimento) e investimento sem defesa",
    "Entendendo o cliente — filtro ideal vs problema (nunca aceite quem voce nao respeita intelectualmente)",
  ],
  opening: {
    title: "Abertura — controle e expectativa",
    script:
      "O objetivo dessa conversa nao e vender nada agora. E entender o momento do negocio, identificar os principais gargalos e ver qual acompanhamento faz sentido — ou se faz. Se em algum momento eu achar que nao posso gerar valor real, vou te dizer com sinceridade.",
    internal:
      "Eu nao estou aqui para convencer. Estou aqui para diagnosticar, orientar e decidir se existe alinhamento.",
  },
  goldenRule: "Voce conduz com perguntas. Quem fala mais e o cliente.",
  intellectualRule: "Nunca aceite um cliente que voce nao respeita intelectualmente.",
  businessPhases: ["sobrevivencia", "organizacao", "crescimento"] as const,
  sections: [
    {
      id: "contexto",
      title: "Contexto do negocio (5–8 min)",
      questions: [
        "Hoje, quanto o negocio fatura em media por mes?",
        "Esse faturamento e previsivel ou oscila bastante?",
        "Quantas pessoas estao envolvidas na operacao?",
        "Voce tem clareza de custos, margem e lucro?",
        "Quem toma as decisoes estrategicas hoje?",
      ],
    },
    {
      id: "problema",
      title: "Problema central (10 min)",
      questions: [
        "Qual e o principal problema que mais te trava hoje?",
        "Onde voce sente que toma decisoes no escuro?",
        "Se isso continuar igual pelos proximos 6 meses, o que acontece?",
        "Por que isso ainda nao foi resolvido?",
        "O que voce ja tentou?",
      ],
    },
    {
      id: "impacto",
      title: "Impacto financeiro e estrategico (5–7 min)",
      questions: [
        "Quanto voce estima que esse problema te custa por mes?",
        "Voce sente que trabalha muito e avanca pouco?",
        "Esse problema afeta mais crescimento, lucro ou sua tranquilidade?",
        "Qual decisao voce evita tomar hoje por falta de clareza?",
        "Hoje voce se sente no controle do negocio ou apagando incendio?",
      ],
    },
    {
      id: "visao",
      title: "Visao de futuro (5 min)",
      questions: [
        "Se esse problema estivesse resolvido, como o negocio estaria funcionando?",
        "Que tipo de decisoes voce gostaria de tomar com mais seguranca?",
        "O que mudaria na sua rotina?",
      ],
    },
    {
      id: "convite",
      title: "Devolutiva e convite",
      questions: [
        "Pelo que voce descreveu, o problema central nao e ___, e ___.",
        "Voce gostaria que eu te explicasse como funcionaria esse acompanhamento?",
      ],
    },
  ],
  observe: [
    "Confusao → falta de controle",
    "Respostas vagas → decisoes emocionais",
    "Nao souber o custo do problema → ja e diagnostico",
  ],
  avoid: [
    "Falar demais",
    "Prometer resultado rapido",
    "Resolver tudo na primeira conversa",
    "Disputar preco",
  ],
  qualificationCriteria: [
    {
      id: "responsabilidade",
      label: "Assume responsabilidade",
      ideal: "Reconhece o problema, nao terceiriza culpa, aberto a mudar habito. Frase: 'Eu sei que algo precisa mudar, so nao sei exatamente o que.'",
      problema: "Culpa mercado, governo ou equipe; quer solucao rapida sem mudar. Frase: 'O problema e que ninguem faz nada direito.'",
    },
    {
      id: "numeros",
      label: "Relacao com numeros",
      ideal: "Quer entender dados; aceita olhar DRE/margem. Frase: 'Nunca tive isso organizado, mas quero estruturar.'",
      problema: "Foge de faturamento, custo ou margem; argumenta no achismo.",
    },
    {
      id: "disciplina",
      label: "Disciplina / comportamento",
      ideal: "Chega no horario, cumpre combinado, executa o basico.",
      problema: "Atrasa ou desmarca; nao executa o combinado; some e volta cobrando resultado.",
    },
    {
      id: "investimento",
      label: "Relacao com investimento",
      ideal: "Ve consultoria como alavanca; pergunta valor depois do metodo; compara retorno. Frase: 'Se isso me ajudar a decidir melhor, faz sentido.'",
      problema: "Pergunta preco antes do problema; negocia sem criterio; compara com o mais barato. Frase: 'Fulano faz por metade disso.'",
    },
    {
      id: "decisao",
      label: "Perfil decisorio",
      ideal: "Decide com logica; nao esconde socio invisivel; assume quando nao quer avancar.",
      problema: "Oscila (empolgacao → desistencia); pede validacao constante; nao decide e trava.",
    },
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

export const CRM_STAGES = [
  "lead",
  "sessao",
  "proposta",
  "contrato",
  "ciclo",
  "renovacao",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  lead: "Lead",
  sessao: "Sessão",
  proposta: "Proposta",
  contrato: "Contrato",
  ciclo: "Ciclo ORBE",
  renovacao: "Renovação",
};

export const ORBE_PHASES = ["O", "R", "B", "E"] as const;
export type OrbePhase = (typeof ORBE_PHASES)[number];

export const PERSPECTIVES = [
  "financeira",
  "clientes",
  "processos",
  "aprendizagem",
] as const;

export type Perspective = (typeof PERSPECTIVES)[number];

export const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  financeira: "Financeira",
  clientes: "Clientes",
  processos: "Processos Internos",
  aprendizagem: "Aprendizagem",
};

export const SESSION_STATUSES = [
  "gravando",
  "enviado",
  "processando",
  "pronto",
  "erro",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const ACTION_STATUSES = [
  "aguardando",
  "em_andamento",
  "concluido",
  "atrasado",
  "nao_iniciado",
] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  aguardando: "Aguardando etapa",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  atrasado: "Atrasado",
  nao_iniciado: "Não iniciado",
};

export type Confidence = "alta" | "media" | "baixa";

export type DiagnosticFieldValue = {
  value: string | number | boolean | null;
  confianca?: Confidence;
  evidencia?: string;
};

export type DiagnosticPayload = {
  empresa?: {
    nome?: DiagnosticFieldValue;
    setor?: DiagnosticFieldValue;
    tempo_mercado?: DiagnosticFieldValue;
    colaboradores?: DiagnosticFieldValue;
    faturamento_medio?: DiagnosticFieldValue;
  };
  estrategico?: {
    missao?: DiagnosticFieldValue;
    visao?: DiagnosticFieldValue;
    valores?: DiagnosticFieldValue;
    proposta_de_valor?: DiagnosticFieldValue;
    produtos_servicos?: DiagnosticFieldValue;
    diferenciais?: DiagnosticFieldValue;
    concorrentes?: DiagnosticFieldValue;
  };
  financeiro?: {
    tem_controle?: DiagnosticFieldValue;
    fluxo_caixa?: DiagnosticFieldValue;
    dre?: DiagnosticFieldValue;
    ferramentas?: DiagnosticFieldValue;
    ticket_medio?: DiagnosticFieldValue;
    faturamento_mensal?: DiagnosticFieldValue;
    margem?: DiagnosticFieldValue;
    lucratividade?: DiagnosticFieldValue;
    inadimplencia?: DiagnosticFieldValue;
  };
  operacional?: {
    processos_criticos?: DiagnosticFieldValue;
    gargalos?: DiagnosticFieldValue;
    fluxo_informacao?: DiagnosticFieldValue;
    tecnologia?: DiagnosticFieldValue;
    padronizacao?: DiagnosticFieldValue;
  };
  comercial?: {
    canais?: DiagnosticFieldValue;
    conversao?: DiagnosticFieldValue;
    rotina_vendas?: DiagnosticFieldValue;
    materiais?: DiagnosticFieldValue;
  };
  swot?: {
    forcas?: DiagnosticFieldValue;
    fraquezas?: DiagnosticFieldValue;
    oportunidades?: DiagnosticFieldValue;
    ameacas?: DiagnosticFieldValue;
  };
  maturidade?: number;
  prioridades?: string[];
  riscos?: string[];
  perguntas_em_aberto?: string[];
  acoes_candidatas?: string[];
};

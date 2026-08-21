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
  /** Matriz cruzada SWOT (Donna imp_swot): scores 0-2. */
  swotMatrix?: SwotMatrix;
  /** Score 360 ponderado por perfil de engajamento. */
  score360?: Score360;
  maturidade?: number;
  prioridades?: string[];
  riscos?: string[];
  perguntas_em_aberto?: string[];
  acoes_candidatas?: string[];
};

export const SCORE360_DIMENSIONS = [
  "estrategia",
  "mercado",
  "financeiro",
  "operacional",
  "comercial",
  "digital",
  "esg_cultura",
] as const;

export type Score360Dimension = (typeof SCORE360_DIMENSIONS)[number];

export const SCORE360_DIMENSION_LABELS: Record<Score360Dimension, string> = {
  estrategia: "Estrategia",
  mercado: "Mercado",
  financeiro: "Financeiro",
  operacional: "Operacional",
  comercial: "Comercial",
  digital: "Digital",
  esg_cultura: "ESG & Cultura",
};

export const SCORE360_PROFILES = ["consultoria", "mentoria", "investimento"] as const;
export type Score360Profile = (typeof SCORE360_PROFILES)[number];

export const SCORE360_PROFILE_LABELS: Record<Score360Profile, string> = {
  consultoria: "Consultoria",
  mentoria: "Mentoria",
  investimento: "Investimento",
};

/** Pesos da planilha Diagnostico 360 (soma = 1 por perfil). */
export const SCORE360_WEIGHTS: Record<Score360Profile, Record<Score360Dimension, number>> = {
  consultoria: {
    estrategia: 0.15,
    mercado: 0.1,
    financeiro: 0.2,
    operacional: 0.2,
    comercial: 0.15,
    digital: 0.1,
    esg_cultura: 0.1,
  },
  mentoria: {
    estrategia: 0.25,
    mercado: 0.1,
    financeiro: 0.15,
    operacional: 0.1,
    comercial: 0.15,
    digital: 0.05,
    esg_cultura: 0.2,
  },
  investimento: {
    estrategia: 0.15,
    mercado: 0.15,
    financeiro: 0.3,
    operacional: 0.1,
    comercial: 0.15,
    digital: 0.1,
    esg_cultura: 0.05,
  },
};

export type Score360 = {
  perfil: Score360Profile;
  /** Notas brutas 1–5 por dimensao. */
  dimensoes: Partial<Record<Score360Dimension, number>>;
  /** Score ponderado 0–100. */
  total?: number;
};

export type SwotMatrix = {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
  /** scores[forcaIndex][oportunidadeIndex] etc. simplificado: FO, FA, WO, WA */
  fo?: number[][];
  fa?: number[][];
  wo?: number[][];
  wa?: number[][];
};

export type SalesQualificationCriterion =
  | "responsabilidade"
  | "numeros"
  | "disciplina"
  | "investimento"
  | "decisao";

export type SalesQualification = {
  decision?: "admitir" | "nao_admitir" | "pendente";
  notes?: string;
  offerLevel?: "diagnostico" | "ciclo" | "premium";
  criteria?: Partial<Record<SalesQualificationCriterion, "positivo" | "negativo" | "neutro">>;
};

export type OrgPriceBookItem = {
  id: string;
  name: string;
  level: "diagnostico" | "ciclo" | "premium";
  minPrice: number;
  description?: string;
};

export type OrgSettings = {
  playbookVersion?: number;
  priceBook?: OrgPriceBookItem[];
  monthlyRevenueGoal?: number;
  localHolidays?: string[];
};

export const ARTIFACT_KINDS = [
  "sales_qualification",
  "score360",
  "working_capital",
  "valuation",
  "payroll_cost",
] as const;

export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export function computeScore360Total(
  perfil: Score360Profile,
  dimensoes: Partial<Record<Score360Dimension, number>>,
): number {
  const weights = SCORE360_WEIGHTS[perfil];
  let sum = 0;
  for (const dim of SCORE360_DIMENSIONS) {
    const raw = Number(dimensoes[dim] ?? 0);
    const clamped = Math.min(5, Math.max(0, raw));
    // Nota 1-5 → 0-100 por dimensao: (nota/5)*100 * peso
    sum += (clamped / 5) * 100 * weights[dim];
  }
  return Math.round(sum * 10) / 10;
}

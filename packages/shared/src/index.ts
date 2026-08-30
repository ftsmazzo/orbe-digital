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

/** Lingua do Daniel nos audios. */
export const PERSPECTIVE_LABELS_DANIEL: Record<Perspective, string> = {
  financeira: "Financeira",
  clientes: "Comercial",
  processos: "Processos internos",
  aprendizagem: "Recursos",
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
  offerLevel?: "diagnostico" | "ciclo" | "premium" | "success_fee";
  billingStart?: "m1" | "m6";
  closingMoment?: "primeira_reuniao" | "followup";
  scoreLabel?: "ideal" | "neutro" | "problema";
  score?: number;
  criteria?: Partial<Record<SalesQualificationCriterion, "positivo" | "negativo" | "neutro">>;
};

export const SESSION_KINDS = ["estrategica", "followup_fechamento", "ciclo"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const SESSION_KIND_LABELS: Record<SessionKind, string> = {
  estrategica: "Reuniao estrategica",
  followup_fechamento: "Follow-up / fechamento",
  ciclo: "Ciclo ORBE",
};

export const BRAND = {
  legalName: "Daniel Herculis Assessoria e Consultoria Financeira e Estrategica",
  shortName: "Daniel Herculis",
  cnpj: "64.860.330/0001-30",
  city: "Catanduva - SP",
  address: "Rua Doutor Wander Pellizzon, 85, Sala 1, CEP 15802-326",
  email: "daniel@danielherculis.com.br",
  slogan: "Assessoria e Consultoria Financeira e Estrategica",
  colors: {
    navy: "#012245",
    teal: "#2e7271",
    gold: "#c8a04c",
  },
} as const;

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

export const DOCUMENT_KINDS = [
  "dre",
  "contrato",
  "organograma",
  "anotacao",
  "proposta",
  "outro",
] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  dre: "DRE / financeiro",
  contrato: "Contrato",
  organograma: "Organograma / equipe",
  anotacao: "Anotacao",
  proposta: "Proposta",
  outro: "Outro",
};

export const OPERATE_STEPS = [
  "capturar",
  "ciclo",
  "validar",
  "acompanhar",
] as const;
export type OperateStep = (typeof OPERATE_STEPS)[number];

export const OPERATE_STEP_LABELS: Record<OperateStep, string> = {
  capturar: "Capturar (gravar ou documento)",
  ciclo: "Processar ciclo ORBE",
  validar: "Validar o servico",
  acompanhar: "Acompanhar desenvolvimento",
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

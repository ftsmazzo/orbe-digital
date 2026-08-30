import type { DiagnosticPayload } from "@orbe/shared";

export type ProcessNote = {
  phase: "O" | "R" | "B" | "E" | "comercial";
  status: "ok" | "parcial" | "falta";
  title: string;
  detail: string;
};

export type ProcessBrief = {
  notes: ProcessNote[];
  missingFields: string[];
  recommendedAction: "aguardar_stt" | "ciclo" | "validar" | "acompanhar" | null;
  recommendedLabel: string | null;
};

type Fieldish = { value?: unknown } | string | null | undefined;

function filled(field: Fieldish): boolean {
  if (field == null) return false;
  if (typeof field === "string") return field.trim().length > 0;
  const value = field.value;
  if (value == null || value === false) return false;
  const text = String(value).trim();
  if (!text) return false;
  return !["nao identificado", "a validar na consultoria", "parcial"].includes(text.toLowerCase());
}

const FICHA: { section: keyof DiagnosticPayload; keys: string[]; label: string }[] = [
  { section: "empresa", keys: ["setor", "colaboradores", "faturamento_medio"], label: "Empresa" },
  { section: "estrategico", keys: ["missao", "visao", "proposta_de_valor", "concorrentes"], label: "Estrategico" },
  { section: "financeiro", keys: ["dre", "faturamento_mensal", "margem", "fluxo_caixa"], label: "Financeiro" },
  { section: "operacional", keys: ["processos_criticos", "gargalos"], label: "Operacional" },
  { section: "comercial", keys: ["canais", "rotina_vendas"], label: "Comercial" },
  { section: "swot", keys: ["forcas", "fraquezas", "oportunidades", "ameacas"], label: "SWOT" },
];

export function isThinHeuristicPayload(payload: DiagnosticPayload | null | undefined): boolean {
  if (!payload) return true;
  const proposta = payload.estrategico?.proposta_de_valor;
  const evidence = proposta && typeof proposta === "object" ? String(proposta.evidencia ?? "") : "";
  const value = proposta && typeof proposta === "object" ? String(proposta.value ?? "") : "";
  if (evidence.includes("ponto pendente") || value.toLowerCase().includes("a validar na consultoria")) return true;
  const financeiro = payload.financeiro?.tem_controle;
  const finEv = financeiro && typeof financeiro === "object" ? String(financeiro.evidencia ?? "") : "";
  return finEv.includes("Heuristica aplicada");
}

export function missingFichaFields(payload: DiagnosticPayload | null | undefined): string[] {
  if (!payload) return FICHA.map((item) => `${item.label} (ficha vazia)`);
  const missing: string[] = [];
  for (const block of FICHA) {
    const section = payload[block.section] as Record<string, Fieldish> | undefined;
    const empty = block.keys.filter((key) => !filled(section?.[key]));
    if (empty.length) missing.push(`${block.label}: ${empty.join(", ")}`);
  }
  return missing;
}

export function pickBestDiagnostic<T extends { validated: boolean; createdAt: Date; payload: unknown; priorities: string[] }>(
  rows: T[],
): T | undefined {
  if (!rows.length) return undefined;
  const validated = rows.filter((row) => row.validated);
  const pool = validated.length ? validated : rows;
  return [...pool].sort((a, b) => {
    const thinA = isThinHeuristicPayload(a.payload as DiagnosticPayload);
    const thinB = isThinHeuristicPayload(b.payload as DiagnosticPayload);
    if (thinA !== thinB) return thinA ? 1 : -1;
    const score = (b.priorities?.length ?? 0) - (a.priorities?.length ?? 0);
    if (score) return score;
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}

export function buildProcessBrief(input: {
  sessionsReady: number;
  sessionsProcessing: number;
  sessionsWithTranscript: number;
  documents: number;
  hasDiagnostic: boolean;
  diagnosticValidated: boolean;
  diagnosticThin: boolean;
  missingFields: string[];
  hasMarketResearch: boolean;
  goals: number;
  actions: number;
  proposals: number;
}): ProcessBrief {
  const notes: ProcessNote[] = [];

  if (input.sessionsWithTranscript > 0) {
    notes.push({
      phase: "O",
      status: input.sessionsProcessing ? "parcial" : "ok",
      title: `${input.sessionsWithTranscript} sessao(oes) transcrita(s)`,
      detail: input.sessionsProcessing
        ? `${input.sessionsProcessing} ainda em STT. O cockpit usa as transcritas; nao espera a que esta processando.`
        : "Audio ja esta no nucleo desta empresa.",
    });
  } else if (input.sessionsProcessing > 0) {
    notes.push({
      phase: "O",
      status: "parcial",
      title: "STT em andamento",
      detail: "Aguarde a transcricao terminar antes de extrair de novo.",
    });
  } else {
    notes.push({
      phase: "O",
      status: "falta",
      title: "Nenhuma sessao transcrita",
      detail: "Grave ou cole a conversa nesta empresa.",
    });
  }

  if (input.documents === 0) {
    notes.push({
      phase: "O",
      status: "falta",
      title: "Nenhum documento na inbox",
      detail: "DRE, contrato ou organograma ainda nao foram enviados. Nao inventamos esses numeros.",
    });
  } else {
    notes.push({
      phase: "O",
      status: "ok",
      title: `${input.documents} documento(s) lido(s)`,
      detail: "Texto extraido entra no diagnostico e no plano.",
    });
  }

  if (!input.hasDiagnostic) {
    notes.push({
      phase: "O",
      status: "falta",
      title: "Diagnostico ainda nao consolidado",
      detail: "Ha materia-prima. Rodar extracao com LLM sobre TODAS as transcricoes.",
    });
  } else if (input.diagnosticThin) {
    notes.push({
      phase: "O",
      status: "falta",
      title: "Diagnostico atual e heuristica rasa",
      detail: "Nao validar isso. Reextrair com OpenRouter/Claude usando o historico completo.",
    });
  } else if (!input.diagnosticValidated) {
    notes.push({
      phase: "O",
      status: "parcial",
      title: "Diagnostico em rascunho — sua validacao",
      detail: "O sistema ja preenche R/B. Validar trava a qualidade; nao e um passo de formulario.",
    });
  } else {
    notes.push({
      phase: "O",
      status: "ok",
      title: "Diagnostico validado",
      detail: "Ficha O travada. Enriquecer so com material novo, sem apagar o validado.",
    });
  }

  for (const field of input.missingFields.slice(0, 6)) {
    notes.push({
      phase: "O",
      status: "falta",
      title: "Campo em aberto na ficha",
      detail: field,
    });
  }

  notes.push({
    phase: "R",
    status: input.hasMarketResearch ? "ok" : "parcial",
    title: input.hasMarketResearch ? "Pesquisa de mercado no nucleo" : "Pesquisa R ainda sem fonte web",
    detail: input.hasMarketResearch
      ? "Insight regional/global ja gravado."
      : "O ciclo tenta Apify, Tavily ou Perplexity/Sonar. Sem credito, o plano segue e este ponto fica apontado — nao inventamos mercado.",
  });

  notes.push({
    phase: "R",
    status: input.goals >= 4 ? "ok" : input.goals > 0 ? "parcial" : "falta",
    title: input.goals > 0 ? `${input.goals} meta(s) BSC` : "Metas ainda nao criadas",
    detail: input.goals >= 4
      ? "As 4 perspectivas ja estao no nucleo."
      : "O orquestrador preenche as 4 perspectivas a partir das sessoes e documentos.",
  });

  notes.push({
    phase: "B",
    status: input.actions > 0 ? "ok" : "falta",
    title: input.actions > 0 ? `${input.actions} plano(s) de acao` : "Planos de acao vazios",
    detail: input.actions > 0 ? "Execucao ja tem dono e como." : "O ciclo gera as acoes. Voce so valida e acompanha.",
  });

  notes.push({
    phase: "comercial",
    status: input.proposals > 0 ? "ok" : "falta",
    title: input.proposals > 0 ? `${input.proposals} proposta(s)` : "Proposta ainda nao gerada",
    detail: input.proposals > 0 ? "Peca comercial no nucleo." : "O ciclo redige o rascunho com marca DH.",
  });

  const hasMaterial = input.sessionsWithTranscript > 0 || input.documents > 0;
  const cycleIncomplete =
    !input.hasDiagnostic ||
    input.diagnosticThin ||
    input.goals < 4 ||
    input.actions === 0 ||
    input.proposals === 0;

  let recommendedAction: ProcessBrief["recommendedAction"] = "acompanhar";
  if (input.sessionsWithTranscript === 0 && input.sessionsProcessing > 0 && input.documents === 0) {
    recommendedAction = "aguardar_stt";
  } else if (!hasMaterial) {
    recommendedAction = null;
  } else if (cycleIncomplete) {
    recommendedAction = "ciclo";
  } else {
    recommendedAction = "acompanhar";
  }

  const labels: Record<NonNullable<ProcessBrief["recommendedAction"]>, string> = {
    aguardar_stt: "Aguardando transcricao",
    ciclo: "Processar ciclo ORBE",
    validar: "Validar o servico",
    acompanhar: "Ciclo preenchido — acompanhar",
  };

  return {
    notes,
    missingFields: input.missingFields,
    recommendedAction,
    recommendedLabel: recommendedAction ? labels[recommendedAction] : null,
  };
}

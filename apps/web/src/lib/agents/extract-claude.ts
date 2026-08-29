import type { Confidence, DiagnosticFieldValue, DiagnosticPayload, Score360, Score360Dimension, Score360Profile } from "@orbe/shared";
import { SCORE360_DIMENSIONS, SCORE360_PROFILES, computeScore360Total } from "@orbe/shared";
import { completeJson, hasAnthropicKey } from "@/lib/ai/claude";

export type ExtractedDiagnostic = {
  payload: DiagnosticPayload;
  maturity: number;
  gaps: string[];
  priorities: string[];
  risks: string[];
  openQuestions: string[];
  source: "claude" | "heuristic";
};

type ClaudeExtractResponse = {
  payload?: DiagnosticPayload;
  gaps?: string[];
  priorities?: string[];
  risks?: string[];
  openQuestions?: string[];
  maturity?: number;
};

const SYSTEM = `Voce e o Analista ORBE (consultoria financeira/estrategica low ticket).
Extraia um diagnostico estruturado APENAS do que a transcricao sustenta.

Regras obrigatorias:
- NUNCA invente numeros, faturamento, margem ou fatos nao ditos.
- Se algo nao foi citado, use value: null e acrescente pergunta em perguntas_em_aberto / openQuestions.
- Cada campo de valor deve ser { "value": ..., "confianca": "alta"|"media"|"baixa", "evidencia": "trecho curto da transcricao" }.
- Separar fato (campos) de interpretacao (gaps/prioridades).
- maturidade de 1 a 5 com justificativa implicita nos gaps.
- Sugira score360 com perfil "consultoria" e notas 1-5 nas 7 dimensoes SO com base na transcricao (use 0 se nao houver evidencia).
- Responda SOMENTE JSON valido, sem markdown.`;

function asField(raw: unknown): DiagnosticFieldValue | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const confianca = obj.confianca;
  const conf: Confidence | undefined =
    confianca === "alta" || confianca === "media" || confianca === "baixa" ? confianca : undefined;
  return {
    value: (obj.value as DiagnosticFieldValue["value"]) ?? null,
    confianca: conf,
    evidencia: typeof obj.evidencia === "string" ? obj.evidencia : undefined,
  };
}

function normalizeSection(section: unknown): Record<string, DiagnosticFieldValue> | undefined {
  if (!section || typeof section !== "object") return undefined;
  const out: Record<string, DiagnosticFieldValue> = {};
  for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
    const field = asField(value);
    if (field) out[key] = field;
  }
  return Object.keys(out).length ? out : undefined;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function clampMaturity(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function normalizeScore360(raw: unknown): Score360 | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const perfilRaw = String(obj.perfil ?? "consultoria");
  const perfil = (SCORE360_PROFILES.includes(perfilRaw as Score360Profile)
    ? perfilRaw
    : "consultoria") as Score360Profile;
  const dimsRaw = (obj.dimensoes ?? {}) as Record<string, unknown>;
  const dimensoes: Partial<Record<Score360Dimension, number>> = {};
  for (const dim of SCORE360_DIMENSIONS) {
    const n = Number(dimsRaw[dim]);
    if (Number.isFinite(n) && n > 0) dimensoes[dim] = Math.max(1, Math.min(5, Math.round(n)));
  }
  if (!Object.keys(dimensoes).length) return undefined;
  return {
    perfil,
    dimensoes,
    total: computeScore360Total(perfil, dimensoes),
  };
}

export async function extractDiagnosticWithClaude(
  transcript: string,
  clientName: string,
  knowledge?: string,
): Promise<ExtractedDiagnostic> {
  if (!hasAnthropicKey()) {
    throw new Error("ANTHROPIC_API_KEY ausente");
  }

  const user = `Cliente CRM: ${clientName}

Base de principios (Hill > Kaplan/Norton > demais). Use so para orientar interpretacao; NUNCA invente fatos ou numeros que nao estejam na transcricao.
${knowledge ? knowledge.slice(0, 8000) : "(apenas fichas internas se nao houver texto)"}

Transcricao da sessao consultiva:
"""
${transcript.slice(0, 100_000)}
"""

Retorne JSON no formato:
{
  "payload": {
    "empresa": { "nome": {value,confianca,evidencia}, "setor": {...}, "tempo_mercado": {...}, "colaboradores": {...}, "faturamento_medio": {...} },
    "estrategico": { "missao": {...}, "visao": {...}, "valores": {...}, "proposta_de_valor": {...}, "produtos_servicos": {...}, "diferenciais": {...}, "concorrentes": {...} },
    "financeiro": { "tem_controle": {...}, "fluxo_caixa": {...}, "dre": {...}, "ferramentas": {...}, "ticket_medio": {...}, "faturamento_mensal": {...}, "margem": {...}, "lucratividade": {...}, "inadimplencia": {...} },
    "operacional": { "processos_criticos": {...}, "gargalos": {...}, "fluxo_informacao": {...}, "tecnologia": {...}, "padronizacao": {...} },
    "comercial": { "canais": {...}, "conversao": {...}, "rotina_vendas": {...}, "materiais": {...} },
    "swot": { "forcas": {...}, "fraquezas": {...}, "oportunidades": {...}, "ameacas": {...} },
    "score360": {
      "perfil": "consultoria",
      "dimensoes": {
        "estrategia": 1-5,
        "mercado": 1-5,
        "financeiro": 1-5,
        "operacional": 1-5,
        "comercial": 1-5,
        "digital": 1-5,
        "esg_cultura": 1-5
      }
    },
    "maturidade": 1-5,
    "prioridades": [],
    "riscos": [],
    "perguntas_em_aberto": [],
    "acoes_candidatas": []
  },
  "gaps": [],
  "priorities": [],
  "risks": [],
  "openQuestions": [],
  "maturity": 1-5
}`;

  const raw = await completeJson<ClaudeExtractResponse>({ system: SYSTEM, user, maxTokens: 5000 });

  const payloadRaw = raw.payload ?? {};
  const gaps = stringList(raw.gaps).length ? stringList(raw.gaps) : stringList(payloadRaw.prioridades);
  const priorities = stringList(raw.priorities).length
    ? stringList(raw.priorities)
    : stringList(payloadRaw.prioridades);
  const risks = stringList(raw.risks).length ? stringList(raw.risks) : stringList(payloadRaw.riscos);
  const openQuestions = stringList(raw.openQuestions).length
    ? stringList(raw.openQuestions)
    : stringList(payloadRaw.perguntas_em_aberto);

  const maturity = clampMaturity(raw.maturity ?? payloadRaw.maturidade, 2);

  const empresa = normalizeSection(payloadRaw.empresa) ?? {};
  if (!empresa.nome?.value) {
    empresa.nome = {
      value: clientName,
      confianca: "alta",
      evidencia: "Nome do cliente no CRM.",
    };
  }

  const score360 = normalizeScore360(payloadRaw.score360);

  const payload: DiagnosticPayload = {
    empresa,
    estrategico: normalizeSection(payloadRaw.estrategico),
    financeiro: normalizeSection(payloadRaw.financeiro),
    operacional: normalizeSection(payloadRaw.operacional),
    comercial: normalizeSection(payloadRaw.comercial),
    swot: normalizeSection(payloadRaw.swot),
    score360,
    maturidade: maturity,
    prioridades: priorities,
    riscos: risks,
    perguntas_em_aberto: openQuestions,
    acoes_candidatas: stringList(payloadRaw.acoes_candidatas),
  };

  return {
    payload,
    maturity,
    gaps: gaps.length
      ? gaps
      : ["Diagnostico Claude gerado — validar campos vazios e evidencias com o consultor."],
    priorities: priorities.length ? priorities : ["Completar levantamento ORBE nas lacunas marcadas."],
    risks: risks.length ? risks : ["Risco de premissas nao validadas se a ficha nao for revisada."],
    openQuestions: openQuestions.length
      ? openQuestions
      : ["Quais indicadores o cliente ja acompanha hoje?"],
    source: "claude",
  };
}

import type { DiagnosticPayload } from "@orbe/shared";
import { isBlankField } from "@/lib/agents/tools/field-empty";

export type DreBrief = {
  hasDreDocument: boolean;
  hasSessionNumbers: boolean;
  allowPlannedNumbers: boolean;
  notes: string[];
  gates: string[];
};

function fieldText(field: { value?: unknown } | string | null | undefined): string {
  if (field == null) return "";
  if (typeof field === "string") return field.trim();
  if (typeof field === "object" && "value" in field) return String(field.value ?? "").trim();
  return "";
}

const MONEY = /(?:r\$\s*)?\d{1,3}(?:\.\d{3})+(?:,\d{2})?|(?:r\$\s*)?\d+,\d{2}/i;

export function readDreBrief(opts: {
  payload?: DiagnosticPayload | null;
  documentText?: string;
}): DreBrief {
  const notes: string[] = [];
  const gates: string[] = [
    "Nao tratar CPV como custo produzido no periodo se houver estoque.",
    "Nao classificar fixo/variavel so pelo nome da conta.",
    "Nao recomendar corte de produto pelo lucro apos rateio.",
    "Nao gravar PE, MC% ou alavancagem sem periodo, receita liquida e classificacao.",
    "Assaf: nao comparar periodos de duracao diferente; AH so na mesma conta e criterio.",
    "Assaf: liquidez/NCG so com contas evidenciadas. CCL negativo nao e insolvencia.",
    "Assaf: nao usar media setorial sem o cliente ter comprovado o setor.",
    "Fipecafi: lucro por competencia nao e caixa. Confrontar DRE com DFC antes de interpretar conversao.",
    "Fipecafi: EBITDA so com resultado liquido + tributos + financeiro liquido + Dep/Amort/Exaustao evidenciados.",
    "Fipecafi: nao chutar depreciacao nem tratar EBITDA como caixa operacional.",
  ];

  const fin = opts.payload?.financeiro;
  const sessionBits = [
    fieldText(fin?.dre),
    fieldText(fin?.faturamento_mensal),
    fieldText(fin?.margem),
    fieldText(fin?.lucratividade),
    fieldText(fin?.ticket_medio),
    fieldText(opts.payload?.empresa?.faturamento_medio),
  ].filter((text) => text && !["nao identificado", "a validar na consultoria", "parcial"].includes(text.toLowerCase()));

  const docs = opts.documentText ?? "";
  const hasDreDocument = /dre|demonstra[cç][aã]o|receita l[ií]quida|cmv|cpv|ebitda/i.test(docs);
  const docHasMoney = MONEY.test(docs);
  const hasSessionNumbers = sessionBits.some((text) => MONEY.test(text) || /\d/.test(text));

  if (hasDreDocument) notes.push("Ha texto de DRE/documento financeiro na inbox.");
  else notes.push("Sem DRE na inbox. Indicadores financeiros ficam sem numero.");
  if (hasSessionNumbers) notes.push(`Numeros citados na sessao/ficha: ${sessionBits.slice(0, 4).join(" · ")}`);
  if (docs && !docHasMoney && hasDreDocument) notes.push("Documento parece DRE mas sem valor reconhecido — pedir conciliacao.");

  return {
    hasDreDocument,
    hasSessionNumbers,
    allowPlannedNumbers: hasDreDocument || hasSessionNumbers,
    notes,
    gates,
  };
}

export function formatDreBrief(brief: DreBrief) {
  return [
    `LEITOR_DRE hasDre=${brief.hasDreDocument} hasSessionNumbers=${brief.hasSessionNumbers} allowPlannedNumbers=${brief.allowPlannedNumbers}`,
    ...brief.notes,
    ...brief.gates,
  ].join("\n");
}

/** Assaf + Fipecafi — pergunta quando o indice nao pode ser calculado. */
export function collectDreQuestions(payload?: DiagnosticPayload | null, documentText?: string): string[] {
  const questions: string[] = [];
  const fin = payload?.financeiro;
  const hasDoc = /dre|demonstra[cç][aã]o|balan[cç]o|fluxo de caixa|dfc/i.test(documentText ?? "");
  const hasNumber = !isBlankField(fin?.faturamento_mensal) || !isBlankField(fin?.dre) || !isBlankField(payload?.empresa?.faturamento_medio);

  if (!hasDoc && isBlankField(fin?.dre)) {
    questions.push("Quais sao as datas-base e a duracao exata de cada demonstrativo?");
  }
  if (hasNumber && isBlankField(fin?.margem) && isBlankField(fin?.lucratividade)) {
    questions.push("Qual linha representa a receita liquida e quais sao as deducoes do periodo?");
  }
  if (hasDoc && !/deprecia[cç][aã]o|ebitda|lajida/i.test(documentText ?? "")) {
    questions.push("Onde estao evidenciados resultado liquido, tributos, financeiro e depreciacao para conciliar o EBITDA?");
  }
  if (hasNumber && isBlankField(fin?.fluxo_caixa)) {
    questions.push("Existe DFC para confrontar o lucro por competencia com o caixa do mesmo periodo?");
  }
  return questions.slice(0, 4);
}

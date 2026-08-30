import type { DiagnosticPayload } from "@orbe/shared";

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

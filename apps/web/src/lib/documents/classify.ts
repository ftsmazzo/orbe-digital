import { DOCUMENT_KINDS, type DocumentKind } from "@orbe/shared";

const RULES: { kind: DocumentKind; tokens: string[] }[] = [
  { kind: "dre", tokens: ["dre", "ebitda", "receita liquida", "cpv", "demonstracao", "faturamento"] },
  { kind: "contrato", tokens: ["contrato", "contratante", "contratada", "clausula", "foro"] },
  { kind: "organograma", tokens: ["organograma", "cargo", "equipe", "headcount", "departamento"] },
  { kind: "proposta", tokens: ["proposta comercial", "investimento", "escopo sugerido"] },
  { kind: "anotacao", tokens: ["anotacao", "ata", "pauta", "follow-up"] },
];

export function classifyDocument(filename: string, extractedText: string): DocumentKind {
  const hay = `${filename} ${extractedText}`.toLowerCase();
  let best: DocumentKind = "outro";
  let score = 0;
  for (const rule of RULES) {
    const hits = rule.tokens.filter((token) => hay.includes(token)).length;
    if (hits > score) {
      score = hits;
      best = rule.kind;
    }
  }
  return DOCUMENT_KINDS.includes(best) ? best : "outro";
}

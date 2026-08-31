import type { DiagnosticPayload } from "@orbe/shared";
import { uniqueLines } from "@/lib/agents/tools/field-empty";
import { collectDreQuestions } from "@/lib/agents/tools/leitor-dre";
import { collectHillQuestions } from "@/lib/agents/tools/perguntas-abertas";
import { collectPeopleQuestions } from "@/lib/agents/tools/processo-critico";
import { collectPorterQuestions } from "@/lib/agents/tools/mix-comercial";

type Extracted = {
  payload: DiagnosticPayload;
  maturity: number;
  gaps: string[];
  priorities: string[];
  risks: string[];
  openQuestions: string[];
  source: "claude" | "heuristic";
};

/** Porta pos-extracao: tools compiladas preenchem lacuna, nao inventam fato. */
export function applyMethodTools<T extends Extracted>(extracted: T, documentText?: string): T {
  const payload = extracted.payload;
  const hill = collectHillQuestions(payload);
  const dre = collectDreQuestions(payload, documentText);
  const porter = collectPorterQuestions(payload);
  const people = collectPeopleQuestions(payload);

  const openQuestions = uniqueLines(hill, dre, porter, people, extracted.openQuestions, payload.perguntas_em_aberto).slice(
    0,
    16,
  );

  return {
    ...extracted,
    openQuestions,
    payload: {
      ...payload,
      perguntas_em_aberto: openQuestions,
    },
  };
}

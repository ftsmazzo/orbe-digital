import type { DiagnosticPayload } from "@orbe/shared";
import { isBlankField } from "@/lib/agents/tools/field-empty";

function swotLines(field: unknown): string[] {
  if (isBlankField(field)) return [];
  if (Array.isArray(field)) return field.map(String).map((item) => item.trim()).filter(Boolean);
  if (field && typeof field === "object" && "value" in field) return swotLines((field as { value?: unknown }).value);
  const text = String(field).trim();
  return text ? [text] : [];
}

const GENERIC = /qualidade|atendimento|marca|tradi[cç][aã]o|equipe dedicada|pre[cç]o baixo/i;

/** Porter — SWOT e estrategia generica so com fato. Nao copia case do livro. */
export function collectPorterQuestions(payload?: DiagnosticPayload | null): string[] {
  if (!payload) return [];
  const questions: string[] = [];
  const forcas = swotLines(payload.swot?.forcas ?? payload.swotMatrix?.forcas);
  const oportunidades = swotLines(payload.swot?.oportunidades ?? payload.swotMatrix?.oportunidades);
  const ameacas = swotLines(payload.swot?.ameacas ?? payload.swotMatrix?.ameacas);
  const rivais = payload.estrategico?.concorrentes;
  const mix = payload.mix4p;

  if (isBlankField(rivais)) {
    questions.push("Quais empresas o cliente compara com voces e em quais criterios?");
  }
  if (!forcas.length || forcas.every((item) => GENERIC.test(item))) {
    questions.push("O que o cliente reconhece como diferente e como isso altera a escolha, o custo ou o desempenho?");
  }
  if (!oportunidades.length && !ameacas.length) {
    questions.push("Que agente externo pode reduzir ou ampliar vendas, margem ou acesso — e como?");
  }
  if (isBlankField(mix?.preco) && isBlankField(mix?.produto)) {
    questions.push("A disputa e por preco, prazo, canal, servico ou funcionalidade — com qual rival?");
  }
  return questions.slice(0, 4);
}

export function formatPorterForPrompt() {
  return [
    "PORTER (mix_comercial): cinco forcas e estrategia generica so com fato na sessao ou documento.",
    "Preco baixo nao e lideranca em custo. Qualidade sem criterio de compra nao e diferenciacao.",
    "Poucos clientes nao e enfoque. SWOT vazia → pergunta, nao teoria. Nunca copiar case do livro.",
  ].join("\n");
}

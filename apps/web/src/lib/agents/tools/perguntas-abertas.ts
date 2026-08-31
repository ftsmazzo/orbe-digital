import type { DiagnosticPayload } from "@orbe/shared";
import { isBlankField, isVagueDesire } from "@/lib/agents/tools/field-empty";

/** Hill — persistencia investigativa. Nao preenche campo; so pergunta. */
export function collectHillQuestions(payload?: DiagnosticPayload | null): string[] {
  if (!payload) return [];
  const questions: string[] = [];
  const desejo = payload.estrategico?.proposta_de_valor ?? payload.estrategico?.visao;
  const faturamento = payload.financeiro?.faturamento_mensal ?? payload.empresa?.faturamento_medio;
  const dre = payload.financeiro?.dre;
  const dono = payload.empresa?.colaboradores;

  if (isBlankField(desejo)) {
    questions.push("O que voce deseja alcancar com a empresa neste momento?");
  } else if (isVagueDesire(desejo?.value ?? desejo)) {
    questions.push("Que resultado concreto mostraria que esse desejo foi realizado?");
  }

  if (isBlankField(faturamento)) {
    questions.push("Qual e o faturamento atual e de qual periodo estamos falando?");
  } else if (isBlankField(dre)) {
    questions.push("Qual DRE ou registro financeiro confirma esse faturamento?");
  }

  if (!isBlankField(faturamento) && isBlankField(payload.estrategico?.visao) && isBlankField(payload.estrategico?.proposta_de_valor)) {
    questions.push("Qual faturamento voce deseja atingir, em qual periodo e ate quando?");
  }

  if (isBlankField(dono)) {
    questions.push("Quem assume a responsabilidade direta por conduzir essa meta?");
  }

  questions.push("Qual e o primeiro passo concreto, quem faz e ate quando?");
  return questions.slice(0, 6);
}

export function formatHillForPrompt() {
  return [
    "HILL (perguntas_abertas, peso 3): desejo definido na fala, nao na teoria.",
    "Campo vazio → pergunta. Resposta vaga → nao gravar como objetivo.",
    "Separar faturamento atual de faturamento desejado. Dono so com nome ou funcao dita.",
    "Nunca: copiar principio como fato, inventar meta de riqueza, motivar no lugar de perguntar.",
  ].join("\n");
}

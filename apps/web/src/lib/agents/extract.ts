import type { DiagnosticPayload } from "@orbe/shared";
import { extractDiagnosticWithClaude, type ExtractedDiagnostic } from "@/lib/agents/extract-claude";
import { hasAnthropicKey } from "@/lib/ai/claude";
import { applyMethodTools } from "@/lib/agents/tools/apply-method-tools";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function field(value: string, evidencia: string) {
  return { value, confianca: "media" as const, evidencia };
}

export function mockTranscript(clientName: string) {
  return `Sessao consultiva ORBE com ${clientName}. O cliente relatou desafios de controle financeiro, rotina comercial, padronizacao de processos e acompanhamento de indicadores. Tambem citou oportunidades de organizar metas, definir responsaveis e priorizar a execucao nos proximos meses.`;
}

export function extractDiagnosticHeuristic(transcript: string, clientName: string): ExtractedDiagnostic {
  const text = transcript.toLowerCase();
  const gaps: string[] = [];
  const priorities: string[] = [];
  const risks: string[] = [];
  const openQuestions: string[] = [];

  if (includesAny(text, ["financeiro", "caixa", "dre", "faturamento", "margem"])) {
    gaps.push("Controle financeiro precisa de rotina e indicadores consistentes.");
    priorities.push("Organizar DRE, fluxo de caixa e acompanhamento mensal.");
  }

  if (includesAny(text, ["venda", "comercial", "cliente", "conversao"])) {
    gaps.push("Processo comercial ainda depende de pouca previsibilidade.");
    priorities.push("Mapear funil comercial e definir metas por etapa.");
  }

  if (includesAny(text, ["processo", "operacao", "padronizacao", "gargalo"])) {
    gaps.push("Processos criticos precisam de padronizacao e donos claros.");
    priorities.push("Documentar processos chave e remover gargalos operacionais.");
  }

  if (includesAny(text, ["equipe", "pessoas", "treinamento", "lideranca"])) {
    gaps.push("Desenvolvimento da equipe precisa ser conectado ao plano de execucao.");
    priorities.push("Definir rituais de lideranca e aprendizagem.");
  }

  if (gaps.length === 0) {
    gaps.push("Diagnostico inicial necessita de validacao humana.");
    priorities.push("Completar levantamento ORBE com perguntas direcionadas.");
    openQuestions.push("Quais indicadores ja sao acompanhados mensalmente?");
  }

  risks.push("Baixa disciplina de acompanhamento pode reduzir a execucao do plano.");

  const payload: DiagnosticPayload = {
    empresa: {
      nome: field(clientName, "Nome do cliente associado a sessao."),
    },
    estrategico: {
      proposta_de_valor: field("A validar na consultoria", "Extraido como ponto pendente da conversa."),
    },
    financeiro: {
      tem_controle: field(
        includesAny(text, ["financeiro", "caixa", "dre"]) ? "Parcial" : "Nao identificado",
        "Heuristica aplicada sobre a transcricao.",
      ),
    },
    operacional: {
      gargalos: field(gaps.join(" "), "Gaps inferidos da transcricao."),
    },
    comercial: {
      rotina_vendas: field(
        includesAny(text, ["venda", "comercial"]) ? "Precisa de previsibilidade" : "Nao identificado",
        "Heuristica aplicada sobre a transcricao.",
      ),
    },
    swot: {
      fraquezas: field(gaps.join(" | "), "Consolidacao dos principais gaps."),
      oportunidades: field(priorities.join(" | "), "Prioridades candidatas para o ciclo ORBE."),
    },
    maturidade: Math.max(1, Math.min(5, 3 - Math.floor(gaps.length / 3))),
    prioridades: priorities,
    riscos: risks,
    perguntas_em_aberto: openQuestions,
    acoes_candidatas: priorities.map((priority) => `Transformar em plano de acao: ${priority}`),
  };

  return applyMethodTools(
    {
      payload,
      maturity: payload.maturidade ?? 2,
      gaps,
      priorities,
      risks,
      openQuestions,
      source: "heuristic",
    },
    transcript,
  );
}

/** Prefer Claude/OpenRouter. Heuristica so se allowHeuristic (nunca no cockpit). */
export async function extractDiagnosticFromTranscript(
  transcript: string,
  clientName: string,
  knowledge?: string,
  opts?: { allowHeuristic?: boolean },
): Promise<ExtractedDiagnostic> {
  const allowHeuristic = opts?.allowHeuristic !== false;
  if (hasAnthropicKey()) {
    try {
      return await extractDiagnosticWithClaude(transcript, clientName, knowledge);
    } catch (error) {
      console.error("[extract] LLM falhou:", error);
      if (!allowHeuristic) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    }
  } else if (!allowHeuristic) {
    throw new Error("OPENROUTER_API_KEY ou ANTHROPIC_API_KEY ausente. Recusando heuristica.");
  }
  return extractDiagnosticHeuristic(transcript, clientName);
}

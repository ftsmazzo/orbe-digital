import type { SalesQualification, SalesQualificationCriterion } from "@orbe/shared";
import { completeJson, hasAnthropicKey } from "@/lib/ai/claude";
import { DEFAULT_SALES_PLAYBOOK } from "@/lib/sales/playbook";
import { scoreClient } from "@/lib/sales/score-client";

const CRITERIA = DEFAULT_SALES_PLAYBOOK.qualificationCriteria;

type FitResponse = {
  criteria?: Partial<Record<SalesQualificationCriterion, "positivo" | "negativo" | "neutro">>;
  reasons?: string[];
};

export async function suggestFitFromTranscript(transcript: string, clientName: string) {
  const rubric = CRITERIA.map(
    (item) =>
      `${item.id} (${item.label})\n  ideal: ${item.ideal}\n  problema: ${item.problema}`,
  ).join("\n");

  if (!hasAnthropicKey()) {
    throw new Error("Sem OpenRouter/Claude nao sugiro fit. Nao invento cliente ideal.");
  }

  const raw = await completeJson<FitResponse>({
    system: `Voce classifica o prospect pela metodologia de vendas do Daniel (aba Entendendo o cliente).
Nao invente fato. Se a reuniao nao deu evidencia, marque neutro.
Responda SOMENTE JSON.`,
    user: `Cliente: ${clientName}

Rubrica:
${rubric}

Regra de ouro: nunca aceite cliente que voce nao respeita intelectualmente.

Memoria das sessoes (documento vivo, nao uma gravacao isolada):
"""
${transcript.slice(0, 40_000)}
"""

Retorne:
{
  "criteria": {
    "responsabilidade": "positivo|negativo|neutro",
    "numeros": "positivo|negativo|neutro",
    "disciplina": "positivo|negativo|neutro",
    "investimento": "positivo|negativo|neutro",
    "decisao": "positivo|negativo|neutro"
  },
  "reasons": ["frase curta com evidencia da sessao"]
}`,
    maxTokens: 1200,
  });

  const criteria: SalesQualification["criteria"] = {};
  for (const item of CRITERIA) {
    const value = raw.criteria?.[item.id];
    criteria[item.id] = value === "positivo" || value === "negativo" ? value : "neutro";
  }
  const scored = scoreClient({ criteria });
  const reasons = (raw.reasons ?? []).map(String).filter(Boolean).slice(0, 8);
  return {
    criteria,
    score: scored.score,
    label: scored.label,
    reasons: reasons.length ? reasons : scored.reasons,
  };
}

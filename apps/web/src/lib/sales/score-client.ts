import type { SalesQualification, SalesQualificationCriterion } from "@orbe/shared";

const BASE_WEIGHTS: Record<SalesQualificationCriterion, number> = {
  responsabilidade: 1,
  numeros: 1.2,
  disciplina: 1.1,
  investimento: 1.3,
  decisao: 1.2,
};

type Event = { verdict: string; payload: Record<string, unknown> };

function criterionScore(v?: "positivo" | "negativo" | "neutro") {
  if (v === "positivo") return 1;
  if (v === "negativo") return -1;
  return 0;
}

/** Ajusta pesos com historico admitir/nao_admitir (few-shot estatistico). */
export function learnedWeights(events: Event[]): Record<SalesQualificationCriterion, number> {
  const weights = { ...BASE_WEIGHTS };
  const keys = Object.keys(BASE_WEIGHTS) as SalesQualificationCriterion[];
  if (events.length < 3) return weights;

  for (const key of keys) {
    let admitPos = 0;
    let refuseNeg = 0;
    for (const ev of events) {
      const criteria = (ev.payload.criteria ?? {}) as SalesQualification["criteria"];
      const c = criteria?.[key];
      if (ev.verdict === "admitir" && c === "positivo") admitPos += 1;
      if (ev.verdict === "nao_admitir" && c === "negativo") refuseNeg += 1;
    }
    weights[key] = BASE_WEIGHTS[key] + Math.min(0.8, (admitPos + refuseNeg) / Math.max(8, events.length));
  }
  return weights;
}

export function scoreClient(
  qualification: SalesQualification,
  events: Event[] = [],
): { score: number; label: "ideal" | "neutro" | "problema"; reasons: string[] } {
  const weights = learnedWeights(events);
  const criteria = qualification.criteria ?? {};
  let raw = 0;
  let max = 0;
  const reasons: string[] = [];
  (Object.keys(weights) as SalesQualificationCriterion[]).forEach((key) => {
    const w = weights[key];
    max += w;
    const s = criterionScore(criteria[key]);
    raw += s * w;
    if (s > 0) reasons.push(`${key}: sinal de cliente ideal`);
    if (s < 0) reasons.push(`${key}: sinal de cliente problema`);
  });
  const normalized = max ? Math.round(((raw + max) / (2 * max)) * 100) : 50;
  const label = normalized >= 70 ? "ideal" : normalized <= 40 ? "problema" : "neutro";
  return { score: normalized, label, reasons };
}

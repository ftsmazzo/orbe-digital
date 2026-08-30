import type { DiagnosticPayload, GutItem, IshikawaDiagram, Mix4P } from "@orbe/shared";

function clamp15(value: unknown): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export function normalizeGut(raw: unknown): GutItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: GutItem[] = [];
  for (const row of raw) {
    const obj = row as Record<string, unknown>;
    const item = String(obj.item ?? obj.problema ?? "").trim();
    const gravidade = clamp15(obj.gravidade ?? obj.g);
    const urgencia = clamp15(obj.urgencia ?? obj.u);
    const tendencia = clamp15(obj.tendencia ?? obj.t);
    if (!item || !gravidade || !urgencia || !tendencia) continue;
    items.push({ item, gravidade, urgencia, tendencia, score: gravidade * urgencia * tendencia });
  }
  items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return items.length ? items : undefined;
}

export function normalizeIshikawa(raw: unknown): IshikawaDiagram | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const problema = String(obj.problema ?? "").trim();
  if (!problema) return undefined;
  const list = (value: unknown) =>
    Array.isArray(value) ? value.map(String).map((text) => text.trim()).filter(Boolean) : undefined;
  return {
    problema,
    maoDeObra: list(obj.maoDeObra ?? obj.mao_de_obra),
    metodo: list(obj.metodo),
    maquina: list(obj.maquina),
    material: list(obj.material),
    medioAmbiente: list(obj.medioAmbiente ?? obj.medio_ambiente),
    medicao: list(obj.medicao),
  };
}

export function formatMatrizesForPrompt(payload?: DiagnosticPayload | null) {
  const gut = payload?.gut ?? [];
  const top = gut[0];
  const mix = payload?.mix4p;
  const lines = [
    "MATRIZES (Daniel): SWOT continuo + GUT para priorizar + Ishikawa no problema GUT#1 + 4Ps no comercial.",
    "Scrum: cadencia curta nas PAs, inspect and adapt na fase E. Nao virar o cliente em time de software.",
    top ? `GUT prioridade: ${top.item} (G×U×T=${top.score})` : "GUT ainda sem itens evidentes.",
    mix ? "4Ps presentes na ficha — acoes comerciais devem nascer deles." : "4Ps vazios — perguntar, nao inventar mix.",
  ];
  return lines.join("\n");
}

export function emptyMixIfUngrounded(mix?: Mix4P | Record<string, { value?: unknown }>): Mix4P | undefined {
  if (!mix) return undefined;
  const has = [mix.produto, mix.preco, mix.praca, mix.promocao].some((field) => {
    const value = field && typeof field === "object" ? field.value : field;
    return value != null && String(value).trim() && String(value).toLowerCase() !== "nao identificado";
  });
  return has ? mix : undefined;
}

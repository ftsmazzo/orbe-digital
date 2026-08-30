/** Haiku/Claude as vezes devolve [{value:"..."}] em vez de string. */

export function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  for (const key of [
    "text",
    "value",
    "titulo",
    "title",
    "gap",
    "item",
    "pergunta",
    "risco",
    "priority",
    "descricao",
    "description",
    "summary",
  ]) {
    const inner = obj[key];
    if (typeof inner === "string" && inner.trim()) return inner.trim();
    if (inner && typeof inner === "object") {
      const nested = asText(inner);
      if (nested) return nested;
    }
  }
  return "";
}

export function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const one = asText(value);
    return one ? [one] : [];
  }
  return value.map(asText).filter((item) => item && item !== "[object Object]");
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return asNumber(obj.value ?? obj.nota ?? obj.score);
  }
  return undefined;
}

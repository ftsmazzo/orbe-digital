/** Campo da ficha sem fato observavel. */

export function isBlankField(value: unknown): boolean {
  if (value == null || value === false || value === "") return true;
  if (Array.isArray(value)) return !value.some((item) => String(item).trim());
  if (typeof value === "object" && value && "value" in value) {
    return isBlankField((value as { value?: unknown }).value);
  }
  const text = String(value).trim().toLowerCase();
  if (!text) return true;
  return [
    "nao identificado",
    "não identificado",
    "n/a",
    "-",
    "parcial",
    "a validar na consultoria",
    "nao definido pelo cliente",
    "não definido pelo cliente",
  ].includes(text);
}

export function isVagueDesire(value: unknown): boolean {
  if (isBlankField(value)) return false;
  const text = String(Array.isArray(value) ? value.join(" ") : value)
    .trim()
    .toLowerCase();
  return /^(melhorar|crescer|evoluir|organizar|sucesso|crescer a empresa)(\b|$)/.test(text) && text.length < 40;
}

export function uniqueLines(...lists: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      const key = item.trim().replace(/\s+/g, " ");
      if (!key) continue;
      const norm = key.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(key);
    }
  }
  return out;
}

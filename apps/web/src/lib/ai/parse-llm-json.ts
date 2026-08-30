/** Extrai e conserta JSON de LLM (cerca, virgula sobrando, corte no limite de tokens). */

export function extractJsonText(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.search(/[\[{]/);
  if (start < 0) return candidate;
  return candidate.slice(start);
}

function stripTrailingCommas(text: string) {
  return text.replace(/,\s*([}\]])/g, "$1");
}

function normalizeQuotes(text: string) {
  return text.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
}

function closeTruncatedJson(input: string) {
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (const ch of input) {
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let out = input;
  if (escape) out += " ";
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop();
  return out;
}

export function parseLlmJson<T>(raw: string): T {
  const extracted = extractJsonText(raw);
  const attempts = [
    extracted,
    stripTrailingCommas(normalizeQuotes(extracted)),
    closeTruncatedJson(stripTrailingCommas(normalizeQuotes(extracted))),
  ];

  let lastError: unknown;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : "JSON invalido";
  throw new Error(`A LLM devolveu JSON invalido (${detail}). Nao gastei uma segunda extracao completa.`);
}

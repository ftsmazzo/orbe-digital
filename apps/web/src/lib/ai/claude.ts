import Anthropic from "@anthropic-ai/sdk";

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY nao configurada.");
  }
  return new Anthropic({ apiKey });
}

function extractJsonText(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return candidate.slice(start, end + 1);
  }
  return candidate;
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  const model = getAnthropicModel();

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();

      if (!text) {
        throw new Error("Claude retornou resposta vazia.");
      }

      return JSON.parse(extractJsonText(text)) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

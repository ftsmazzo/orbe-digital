import Anthropic from "@anthropic-ai/sdk";

function openRouterKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || process.env.OPEN_ROUTER_API_KEY?.trim() || "";
}

export function hasOpenRouterKey() {
  return Boolean(openRouterKey());
}

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim()) || hasOpenRouterKey();
}

export function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5";
}

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || "anthropic/claude-sonnet-4.5";
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

async function completeJsonViaOpenRouter<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const apiKey = openRouterKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY nao configurada.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.BETTER_AUTH_URL ?? "https://orbe-app.kxryyk.easypanel.host",
      "X-Title": "ORBE Digital",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      max_tokens: opts.maxTokens ?? 4096,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 280)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("OpenRouter retornou resposta vazia.");
  }
  return JSON.parse(extractJsonText(text)) as T;
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const preferOpenRouter = hasOpenRouterKey() && !process.env.ANTHROPIC_API_KEY?.trim();

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (preferOpenRouter) {
        return await completeJsonViaOpenRouter<T>(opts);
      }
      const client = getClient();
      const model = getAnthropicModel();
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
      if (hasOpenRouterKey() && !preferOpenRouter && attempt === 0) {
        try {
          return await completeJsonViaOpenRouter<T>(opts);
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

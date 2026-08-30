import Anthropic from "@anthropic-ai/sdk";
import { extractJsonText, parseLlmJson } from "@/lib/ai/parse-llm-json";

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

async function completeOpenRouterText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  jsonObject?: boolean;
}): Promise<string> {
  const apiKey = openRouterKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY nao configurada.");
  }

  const body: Record<string, unknown> = {
    model: getOpenRouterModel(),
    max_tokens: opts.maxTokens ?? 4096,
    temperature: 0,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.jsonObject !== false) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.BETTER_AUTH_URL ?? "https://orbe-app.kxryyk.easypanel.host",
      "X-Title": "ORBE Digital",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (opts.jsonObject !== false && response.status === 400 && /response_format|json_object/i.test(detail)) {
      return completeOpenRouterText({ ...opts, jsonObject: false });
    }
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 280)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new Error("OpenRouter retornou resposta vazia.");
  }
  return text;
}

async function completeAnthropicText(opts: { system: string; user: string; maxTokens?: number }): Promise<string> {
  const client = getClient();
  const response = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: opts.maxTokens ?? 4096,
    temperature: 0,
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
  return text;
}

async function generateText(opts: { system: string; user: string; maxTokens?: number }): Promise<string> {
  const preferOpenRouter = hasOpenRouterKey() && !process.env.ANTHROPIC_API_KEY?.trim();
  if (preferOpenRouter) {
    return completeOpenRouterText(opts);
  }
  try {
    return await completeAnthropicText(opts);
  } catch (error) {
    if (!hasOpenRouterKey()) throw error;
    return completeOpenRouterText(opts);
  }
}

async function repairJsonText(broken: string): Promise<string> {
  return generateText({
    system: "Voce so conserta JSON. Devolva SOMENTE o objeto JSON valido. Nao explique. Nao invente campos novos.",
    user: `Conserte a sintaxe deste JSON (aspas, virgulas, chaves cortadas). Preserve o conteudo:\n\n${broken.slice(0, 60_000)}`,
    maxTokens: 8192,
  });
}

export async function completeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await generateText(opts);
  try {
    return parseLlmJson<T>(text);
  } catch {
    const repaired = await repairJsonText(extractJsonText(text));
    return parseLlmJson<T>(repaired);
  }
}

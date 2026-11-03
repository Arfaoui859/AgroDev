/**
 * Configurable LLM provider adapter.
 *
 * Supports any OpenAI-compatible Chat Completions endpoint (OpenAI, Groq,
 * Together, OpenRouter, Ollama, vLLM, ...). Provider selection is entirely
 * environment driven so no paid service is assumed:
 *
 *   AI_PROVIDER   optional label, defaults to "openai-compatible"
 *   AI_BASE_URL   e.g. https://api.openai.com/v1  or  http://localhost:11434/v1
 *   AI_API_KEY    bearer token (not required for local servers)
 *   AI_MODEL      model name, e.g. gpt-4o-mini / llama-3.1-70b-versatile
 *
 * When the adapter is not configured, callers must fall back to the
 * deterministic knowledge engine — never to fabricated "AI" output.
 */

import { fetchJson, ProviderError } from "./http";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  /** When true, request a JSON object response (OpenAI-compatible flag). */
  json?: boolean;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { role?: string; content?: string };
    finish_reason?: string;
  }>;
  error?: { message?: string; type?: string };
}

function resolveConfig() {
  const baseUrl =
    process.env.AI_BASE_URL?.replace(/\/+$/, "") ||
    process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") ||
    (process.env.OPENAI_API_KEY ? "https://api.openai.com/v1" : undefined);
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const model =
    process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const provider = process.env.AI_PROVIDER || "openai-compatible";
  return { baseUrl, apiKey, model, provider };
}

export function isLLMConfigured(): boolean {
  const { baseUrl, apiKey } = resolveConfig();
  // A local server (e.g. Ollama) may not need an API key, but it must have a base URL.
  return Boolean(baseUrl && (apiKey || /localhost|127\.0\.0\.1/.test(baseUrl)));
}

export function getLLMInfo(): {
  configured: boolean;
  provider: string;
  model: string;
  baseUrl: string | null;
} {
  const { baseUrl, apiKey, model, provider } = resolveConfig();
  return {
    configured: Boolean(baseUrl && (apiKey || /localhost|127\.0\.0\.1/.test(baseUrl!))),
    provider,
    model,
    baseUrl: baseUrl ?? null,
  };
}

/**
 * Call the configured chat completion endpoint and return the assistant text.
 * @throws ProviderError("llm", "unconfigured") when no provider is configured.
 */
export async function chatComplete(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const { baseUrl, apiKey, model, provider } = resolveConfig();

  if (!baseUrl || (!apiKey && !/localhost|127\.0\.0\.1/.test(baseUrl))) {
    throw new ProviderError(
      "llm",
      "unconfigured",
      "No LLM provider configured (set AI_BASE_URL and AI_API_KEY, or OPENAI_API_KEY).",
    );
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 900,
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const data = await fetchJson<ChatCompletionResponse>(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      provider,
      timeoutMs: options.timeoutMs ?? 30_000,
      retries: options.retries ?? 1,
    },
  );

  if (data.error?.message) {
    throw new ProviderError("llm", "http", `LLM error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ProviderError("llm", "parse", "LLM returned an empty response.");
  }
  return content;
}

/**
 * Call the LLM and parse a JSON object response. Throws ProviderError("llm","parse")
 * if the response is not valid JSON, so callers can fall back safely.
 */
export async function chatCompleteJson<T = unknown>(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<T> {
  const text = await chatComplete(messages, { ...options, json: true });
  const json = extractJson(text);
  if (json === undefined) {
    throw new ProviderError("llm", "parse", "LLM did not return parseable JSON.");
  }
  return json as T;
}

/** Extract the first JSON object/array from a text response. */
export function extractJson(text: string): unknown | undefined {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[{[]/);
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

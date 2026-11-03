/**
 * Unified, configurable LLM provider adapter (text + vision).
 *
 * Two protocol families are supported, selected explicitly — never by silent
 * model substitution:
 *
 *  1. "openai-compatible"  — POST {base}/chat/completions
 *     Covers OpenAI, OpenRouter, Groq, Together, Ollama, vLLM, ...
 *  2. "gemini"             — POST /v1beta/models/{model}:generateContent
 *     Native Google Gemini (see ./gemini.ts).
 *
 * Configuration (all optional; when unset callers must fall back to the
 * deterministic knowledge engine rather than fabricate "AI" output):
 *
 *   AI_PROVIDER     "openai-compatible" | "gemini" | "openai" | "openrouter" |
 *                   "groq" | "ollama". Optional label; the effective protocol
 *                   is derived from it plus the available credentials.
 *   AI_BASE_URL     openai-compatible endpoint (defaults per provider)
 *   AI_API_KEY      bearer token (provider-specific keys are also honoured)
 *   AI_MODEL        model used for text AND vision unless overridden
 *   AI_TEXT_MODEL   text model override
 *   AI_VISION_MODEL vision model override (must be a vision-capable model)
 *   AI_TIMEOUT_MS   request timeout (default 30000)
 *   AI_MAX_RETRIES  bounded retries (default 1)
 *
 * Provider-specific keys are accepted so an existing deployment does not have
 * to be renamed: OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY,
 * GEMINI_API_KEY / GOOGLE_API_KEY.
 */

import { fetchJson, ProviderError } from "./http";
import { geminiGenerateContent, isGeminiConfigured } from "./gemini";

/** Multimodal content part (OpenAI-compatible vision payload). */
export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  /** Plain text, or an array of parts for multimodal (vision) requests. */
  content: string | ChatContentPart[];
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  /** Override the configured model (e.g. a dedicated vision model). */
  model?: string;
  /** When true, request a JSON object response. */
  json?: boolean;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResult {
  text: string;
  provider: string;
  model: string;
  /** Wall-clock latency of the provider call in milliseconds. */
  latencyMs: number;
  usage: ChatUsage;
}

type ProviderKind = "openai-compatible" | "gemini";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { role?: string; content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string };
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
  ollama: "http://localhost:11434/v1",
};

/** Normalise the AI_PROVIDER label to one of the known names. */
function providerLabel(): string {
  const raw = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (raw) return raw;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.TOGETHER_API_KEY) return "together";
  if (process.env.AI_BASE_URL?.includes("11434")) return "ollama";
  if (isGeminiConfigured()) return "gemini";
  return "openai-compatible";
}

/** Which wire protocol the resolved configuration speaks. */
function providerKind(label: string): ProviderKind {
  if (label === "gemini" || label === "google") return "gemini";
  // Any other label uses the OpenAI-compatible protocol.
  return "openai-compatible";
}

function resolveBaseUrl(label: string): string | undefined {
  const explicit =
    process.env.AI_BASE_URL?.replace(/\/+$/, "") ||
    process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  return DEFAULT_BASE_URLS[label];
}

function resolveApiKey(label: string): string | undefined {
  if (label === "gemini" || label === "google") {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }
  const perProvider: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    groq: process.env.GROQ_API_KEY,
    together: process.env.TOGETHER_API_KEY,
  };
  return process.env.AI_API_KEY || perProvider[label] || process.env.OPENAI_API_KEY;
}

export interface LLMConfig {
  kind: ProviderKind;
  provider: string;
  baseUrl: string | null;
  apiKey: string | undefined;
  textModel: string;
  visionModel: string;
}

function isLocalBaseUrl(baseUrl: string | null): boolean {
  return Boolean(
    baseUrl && /localhost|127\.0\.0\.1|host\.docker\.internal/.test(baseUrl),
  );
}

/**
 * Resolve the effective configuration. Model identifiers are never substituted:
 * the text model and vision model each come from their own variable, with
 * AI_MODEL as the shared default.
 */
export function resolveLLMConfig(): LLMConfig {
  const label = providerLabel();
  const kind = providerKind(label);
  const baseUrl = kind === "gemini" ? null : (resolveBaseUrl(label) ?? null);
  const sharedModel = process.env.AI_MODEL || process.env.OPENAI_MODEL || "";
  const fallbackModel = kind === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini";
  return {
    kind,
    provider: label,
    baseUrl,
    apiKey: resolveApiKey(label),
    textModel: process.env.AI_TEXT_MODEL || sharedModel || fallbackModel,
    visionModel: process.env.AI_VISION_MODEL || sharedModel || fallbackModel,
  };
}

export function isLLMConfigured(): boolean {
  const cfg = resolveLLMConfig();
  if (cfg.kind === "gemini") return Boolean(cfg.apiKey);
  return Boolean(cfg.baseUrl && (cfg.apiKey || isLocalBaseUrl(cfg.baseUrl)));
}

export function getTextModel(): string {
  return resolveLLMConfig().textModel;
}

export function getVisionModel(): string {
  return resolveLLMConfig().visionModel;
}

export function getLLMInfo(): {
  configured: boolean;
  /** Boolean only — never the value itself. */
  credentialAvailable: boolean;
  provider: string;
  kind: ProviderKind;
  model: string;
  textModel: string;
  visionModel: string;
  baseUrl: string | null;
} {
  const cfg = resolveLLMConfig();
  return {
    configured: isLLMConfigured(),
    credentialAvailable: Boolean(cfg.apiKey),
    provider: cfg.provider,
    kind: cfg.kind,
    model: cfg.textModel,
    textModel: cfg.textModel,
    visionModel: cfg.visionModel,
    baseUrl: cfg.baseUrl,
  };
}

function resolveTimeout(options: ChatOptions): number {
  return options.timeoutMs ?? (Number(process.env.AI_TIMEOUT_MS) || 30_000);
}

function resolveRetries(options: ChatOptions): number {
  return options.retries ?? (Number(process.env.AI_MAX_RETRIES) || 1);
}

/**
 * Call the configured provider and return the assistant text plus usage,
 * latency and the model that actually answered.
 * @throws ProviderError when no provider is configured or the call fails.
 */
export async function chatCompleteDetailed(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<ChatResult> {
  const cfg = resolveLLMConfig();
  const started = Date.now();

  if (cfg.kind === "gemini") {
    const model = options.model || cfg.textModel;
    const result = await geminiGenerateContent(messages, {
      ...options,
      model,
      timeoutMs: resolveTimeout(options),
      retries: resolveRetries(options),
    });
    return {
      text: result.text,
      provider: "gemini",
      model,
      latencyMs: Date.now() - started,
      usage: result.usage,
    };
  }

  if (!cfg.baseUrl || (!cfg.apiKey && !isLocalBaseUrl(cfg.baseUrl))) {
    throw new ProviderError(
      "llm",
      "unconfigured",
      "No LLM provider configured (set AI_BASE_URL + AI_API_KEY, a provider key, or GEMINI_API_KEY).",
    );
  }

  const model = options.model || cfg.textModel;
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 900,
  };
  if (options.json) body.response_format = { type: "json_object" };

  const data = await fetchJson<ChatCompletionResponse>(
    `${cfg.baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      provider: cfg.provider,
      timeoutMs: resolveTimeout(options),
      retries: resolveRetries(options),
    },
  );

  if (data.error?.message) {
    throw new ProviderError("llm", "http", `LLM error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ProviderError("llm", "parse", "LLM returned an empty response.");
  }
  return {
    text: content,
    provider: cfg.provider,
    model,
    latencyMs: Date.now() - started,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

/** Call the configured chat completion endpoint and return the assistant text. */
export async function chatComplete(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  return (await chatCompleteDetailed(messages, options)).text;
}

/**
 * Call the LLM and parse a JSON object response. Throws ProviderError("llm","parse")
 * if the response is not valid JSON, so callers can fall back safely.
 */
export async function chatCompleteJson<T = unknown>(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<T> {
  const { text } = await chatCompleteDetailed(messages, { ...options, json: true });
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

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
  /** Base delay for exponential backoff; defaults to AI_RETRY_BASE_MS. */
  retryDelayMs?: number;
  /** Cap applied to backoff and Retry-After delays; defaults to AI_RETRY_MAX_MS. */
  maxRetryDelayMs?: number;
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
 * Default model identifiers.
 *
 * These are only used when neither AI_MODEL nor a per-modality override is set.
 * They must be models the provider still serves:
 *  - Gemini: `gemini-2.0-flash` was shut down and `gemini-1.5-flash` is
 *    discontinued. Google recommends the rolling `-latest` alias, which always
 *    points at the current Flash release and is multimodal (text + vision).
 *  - OpenAI-compatible: `gpt-4o-mini` is the low-cost multimodal default.
 * A retired identifier would make every call 404, so operators should still pin
 * AI_TEXT_MODEL / AI_VISION_MODEL explicitly in production.
 */
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function defaultModelFor(kind: ProviderKind): string {
  return kind === "gemini" ? DEFAULT_GEMINI_MODEL : DEFAULT_OPENAI_MODEL;
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
  const fallbackModel = defaultModelFor(kind);
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

/** Shared with the Python adapter so both runtimes honour the same policy. */
export function resolveRetryDelayMs(): number {
  return Number(process.env.AI_RETRY_BASE_MS) || 400;
}

export function resolveMaxRetryDelayMs(): number {
  return Number(process.env.AI_RETRY_MAX_MS) || 30_000;
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
      retryDelayMs: resolveRetryDelayMs(),
      maxRetryDelayMs: resolveMaxRetryDelayMs(),
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
      retryDelayMs: resolveRetryDelayMs(),
      maxRetryDelayMs: resolveMaxRetryDelayMs(),
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

/** Result of a live provider health probe. Never contains a credential value. */
export interface LLMHealth {
  configured: boolean;
  /** True only when a real round-trip to the provider succeeded. */
  reachable: boolean;
  provider: string;
  kind: ProviderKind;
  model: string;
  /** Round-trip latency in ms, or null when the probe did not complete. */
  latencyMs: number | null;
  checkedAt: string;
  /** Present on failure: a coarse error class, never a raw provider body. */
  errorKind?: ProviderError["kind"];
  message?: string;
  /** True when the value came from the short-lived cache. */
  cached: boolean;
}

const HEALTH_TTL_MS = 60_000;
let healthCache: { value: LLMHealth; at: number } | null = null;

/** Clear the cached provider health (used by tests and after config changes). */
export function resetLLMHealthCache(): void {
  healthCache = null;
}

/** Timeout for the health probe: AI_TIMEOUT_MS, capped at 10s for a fast check. */
function probeTimeoutMs(): number {
  const configured = Number(process.env.AI_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return 10_000;
}

/**
 * Perform a minimal live round-trip to the configured provider to prove it is
 * actually reachable — a configured key is not evidence the provider answers.
 *
 * The probe sends a one-token request, is cached for 60s so it cannot be used
 * to hammer a provider, and reports only a coarse error class (never a raw
 * provider body or the credential). When no provider is configured it returns
 * immediately with `configured: false` and performs no network call.
 */
export async function probeLLMHealth(
  options: { force?: boolean; timeoutMs?: number } = {},
): Promise<LLMHealth> {
  const now = Date.now();
  if (!options.force && healthCache && now - healthCache.at < HEALTH_TTL_MS) {
    return { ...healthCache.value, cached: true };
  }

  const cfg = resolveLLMConfig();
  const checkedAt = new Date(now).toISOString();
  const base: Omit<LLMHealth, "reachable" | "latencyMs" | "cached"> = {
    configured: isLLMConfigured(),
    provider: cfg.provider,
    kind: cfg.kind,
    model: cfg.textModel,
    checkedAt,
  };

  if (!base.configured) {
    const value: LLMHealth = {
      ...base,
      reachable: false,
      latencyMs: null,
      cached: false,
      errorKind: "unconfigured",
      message:
        "No LLM provider configured. Set AI_BASE_URL + AI_API_KEY, a provider key, or GEMINI_API_KEY.",
    };
    healthCache = { value, at: now };
    return value;
  }

  const started = Date.now();
  try {
    await chatCompleteDetailed(
      [
        { role: "system", content: "You are a health probe. Reply with a single word." },
        { role: "user", content: "ping" },
      ],
      { maxTokens: 1, temperature: 0, timeoutMs: options.timeoutMs ?? probeTimeoutMs(), retries: 0 },
    );
    const value: LLMHealth = {
      ...base,
      reachable: true,
      latencyMs: Date.now() - started,
      cached: false,
    };
    healthCache = { value, at: Date.now() };
    return value;
  } catch (error) {
    const kind = error instanceof ProviderError ? error.kind : "network";
    const value: LLMHealth = {
      ...base,
      reachable: false,
      latencyMs: Date.now() - started,
      cached: false,
      errorKind: kind,
      // Deliberately generic: never surface the provider's raw error body.
      message:
        kind === "timeout"
          ? "The provider did not respond within the timeout."
          : kind === "http"
            ? "The provider rejected the request (check the credential and model)."
            : "The provider could not be reached.",
    };
    healthCache = { value, at: Date.now() };
    return value;
  }
}

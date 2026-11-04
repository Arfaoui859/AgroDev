/**
 * Native Google Gemini adapter (generativelanguage.googleapis.com).
 *
 * Gemini does not speak the OpenAI Chat Completions protocol, so it needs its
 * own request/response mapping:
 *
 *   POST /v1beta/models/{model}:generateContent
 *   header: x-goog-api-key: <key>
 *
 * Multimodal (vision) input is expressed as inlineData parts. Only models that
 * actually accept image input should be selected via AI_VISION_MODEL; the
 * adapter does not silently substitute a different model.
 *
 * Docs: https://ai.google.dev/api/generate-content
 */

import { fetchJson, ProviderError } from "./http";
import type { ChatContentPart, ChatMessage, ChatOptions } from "./llmProvider";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[]; role?: string };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string; status?: string; code?: number };
}

export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
}

/** Read the Gemini key from either supported variable name. */
export function geminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(geminiApiKey());
}

export function geminiBaseUrl(): string {
  return (process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function dataUrlToInline(url: string): GeminiPart | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(url);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

/** Convert provider-agnostic chat messages into Gemini `contents` + systemInstruction. */
function toGeminiRequest(messages: ChatMessage[]): {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
} {
  const contents: GeminiContent[] = [];
  const systemParts: GeminiPart[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text =
        typeof message.content === "string"
          ? message.content
          : message.content
              .filter((p): p is Extract<ChatContentPart, { type: "text" }> => p.type === "text")
              .map((p) => p.text)
              .join("\n");
      if (text) systemParts.push({ text });
      continue;
    }

    const role = message.role === "assistant" ? "model" : "user";
    const parts: GeminiPart[] = [];
    if (typeof message.content === "string") {
      parts.push({ text: message.content });
    } else {
      for (const part of message.content) {
        if (part.type === "text") {
          parts.push({ text: part.text });
        } else {
          const inline = dataUrlToInline(part.image_url.url);
          if (inline) {
            parts.push(inline);
          } else {
            throw new ProviderError(
              "gemini",
              "unconfigured",
              "Gemini vision requires a data: URL image payload.",
            );
          }
        }
      }
    }
    contents.push({ role, parts });
  }

  return systemParts.length
    ? { contents, systemInstruction: { parts: systemParts } }
    : { contents };
}

export interface GeminiResult {
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * Call Gemini's generateContent and return the assistant text plus token usage.
 * @throws ProviderError("gemini", ...) on configuration, transport or parse errors.
 */
export async function geminiGenerateContent(
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<GeminiResult> {
  const apiKey = geminiApiKey();
  const model = options.model || process.env.AI_TEXT_MODEL || process.env.AI_MODEL;
  if (!apiKey) {
    throw new ProviderError(
      "gemini",
      "unconfigured",
      "No Gemini API key configured (set GEMINI_API_KEY or GOOGLE_API_KEY).",
    );
  }
  if (!model) {
    throw new ProviderError(
      "gemini",
      "unconfigured",
      "No Gemini model configured (set AI_MODEL or AI_TEXT_MODEL).",
    );
  }

  const { contents, systemInstruction } = toGeminiRequest(messages);
  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.3,
    maxOutputTokens: options.maxTokens ?? 900,
  };
  if (options.json) generationConfig.responseMimeType = "application/json";

  const data = await fetchJson<GeminiResponse>(
    `${geminiBaseUrl()}/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents, systemInstruction, generationConfig }),
      provider: "gemini",
      timeoutMs: options.timeoutMs ?? 30_000,
      retries: options.retries ?? 1,
      retryDelayMs: options.retryDelayMs ?? (Number(process.env.AI_RETRY_BASE_MS) || 400),
      maxRetryDelayMs: options.maxRetryDelayMs ?? (Number(process.env.AI_RETRY_MAX_MS) || 30_000),
    },
  );

  if (data.error?.message) {
    throw new ProviderError("gemini", "http", `Gemini error: ${data.error.message}`);
  }
  if (data.promptFeedback?.blockReason) {
    throw new ProviderError(
      "gemini",
      "http",
      `Gemini blocked the request (${data.promptFeedback.blockReason}).`,
    );
  }

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new ProviderError("gemini", "parse", "Gemini returned an empty response.");
  }

  return {
    text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

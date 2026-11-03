/**
 * Unified provider routing tests.
 *
 * The adapter supports two protocol families. These tests pin the routing rules
 * so a configuration change can never silently switch protocol or model:
 *   - AI_PROVIDER=gemini uses the native generateContent wire format;
 *   - openai-compatible providers post to {base}/chat/completions;
 *   - AI_TEXT_MODEL / AI_VISION_MODEL are honoured independently;
 *   - no provider configured => isLLMConfigured() is false (callers must fall
 *     back to the deterministic engine, never fabricate output).
 *
 * fetch is stubbed; no real network call is made.
 */
import {
  resolveLLMConfig,
  isLLMConfigured,
  getLLMInfo,
  getTextModel,
  getVisionModel,
  chatCompleteDetailed,
  chatCompleteJson,
} from "../../server/services/providers/llmProvider";
import { geminiApiKey, isGeminiConfigured } from "../../server/services/providers/gemini";

const ENV_KEYS = [
  "AI_PROVIDER",
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_TEXT_MODEL",
  "AI_VISION_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "OPENROUTER_API_KEY",
  "GROQ_API_KEY",
  "TOGETHER_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_BASE_URL",
  "AI_TIMEOUT_MS",
  "AI_MAX_RETRIES",
];

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    if (!(key in saved)) saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("🔀 Provider routing", () => {
  test("nothing configured: LLM is reported unconfigured", () => {
    expect(isLLMConfigured()).toBe(false);
    const info = getLLMInfo();
    expect(info.configured).toBe(false);
    expect(info.credentialAvailable).toBe(false);
  });

  test("AI_PROVIDER=gemini resolves the native protocol", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "k";
    const cfg = resolveLLMConfig();
    expect(cfg.kind).toBe("gemini");
    expect(cfg.baseUrl).toBeNull();
    expect(isGeminiConfigured()).toBe(true);
    expect(geminiApiKey()).toBe("k");
  });

  test("GEMINI_API_KEY alone auto-selects gemini", () => {
    process.env.GEMINI_API_KEY = "k";
    expect(resolveLLMConfig().kind).toBe("gemini");
  });

  test("a provider-specific key auto-selects its base URL", () => {
    process.env.OPENROUTER_API_KEY = "k";
    const cfg = resolveLLMConfig();
    expect(cfg.provider).toBe("openrouter");
    expect(cfg.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(isLLMConfigured()).toBe(true);
  });

  test("a local base URL needs no API key", () => {
    process.env.AI_BASE_URL = "http://localhost:11434/v1";
    expect(isLLMConfigured()).toBe(true);
  });

  test("text and vision models are resolved independently", () => {
    process.env.AI_API_KEY = "k";
    process.env.AI_BASE_URL = "https://api.openai.com/v1";
    process.env.AI_TEXT_MODEL = "text-model-x";
    process.env.AI_VISION_MODEL = "vision-model-y";
    expect(getTextModel()).toBe("text-model-x");
    expect(getVisionModel()).toBe("vision-model-y");
  });

  test("AI_MODEL is the shared default for text and vision", () => {
    process.env.AI_API_KEY = "k";
    process.env.AI_BASE_URL = "https://api.openai.com/v1";
    process.env.AI_MODEL = "shared-model";
    expect(getTextModel()).toBe("shared-model");
    expect(getVisionModel()).toBe("shared-model");
  });
});

describe("🌐 chatCompleteDetailed", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  test("posts to the OpenAI-compatible endpoint and reports usage + latency", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_KEY = "k";
    process.env.AI_MODEL = "m";
    let calledUrl = "";
    let authHeader = "";
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      calledUrl = String(url);
      authHeader = String((init.headers as Record<string, string>)?.Authorization ?? "");
      return new Response(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "مرحبا" } }],
          usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await chatCompleteDetailed([{ role: "user", content: "hi" }]);
    expect(calledUrl).toBe("https://api.openai.com/v1/chat/completions");
    expect(authHeader).toBe("Bearer k");
    expect(result.text).toBe("مرحبا");
    expect(result.model).toBe("m");
    expect(result.usage.totalTokens).toBe(7);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  test("gemini posts to generateContent with the x-goog-api-key header", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "gkey";
    process.env.AI_MODEL = "gemini-2.0-flash";
    let calledUrl = "";
    let keyHeader = "";
    global.fetch = jest.fn(async (url: string, init: RequestInit) => {
      calledUrl = String(url);
      keyHeader = String((init.headers as Record<string, string>)["x-goog-api-key"]);
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "أهلاً" }] } }],
          usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 1, totalTokenCount: 4 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await chatCompleteDetailed([{ role: "user", content: "hi" }]);
    expect(calledUrl).toContain("/models/gemini-2.0-flash:generateContent");
    expect(keyHeader).toBe("gkey");
    expect(result.text).toBe("أهلاً");
    expect(result.provider).toBe("gemini");
    expect(result.usage.totalTokens).toBe(4);
  });

  test("gemini vision sends the image as inlineData", async () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "gkey";
    process.env.AI_VISION_MODEL = "gemini-2.0-flash";
    let body: Record<string, unknown> = {};
    global.fetch = jest.fn(async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    await chatCompleteDetailed(
      [
        {
          role: "user",
          content: [
            { type: "text", text: "diagnose" },
            { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
          ],
        },
      ],
      { model: getVisionModel() },
    );

    const contents = body.contents as Array<{ parts: Array<Record<string, unknown>> }>;
    expect(contents[0].parts[1]).toEqual({
      inlineData: { mimeType: "image/png", data: "QUJD" },
    });
  });

  test("an unconfigured provider throws rather than inventing output", async () => {
    await expect(
      chatCompleteDetailed([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/No LLM provider configured/);
  });

  test("a 401 from the provider surfaces as an error, not a fake answer", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_KEY = "bad";
    global.fetch = jest.fn(async () =>
      new Response("unauthorized", { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(
      chatCompleteDetailed([{ role: "user", content: "hi" }], { retries: 0 }),
    ).rejects.toMatchObject({ status: 401 });
  });

  test("chatCompleteJson rejects non-JSON content", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_KEY = "k";
    global.fetch = jest.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "plain prose, no json" } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    await expect(
      chatCompleteJson([{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/parseable JSON/);
  });
});

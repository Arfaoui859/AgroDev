/**
 * Provider adapter tests. These exercise the real adapter code paths:
 *  - unconfigured providers raise explicit ProviderError (never fabricated data)
 *  - timeouts and transient HTTP failures are normalised and retried
 *  - malformed JSON is surfaced as a parse error
 *
 * No network access is required: fetch is stubbed with deterministic responses.
 */
import {
  fetchJson,
  ProviderError,
  round,
  parseRetryAfter,
  backoffDelayMs,
} from "../../server/services/providers/http";
import {
  chatComplete,
  chatCompleteJson,
  extractJson,
  isLLMConfigured,
  defaultModelFor,
  resolveLLMConfig,
  probeTimeoutMs,
  PROBE_TIMEOUT_FLOOR_MS,
} from "../../server/services/providers/llmProvider";
import { geminiGenerateContent } from "../../server/services/providers/gemini";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.AI_PROVIDER;
  delete process.env.AI_TEXT_MODEL;
  delete process.env.AI_VISION_MODEL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.AI_TIMEOUT_MS;
  delete process.env.AI_HEALTH_TIMEOUT_MS;
});

describe("health-probe timeout resolution", () => {
  test("defaults to the generous probe floor, independent of AI_TIMEOUT_MS", () => {
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
    // A short inference timeout must NOT shrink the probe budget.
    process.env.AI_TIMEOUT_MS = "20000";
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
    // Even an extreme value has no effect.
    process.env.AI_TIMEOUT_MS = "1000";
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
  });

  test("AI_HEALTH_TIMEOUT_MS overrides the probe budget", () => {
    process.env.AI_HEALTH_TIMEOUT_MS = "6000";
    expect(probeTimeoutMs()).toBe(6000);
  });

  test("ignores non-numeric and non-positive probe overrides", () => {
    process.env.AI_HEALTH_TIMEOUT_MS = "not-a-number";
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
    process.env.AI_HEALTH_TIMEOUT_MS = "0";
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
    process.env.AI_HEALTH_TIMEOUT_MS = "-5";
    expect(probeTimeoutMs()).toBe(PROBE_TIMEOUT_FLOOR_MS);
  });
});

function mockFetch(impl: typeof fetch) {
  global.fetch = impl as typeof fetch;
}

describe("http provider helpers", () => {
  test("returns parsed JSON on success", async () => {
    mockFetch(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const data = await fetchJson<{ ok: boolean }>("https://example.test/x", { retries: 0 });
    expect(data.ok).toBe(true);
  });

  test("retries transient 5xx then succeeds", async () => {
    let calls = 0;
    mockFetch(async () => {
      calls++;
      if (calls < 2) return new Response("boom", { status: 503 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const data = await fetchJson<{ ok: boolean }>("https://example.test/x", {
      retries: 2,
      retryDelayMs: 1,
    });
    expect(data.ok).toBe(true);
    expect(calls).toBe(2);
  });

  test("does not retry 4xx and fails fast", async () => {
    let calls = 0;
    mockFetch(async () => {
      calls++;
      return new Response("nope", { status: 400 });
    });
    await expect(
      fetchJson("https://example.test/x", { retries: 3, retryDelayMs: 1 }),
    ).rejects.toBeInstanceOf(ProviderError);
    expect(calls).toBe(1);
  });

  test("surfaces timeouts as ProviderError(kind=timeout)", async () => {
    mockFetch(async () => {
      const err: any = new Error("aborted");
      err.name = "AbortError";
      throw err;
    });
    await expect(
      fetchJson("https://example.test/x", { retries: 0, timeoutMs: 5 }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  test("surfaces non-JSON responses as parse errors", async () => {
    mockFetch(async () => new Response("<html>not json</html>", { status: 200 }));
    await expect(
      fetchJson("https://example.test/x", { retries: 0 }),
    ).rejects.toMatchObject({ kind: "parse" });
  });

  test("round handles non-numeric input safely", () => {
    expect(round("abc", 2)).toBe(0);
    expect(round(3.14159, 2)).toBe(3.14);
  });
});

describe("llmProvider", () => {
  test("is unconfigured when no env is set", () => {
    expect(isLLMConfigured()).toBe(false);
  });

  test("throws ProviderError(unconfigured) instead of returning fake content", async () => {
    await expect(
      chatComplete([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({ kind: "unconfigured" });
  });

  test("returns assistant content when configured", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    mockFetch(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "  مرحبا  " } }] }),
        { status: 200 },
      ),
    );
    const text = await chatComplete([{ role: "user", content: "hi" }]);
    expect(text).toBe("مرحبا");
  });

  test("empty LLM content is a parse error (callers must fall back)", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    mockFetch(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    await expect(
      chatComplete([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({ kind: "parse" });
  });

  test("chatCompleteJson parses fenced JSON", async () => {
    process.env.AI_BASE_URL = "https://llm.test/v1";
    process.env.AI_API_KEY = "test-key";
    mockFetch(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "```json\n{\"a\":1}\n```" } }],
        }),
        { status: 200 },
      ),
    );
    const data = await chatCompleteJson<{ a: number }>([
      { role: "user", content: "hi" },
    ]);
    expect(data.a).toBe(1);
  });

  test("extractJson handles prose-wrapped JSON", () => {
    expect(extractJson('Sure! {"crop":"wheat"} done')).toEqual({ crop: "wheat" });
    expect(extractJson("no json here")).toBeUndefined();
  });
});

describe("exponential backoff + Retry-After", () => {
  test("parseRetryAfter accepts delta-seconds and HTTP-dates", () => {
    expect(parseRetryAfter("2")).toBe(2000);
    expect(parseRetryAfter("0.5")).toBe(500);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("")).toBeUndefined();
    expect(parseRetryAfter("not-a-value")).toBeUndefined();
    expect(parseRetryAfter("Wed, 21 Oct 2015 07:28:00 GMT")).toBe(0);
  });

  test("backoff grows exponentially and never exceeds the cap", () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const ceiling = Math.min(100 * 2 ** attempt, 5000);
      for (let i = 0; i < 25; i++) {
        const delay = backoffDelayMs(attempt, 100, 5000);
        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  test("Retry-After takes precedence and is capped by maxRetryDelayMs", () => {
    expect(backoffDelayMs(3, 100, 5000, 2000)).toBe(2000);
    expect(backoffDelayMs(0, 100, 5000, 999999)).toBe(5000);
  });

  test("a Retry-After header is surfaced on the ProviderError", async () => {
    mockFetch(
      async () =>
        new Response("slow down", {
          status: 429,
          headers: { "Retry-After": "1" },
        }),
    );
    const error = (await fetchJson("https://example.test/x", {
      retries: 0,
    }).catch((e) => e)) as ProviderError;
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.status).toBe(429);
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(1000);
  });

  test("retries are bounded to exactly `retries` extra attempts", async () => {
    let calls = 0;
    mockFetch(async () => {
      calls += 1;
      return new Response("still throttled", { status: 429 });
    });
    await expect(
      fetchJson("https://example.test/x", { retries: 2, retryDelayMs: 1 }),
    ).rejects.toBeInstanceOf(ProviderError);
    // 1 initial attempt + 2 retries, then give up — never unbounded.
    expect(calls).toBe(3);
  });

  test("backoff uses full jitter (delay is not deterministic)", () => {
    const samples = new Set<number>();
    for (let i = 0; i < 200; i++) samples.add(backoffDelayMs(4, 100, 100_000));
    // A fixed backoff would yield a single value; jitter must vary.
    expect(samples.size).toBeGreaterThan(1);
    for (const value of samples) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100 * 2 ** 4);
    }
  });

  test("a zero base delay yields no backoff (delay 0)", () => {
    expect(backoffDelayMs(5, 0, 30_000)).toBe(0);
  });
});

describe("default model identifiers", () => {
  test("Gemini default is not a retired identifier", () => {
    const model = defaultModelFor("gemini");
    expect(model).not.toBe("gemini-2.0-flash");
    expect(model).not.toBe("gemini-1.5-flash");
    expect(model.length).toBeGreaterThan(0);
    // A rolling alias so a shutdown of a dated model cannot 404 every call.
    expect(model).toMatch(/-latest$/);
  });

  test("a configured model is never silently substituted", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "k";
    process.env.AI_TEXT_MODEL = "my-text-model";
    process.env.AI_VISION_MODEL = "my-vision-model";
    const cfg = resolveLLMConfig();
    expect(cfg.textModel).toBe("my-text-model");
    expect(cfg.visionModel).toBe("my-vision-model");
    delete process.env.AI_TEXT_MODEL;
    delete process.env.AI_VISION_MODEL;
  });
});

describe("gemini adapter", () => {
  const geminiResponse = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200 });

  test("an empty MAX_TOKENS answer is returned, not raised as a parse error", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch(async () =>
      geminiResponse({
        candidates: [
          { content: { parts: [{ text: "" }], role: "model" }, finishReason: "MAX_TOKENS" },
        ],
        usageMetadata: { promptTokenCount: 2, totalTokenCount: 2 },
      }),
    );
    const result = await geminiGenerateContent(
      [{ role: "user", content: "ping" }],
      { model: "gemini-flash-lite-latest", maxTokens: 1, retries: 0 },
    );
    expect(result.text).toBe("");
    expect(result.usage.totalTokens).toBe(2);
  });

  test("an empty STOP answer is still a parse error", async () => {
    process.env.GEMINI_API_KEY = "k";
    mockFetch(async () =>
      geminiResponse({
        candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "STOP" }],
      }),
    );
    await expect(
      geminiGenerateContent([{ role: "user", content: "ping" }], {
        model: "m",
        retries: 0,
      }),
    ).rejects.toMatchObject({ kind: "parse" });
  });
});

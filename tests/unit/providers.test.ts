/**
 * Provider adapter tests. These exercise the real adapter code paths:
 *  - unconfigured providers raise explicit ProviderError (never fabricated data)
 *  - timeouts and transient HTTP failures are normalised and retried
 *  - malformed JSON is surfaced as a parse error
 *
 * No network access is required: fetch is stubbed with deterministic responses.
 */
import { fetchJson, ProviderError, round } from "../../server/services/providers/http";
import { chatComplete, chatCompleteJson, extractJson, isLLMConfigured } from "../../server/services/providers/llmProvider";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.OPENAI_API_KEY;
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

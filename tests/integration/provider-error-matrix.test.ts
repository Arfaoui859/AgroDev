/**
 * Provider error-path matrix.
 *
 * Every failure mode a real provider can produce must surface as an error (or an
 * honest fallback) — never as fabricated data, and never as a success label.
 * fetch is stubbed so no network call is made.
 */
import { fetchJson, ProviderError } from "../../server/services/providers/http";
import { chatCompleteDetailed } from "../../server/services/providers/llmProvider";

const realFetch = global.fetch;

const ENV_KEYS = ["AI_PROVIDER", "AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "AI_TIMEOUT_MS", "AI_MAX_RETRIES"];
const saved: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    process.env[key] = undefined as unknown as string;
  }
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

beforeEach(() => {
  process.env.AI_PROVIDER = "openai";
  process.env.AI_BASE_URL = "https://api.example.com/v1";
  process.env.AI_API_KEY = "k";
  process.env.AI_MODEL = "m";
  process.env.AI_MAX_RETRIES = "0";
});

afterEach(() => {
  global.fetch = realFetch;
});

function stub(status: number, body = ""): void {
  global.fetch = jest.fn(async () =>
    new Response(body, { status, headers: { "Content-Type": "application/json" } }),
  ) as unknown as typeof fetch;
}

describe("🚨 HTTP status matrix", () => {
  test.each([401, 403])("HTTP %i surfaces as a non-retryable http error", async (status) => {
    stub(status, "denied");
    await expect(
      chatCompleteDetailed([{ role: "user", content: "hi" }]),
    ).rejects.toMatchObject({ name: "ProviderError", status, kind: "http" });
  });

  test("HTTP 429 is retryable", async () => {
    stub(429, "slow down");
    const error = await chatCompleteDetailed([{ role: "user", content: "hi" }]).catch(
      (e) => e as ProviderError,
    );
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.status).toBe(429);
    expect(error.retryable).toBe(true);
  });

  test("HTTP 503 is retryable and reported as upstream", async () => {
    stub(503, "unavailable");
    const error = await chatCompleteDetailed([{ role: "user", content: "hi" }]).catch(
      (e) => e as ProviderError,
    );
    expect(error.status).toBe(503);
    expect(error.retryable).toBe(true);
  });
});

describe("⏱️ transport failures", () => {
  test("a timeout aborts and reports kind=timeout", async () => {
    global.fetch = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;

    await expect(
      fetchJson("https://api.example.com/x", { timeoutMs: 50, retries: 0, provider: "test" }),
    ).rejects.toMatchObject({ kind: "timeout", retryable: true });
  });

  test("a network error reports kind=network", async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(
      fetchJson("https://api.example.com/x", { retries: 0, provider: "test" }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  test("a non-JSON 200 reports kind=parse", async () => {
    global.fetch = jest.fn(async () =>
      new Response("<html>not json</html>", { status: 200 }),
    ) as unknown as typeof fetch;
    await expect(
      fetchJson("https://api.example.com/x", { retries: 0, provider: "test" }),
    ).rejects.toMatchObject({ kind: "parse" });
  });
});

describe("♻️ retry behaviour", () => {
  test("a transient 429 is retried and then succeeds", async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response("slow", { status: 429 });
      return new Response(
        JSON.stringify({ choices: [{ message: { content: "recovered" } }] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    process.env.AI_MAX_RETRIES = "1";
    const result = await chatCompleteDetailed([{ role: "user", content: "hi" }]);
    expect(result.text).toBe("recovered");
    expect(calls).toBe(2);
  });

  test("a 401 is not retried (fails fast on one call)", async () => {
    let calls = 0;
    global.fetch = jest.fn(async () => {
      calls += 1;
      return new Response("denied", { status: 401 });
    }) as unknown as typeof fetch;
    process.env.AI_MAX_RETRIES = "3";
    await expect(chatCompleteDetailed([{ role: "user", content: "hi" }])).rejects.toBeInstanceOf(
      ProviderError,
    );
    expect(calls).toBe(1);
  });
});

/**
 * When a real provider is configured, the detailed soil analysis must use it
 * and mark the result as real. Previously it only recognised the raw
 * OPENAI_* env vars, so a deployment configured through the shared adapter
 * (Gemini, OpenRouter, Groq, Ollama, ...) silently fell back to the demo
 * generator while still reporting success.
 *
 * The provider HTTP call is stubbed; no network request is made.
 */
import request from "supertest";
import express from "express";

const ENV_KEYS = [
  "AI_PROVIDER",
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "GEMINI_API_KEY",
] as const;

const saved: Record<string, string | undefined> = {};
const realFetch = global.fetch;

function clearProviderEnv() {
  for (const key of ENV_KEYS) {
    if (!(key in saved)) saved[key] = process.env[key];
    delete process.env[key];
  }
}

function stubProviderJson(payload: unknown) {
  global.fetch = jest.fn(async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ) as unknown as typeof fetch;
}

describe("🌱 Detailed soil analysis with a configured provider", () => {
  let app: express.Application;

  beforeEach(() => {
    clearProviderEnv();
    jest.resetModules();
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://api.openai.com/v1";
    process.env.AI_MODEL = "test-model";
    // Import after env is set so the module reads the configured provider.
    const { createServer } = require("../../server/index");
    app = createServer();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  test("provider output is labelled as AI advisory, not verified measurements", async () => {
    stubProviderJson({
      soilAnalysis: { currentStatus: { overallGrade: { grade: "جيد" } } },
    });

    const res = await request(app)
      .post("/api/soil-analysis/analyze")
      .send({ ph: 6.9, moisture: 30 })
      .expect(200);

    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.headers["x-data-provenance"]).toBe("ai-advisory");
    expect(res.headers["x-ai-provider-used"]).toBe("true");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("ai-advisory");
    expect(res.body.data.soilAnalysis).toBeDefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("a provider failure is surfaced, not silently demoed", async () => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ error: { message: "upstream 500" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const res = await request(app)
      .post("/api/soil-analysis/analyze")
      .send({ ph: 6.9, moisture: 30 });

    // With a provider configured, a failure must not masquerade as a demo report.
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).not.toBe(true);
  });
});

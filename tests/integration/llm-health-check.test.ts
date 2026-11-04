/**
 * Live LLM provider health-check tests.
 *
 * `probeLLMHealth` performs a real round-trip to the configured provider so a
 * configured-but-dead provider is reported as unreachable instead of "ready".
 * These tests boot a real HTTP server (no fetch stubbing) and drive the probe
 * through the public `/api/system/ai/health` endpoint.
 *
 * They cover the four states the mission requires be distinguished:
 *   - no provider configured   -> configured:false, no network call
 *   - provider healthy         -> reachable:true, latency recorded
 *   - provider returns an error-> reachable:false, coarse errorKind
 *   - provider never responds  -> reachable:false, errorKind:timeout
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { resetLLMHealthCache } from "../../server/services/providers/llmProvider";

type Mode = "ok" | "http-500" | "hang" | "gemini-max-tokens" | "slow-ok";
let mode: Mode = "ok";
let upstream: http.Server;
let baseUrl: string;
const savedEnv: Record<string, string | undefined> = {};

const ENV_KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER",
  "AI_TIMEOUT_MS",
  "AI_HEALTH_TIMEOUT_MS",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_BASE_URL",
];

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key] as string;
  }
  resetLLMHealthCache();
}

beforeAll(async () => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  upstream = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      // Native Gemini generateContent endpoint.
      if (req.url?.includes(":generateContent")) {
        if (mode === "gemini-max-tokens") {
          // A one-token budget is exhausted before any text is emitted, which
          // is exactly what a real Gemini liveness probe returns.
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              candidates: [
                { content: { parts: [{ text: "" }], role: "model" }, finishReason: "MAX_TOKENS" },
              ],
              usageMetadata: { promptTokenCount: 2, totalTokenCount: 2 },
            }),
          );
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "pong" }], role: "model" }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
          }),
        );
        return;
      }

      if (!req.url?.endsWith("/chat/completions")) {
        res.writeHead(404).end("{}");
        return;
      }
      if (mode === "http-500") {
        res.writeHead(500).end("upstream boom");
        return;
      }
      if (mode === "hang") {
        return; // never respond
      }
      if (mode === "slow-ok") {
        // A cold provider round-trip that exceeds the old 10s probe default.
        setTimeout(() => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              choices: [{ message: { role: "assistant", content: "pong" } }],
              usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            }),
          );
        }, 11_000);
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          choices: [{ message: { role: "assistant", content: "pong" } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
});

afterAll(async () => {
  restoreEnv();
  await new Promise<void>((resolve) => upstream.close(() => resolve()));
});

beforeEach(() => {
  resetLLMHealthCache();
  delete process.env.AI_TIMEOUT_MS;
  delete process.env.AI_HEALTH_TIMEOUT_MS;
  mode = "ok";
});

function pointAtUpstream() {
  process.env.AI_PROVIDER = "openai-compatible";
  process.env.AI_BASE_URL = baseUrl;
  process.env.AI_API_KEY = "test-key";
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
}

function pointAtGeminiUpstream() {
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_BASE_URL = baseUrl;
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
  delete process.env.GOOGLE_API_KEY;
}

describe("🩺 LLM provider health check (/api/system/ai/health)", () => {
  test("reports configured:false and performs no network call when unset", async () => {
    delete process.env.AI_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.reachable).toBe(false);
    expect(res.body.errorKind).toBe("unconfigured");
  });

  test("reports reachable:true against a live provider", async () => {
    pointAtUpstream();
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.reachable).toBe(true);
    expect(typeof res.body.latencyMs).toBe("number");
    // The response must never carry the credential.
    expect(JSON.stringify(res.body)).not.toContain("test-key");
  });

  test("reports 503 + reachable:false when the provider errors", async () => {
    pointAtUpstream();
    mode = "http-500";
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(503);
    expect(res.body.configured).toBe(true);
    expect(res.body.reachable).toBe(false);
    expect(res.body.errorKind).toBe("http");
    expect(JSON.stringify(res.body)).not.toContain("upstream boom");
  });

  test("reports errorKind:timeout when the provider never responds", async () => {
    pointAtUpstream();
    // The probe is bounded by its OWN timeout, not AI_TIMEOUT_MS.
    process.env.AI_HEALTH_TIMEOUT_MS = "1500";
    mode = "hang";
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(503);
    expect(res.body.reachable).toBe(false);
    expect(res.body.errorKind).toBe("timeout");
  });

  test("AI_TIMEOUT_MS does NOT cap the health probe (production regression)", async () => {
    // Regression for the Render incident: the host set AI_TIMEOUT_MS=20000 to
    // bound user-facing latency, and the probe reused it, so a healthy but slow
    // provider reported errorKind:"timeout" at exactly 20s. The probe must
    // ignore AI_TIMEOUT_MS entirely: set it BELOW the upstream response time so
    // a probe that consulted it would abort, while the real probe still succeeds.
    delete process.env.AI_HEALTH_TIMEOUT_MS;
    pointAtUpstream();
    process.env.AI_TIMEOUT_MS = "1500";
    mode = "slow-ok"; // answers at ~11s — far past the 1.5s inference cap
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(200);
    expect(res.body.reachable).toBe(true);
    expect(res.body.errorKind).toBeUndefined();
    expect(res.body.latencyMs).toBeGreaterThanOrEqual(10_000);
  }, 60_000);

  test("AI_HEALTH_TIMEOUT_MS overrides the probe timeout", async () => {
    pointAtUpstream();
    process.env.AI_HEALTH_TIMEOUT_MS = "1500";
    mode = "slow-ok"; // answers at ~11s, well past the 1.5s probe cap
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(503);
    expect(res.body.reachable).toBe(false);
    expect(res.body.errorKind).toBe("timeout");
  }, 30_000);

  test("a Gemini MAX_TOKENS empty answer still counts as reachable", async () => {
    // Regression: a 1-token liveness probe returns no text with
    // finishReason=MAX_TOKENS. That is a successful round-trip, not a failure.
    pointAtGeminiUpstream();
    mode = "gemini-max-tokens";
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.reachable).toBe(true);
    expect(typeof res.body.latencyMs).toBe("number");
  });

  test("default probe timeout tolerates a cold call slower than 10s", async () => {
    // Regression: the probe default was 10s, so a cold provider answering in
    // ~11s was reported unreachable. The default must now clear that.
    delete process.env.AI_TIMEOUT_MS;
    pointAtUpstream();
    mode = "slow-ok";
    const app = createServer();
    const res = await request(app).get("/api/system/ai/health");
    expect(res.status).toBe(200);
    expect(res.body.reachable).toBe(true);
    expect(res.body.latencyMs).toBeGreaterThanOrEqual(10_000);
  }, 30_000);

  test("the configuration endpoint advertises the health endpoint", async () => {
    const app = createServer();
    const res = await request(app).get("/api/system/ai");
    expect(res.status).toBe(200);
    expect(res.body.healthEndpoint).toBe("/api/system/ai/health");
  });
});

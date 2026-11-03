/**
 * Live LLM path test — no fetch stubbing.
 *
 * Boots a real OpenAI-compatible HTTP server on an ephemeral port, points the
 * provider at it via environment variables, and drives the full chain:
 *   POST /api/ai/assistant/chat  ->  farmAdvisor  ->  llmProvider  ->  HTTP
 *
 * This proves the wiring works over a real socket, which mocked-fetch tests
 * cannot. It also proves the failure path: when the provider returns an error,
 * the advisor falls back to rule-based output and says so.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

type Mode = "ok" | "json-error" | "bad-status" | "hang" | "malformed";

let mode: Mode = "ok";
let server: http.Server;
let baseUrl: string;
const savedEnv: Record<string, string | undefined> = {};

const ENV_KEYS = [
  "AI_BASE_URL",
  "AI_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
];

beforeAll(async () => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];

  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!req.url?.endsWith("/chat/completions")) {
        res.writeHead(404).end("{}");
        return;
      }
      switch (mode) {
        case "bad-status":
          res.writeHead(500).end("upstream boom");
          return;
        case "json-error":
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: { message: "rate limited" } }));
          return;
        case "malformed":
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ choices: [{ message: { content: "not json at all" } }] }));
          return;
        case "hang":
          // Never respond: forces the provider timeout path.
          return;
        default: {
          const parsed = JSON.parse(body || "{}");
          const reply = parsed.messages?.some((m: { content: string }) =>
            m.content?.includes("json"),
          )
            ? '{"answer":"استعمل صنفاً مقاوماً","confidence":0.8}'
            : "استعمل 40 كغ آزوت للهكتار واروِ كل 10 أيام.";
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              choices: [{ message: { role: "assistant", content: reply }, finish_reason: "stop" }],
              usage: { total_tokens: 17 },
            }),
          );
        }
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/v1`;

  process.env.AI_BASE_URL = baseUrl;
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "live-test-model";
  process.env.AI_PROVIDER = "live-test";
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("🌐 Live LLM provider path", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("advisor returns dataSource=llm for a real provider response", async () => {
    mode = "ok";
    const response = await request(app)
      .post("/api/ai/assistant/chat")
      .send({ message: "كيف أسمّد القمح؟", language: "ar" })
      .expect(200);
    expect(response.body.dataSource).toBe("llm");
    expect(response.body.answer).toContain("آزوت");
    expect(response.body.modelInfo).toMatchObject({ provider: "live-test", model: "live-test-model" });
  });

  test("falls back to rule-based when the provider errors", async () => {
    mode = "json-error";
    const response = await request(app)
      .post("/api/ai/assistant/chat")
      .send({ message: "كيف أسمّد القمح؟" })
      .expect(200);
    expect(response.body.dataSource).toBe("rule-based");
    expect(response.body.note || response.body.disclaimer).toBeTruthy();
  });

  test("falls back to rule-based on a 5xx upstream", async () => {
    mode = "bad-status";
    const response = await request(app)
      .post("/api/ai/assistant/chat")
      .send({ message: "ما أفضل محصول؟" })
      .expect(200);
    expect(response.body.dataSource).toBe("rule-based");
  });

  test("survives a hanging provider via timeout fallback", async () => {
    mode = "hang";
    const previous = process.env.AI_TIMEOUT_MS;
    process.env.AI_TIMEOUT_MS = "300";
    try {
      const response = await request(app)
        .post("/api/ai/assistant/chat")
        .send({ message: "اختبار المهلة الزمنية" })
        .expect(200);
      expect(response.body.dataSource).toBe("rule-based");
    } finally {
      if (previous === undefined) delete process.env.AI_TIMEOUT_MS;
      else process.env.AI_TIMEOUT_MS = previous;
    }
  }, 15000);

  test("rejects an empty message", async () => {
    mode = "ok";
    await request(app).post("/api/ai/assistant/chat").send({ message: "" }).expect(400);
  });

  test("capability probe reports the LLM as configured while it is live", async () => {
    mode = "ok";
    const response = await request(app).get("/api/ai/agro-chat").expect(200);
    expect(response.body.engine).toBe("llm");
    expect(response.body.available).toBe(true);
    expect(response.body.llm.configured).toBe(true);
  });
});

/**
 * Middleware-ordering regression tests.
 *
 * Express applies middleware in registration order. The stricter AI rate limiter
 * was originally registered at line ~584, AFTER the AI inference routes
 * (/api/ai/recommend, /api/ai/models/:id/train, /api/disease/analyze, ...), so
 * those expensive endpoints were never throttled. These tests assert the
 * limiter is registered before every AI route by observing real 429s.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

describe("🛡️ Middleware ordering", () => {
  let app: express.Application;

  beforeEach(() => {
    process.env = { ...ORIGINAL, NODE_ENV: "production", AI_RATE_LIMIT_MAX: "5" };
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("AI inference routes are rate limited (429 after the configured max)", async () => {
    let sawTooMany = false;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/api/ai/soil/analyze")
        .send({ soil_data: { ph: 7 } });
      if (res.status === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });

  test("read-only AI capability probes do not consume the inference limit", async () => {
    for (let i = 0; i < 12; i++) {
      const agroChat = await request(app).get("/api/ai/agro-chat");
      const alerts = await request(app).get("/api/ai/alert-notifier");

      expect(agroChat.status).not.toBe(429);
      expect(alerts.status).not.toBe(429);
    }
  });

  test("disease analysis route is rate limited too", async () => {
    let sawTooMany = false;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/api/disease/analyze")
        .send({});
      if (res.status === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });

  test("health checks are never rate limited", async () => {
    for (let i = 0; i < 40; i++) {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
    }
  });

  test("privileged setup routes fail closed in production without a token", async () => {
    delete process.env.ADMIN_API_TOKEN;
    const res = await request(app).post("/api/setup-admin").send({});
    expect([401, 403]).toContain(res.status);
  });

  test("privileged setup routes reject a wrong token in production", async () => {
    process.env.ADMIN_API_TOKEN = "correct-horse";
    const res = await request(app)
      .post("/api/setup-admin")
      .set("x-admin-token", "wrong")
      .send({});
    expect([401, 403]).toContain(res.status);
  });
});

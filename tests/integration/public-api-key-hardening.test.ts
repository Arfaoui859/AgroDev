/**
 * Public API key-minting hardening tests.
 *
 * POST /api/public/create-key is anonymous and previously pushed onto an
 * unbounded in-memory array with a Math.random()-derived key. These tests pin
 * the fixes: a per-IP minting limit, a bounded store, and non-guessable keys.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

describe("🔑 Public API key minting", () => {
  let app: express.Application;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL,
      NODE_ENV: "production",
      PUBLIC_API_KEY_MINT_MAX: "3",
    };
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("minting is rate limited per IP (429 after the configured max)", async () => {
    let sawTooMany = false;
    for (let i = 0; i < 8; i++) {
      const res = await request(app)
        .post("/api/public/create-key")
        .send({ name: "Test", email: "t@example.com" });
      if (res.status === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });

  test("a created key is long, high-entropy and not time-guessable", async () => {
    const res = await request(app)
      .post("/api/public/create-key")
      .send({ name: "Test", email: "t@example.com" });

    expect(res.status).toBe(200);
    const key: string = res.body?.data?.apiKey;
    expect(typeof key).toBe("string");
    expect(key.startsWith("agro_")).toBe(true);
    // 24 random bytes base64url-encoded -> ~32 chars of payload.
    expect(key.length).toBeGreaterThan(25);
    // The old scheme embedded Date.now(); the new one must not.
    expect(key).not.toMatch(/_1[0-9]{12}_/);
  });

  test("still rejects a request missing name/email", async () => {
    const res = await request(app)
      .post("/api/public/create-key")
      .send({ name: "OnlyName" });
    expect(res.status).toBe(400);
  });
});

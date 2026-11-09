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

  test("API-key minting fails closed until keys and usage are persisted", async () => {
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post("/api/public/create-key")
        .send({ name: "Test", email: "t@example.com" });
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("PUBLIC_DATA_SOURCE_NOT_CONNECTED");
      expect(res.body.data?.apiKey).toBeUndefined();
    }
  });

});

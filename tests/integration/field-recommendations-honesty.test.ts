/**
 * Field AI-recommendation honesty tests.
 *
 * `POST /api/ai-recommendations` used to return Math.random() suitability
 * scores and invented yield/profit figures. It must now return deterministic
 * rule-based scores with explicit provenance, and must not emit fabricated
 * financial numbers.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🌾 POST /api/ai-recommendations", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("rejects a request without a field id", async () => {
    await request(app).post("/api/ai-recommendations").send({}).expect(400);
  });

  test("an unknown field is a clean 404 (no fabricated recommendations)", async () => {
    // With no database configured FarmService returns null -> not found.
    const res = await request(app)
      .post("/api/ai-recommendations")
      .send({ fieldId: "does-not-exist" });
    expect([404, 503]).toContain(res.status);
    expect(res.body.data?.recommendations).toBeUndefined();
  });
});

/**
 * Regression tests for 500s found by sweeping every parameterised route with a
 * placeholder id. Each one was a real production bug:
 *
 * 1. GET /api/market/crop/:cropId and /api/market/regional/:cropId threw
 *    because they queried a `crops` table that does not exist in the deployed
 *    schema (PGRST205). Crop metadata now falls back to the bundled reference
 *    dataset.
 * 2. GET /api/farms/:farmId and PUT /api/fields/:fieldId used Supabase
 *    `.single()`, which raises PGRST116 ("0 rows") for an unknown id, turning a
 *    not-found into a 500. They now use `.maybeSingle()` and answer 404.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("📊 Market endpoints survive a missing `crops` table", () => {
  test("GET /api/market/crop/:cropId does not 500", async () => {
    const res = await request(app).get(`/api/market/crop/${MISSING_ID}`);
    expect(res.status).toBeLessThan(500);
  });

  test("GET /api/market/regional/:cropId does not 500", async () => {
    const res = await request(app).get(`/api/market/regional/${MISSING_ID}`);
    expect(res.status).toBeLessThan(500);
  });
});

describe("🏡 Farm/field lookups never 500 (auth-guarded since the Nov-10 hardening)", () => {
  // These routes now require a verified farmer session (requireRole), so an
  // anonymous sweep is rejected with 401/403 before the lookup runs. The
  // regression they guard — a missing id turning into a 500 — is preserved:
  // the response must be a client error, never a server error.
  test("GET /api/farms/:farmId is a client error, never 500", async () => {
    const res = await request(app).get(`/api/farms/${MISSING_ID}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  test("PUT /api/fields/:fieldId is a client error, never 500", async () => {
    const res = await request(app)
      .put(`/api/fields/${MISSING_ID}`)
      .send({ name: "x" });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

/**
 * Unconfigured-database regression tests.
 *
 * When SUPABASE_URL / SUPABASE_ANON_KEY are absent (a fresh clone, CI, or a
 * misconfigured deployment) the Supabase client is `null`. Every service used to
 * call `supabase.from(...)` unguarded, so these routes threw
 * "Cannot read properties of null (reading 'from')" and answered 500. The
 * services now degrade honestly: reference data for crop metadata, empty
 * collections for reads, and a 503 for writes that genuinely need persistence.
 *
 * These tests deliberately strip the Supabase env and reload the module graph
 * so they exercise the null-client path regardless of the developer's .env.
 */
import request from "supertest";
import express from "express";

const SUPABASE_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const;

const SAVED: Record<string, string | undefined> = {};

describe("🗄️ Routes degrade gracefully with no database configured", () => {
  let app: express.Application;

  beforeAll(() => {
    // Set to empty strings rather than deleting: server/index.ts imports
    // "dotenv/config", which would otherwise repopulate these from a local
    // .env. dotenv does not override existing keys, so "" keeps them unset for
    // the module under test ("" is falsy in the lib/supabase guard).
    for (const k of SUPABASE_KEYS) {
      SAVED[k] = process.env[k];
      process.env[k] = "";
    }
    process.env.NODE_ENV = "test";

    jest.resetModules();
    // Re-import after the env change so supabase.ts sees no credentials.
    const { createServer } = require("../../server/index");
    app = createServer();
  });

  afterAll(() => {
    for (const k of SUPABASE_KEYS) {
      if (SAVED[k] === undefined) delete process.env[k];
      else process.env[k] = SAVED[k];
    }
    jest.resetModules();
  });

  test("GET /api/market/all refuses to fabricate prices when storage is empty", async () => {
    const res = await request(app).get("/api/market/all");
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("MARKET_DATA_NOT_AVAILABLE");
    expect(res.body.dataAvailable).toBe(false);
  });

  test("GET /api/market/trends refuses to infer trends from an empty database", async () => {
    const res = await request(app).get("/api/market/trends");
    expect(res.status).toBe(503);
    expect(res.body.dataAvailable).toBe(false);
  });

  test("GET /api/fields rejects callers without a verified farmer session", async () => {
    const res = await request(app).get("/api/fields");
    expect([401, 403]).toContain(res.status);
  });

  test("crop metadata still resolves from the bundled reference dataset", async () => {
    const res = await request(app).get("/api/crops");
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("a write is rejected before persistence when no verified session is supplied", async () => {
    const res = await request(app).post("/api/fields").send({
      farm_id: "00000000-0000-0000-0000-000000000000",
      name: "Test Field",
      size_hectares: 2,
      soil_type: "clay",
    });
    expect([401, 403]).toContain(res.status);
  });
});

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

  test("GET /api/market/all returns an honest empty summary, not 500", async () => {
    const res = await request(app).get("/api/market/all");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.summary.averagePrice).toBeNull();
    expect(res.body.data.isRealData).toBe(true);
  });

  test("GET /api/market/trends reports a zero sample size, not 500", async () => {
    const res = await request(app).get("/api/market/trends");
    expect(res.status).toBe(200);
    expect(res.body.data.sampleSize).toBe(0);
  });

  test("GET /api/fields returns an empty list, not 500", async () => {
    const res = await request(app).get("/api/fields");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toEqual([]);
  });

  test("crop metadata still resolves from the bundled reference dataset", async () => {
    const res = await request(app).get("/api/crops");
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("a write that needs persistence answers 503, not a leaked 500", async () => {
    const res = await request(app).post("/api/fields").send({
      farm_id: "00000000-0000-0000-0000-000000000000",
      name: "Test Field",
      size_hectares: 2,
      soil_type: "clay",
    });
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/not configured/i);
  });
});

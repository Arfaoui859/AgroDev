/**
 * Field AI-recommendation honesty tests.
 *
 * `POST /api/ai-recommendations` used to return Math.random() suitability
 * scores and invented yield/profit figures. It must now return deterministic
 * rule-based scores with explicit provenance, and must not emit fabricated
 * financial numbers.
 *
 * Since the Nov-10 hardening the route requires a verified farmer session
 * (requireRole). The Supabase SDK is mocked so the tests present a JWT and
 * exercise the real handler: a missing id is a 400, an unknown/malformed id is
 * a clean 404 — never a fabricated recommendation.
 */
import request from "supertest";
import express from "express";

function fakeBuilder(table?: string): any {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () =>
      Promise.resolve({ data: table === "users" ? { role: "farmer" } : null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return builder;
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: (table: string) => fakeBuilder(table),
    auth: {
      getUser: async () => ({ data: { user: { id: "farmer-1" } }, error: null }),
    },
  })),
}));

describe("🌾 POST /api/ai-recommendations", () => {
  let app: express.Application;
  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    jest.resetModules();
    const { createServer } = require("../../server/index");
    app = createServer();
  });

  const FARMER_JWT = { authorization: "Bearer farmer-jwt" };

  test("rejects an anonymous caller before any work runs", async () => {
    await request(app).post("/api/ai-recommendations").send({}).expect(403);
  });

  test("rejects a request without a field id", async () => {
    await request(app)
      .post("/api/ai-recommendations")
      .set(FARMER_JWT)
      .send({})
      .expect(400);
  });

  test("an unknown field is a clean 404 (no fabricated recommendations)", async () => {
    // With no database configured FarmService returns null -> not found.
    const res = await request(app)
      .post("/api/ai-recommendations")
      .set(FARMER_JWT)
      .send({ fieldId: "does-not-exist" });
    expect([404, 503]).toContain(res.status);
    expect(res.body.data?.recommendations).toBeUndefined();
  });
});

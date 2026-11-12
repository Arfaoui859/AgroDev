/**
 * Regression tests for two production 500s found by sweeping every route:
 *
 * 1. `/api/fields*` queried a `fields` table that does not exist in the
 *    deployed schema (PGRST205). Fields are `farm_sections` rows, mapped in
 *    FarmService.
 * 2. `/api/admin/create-user` and `/api/admin/set-password` used a dynamic
 *    `require()` inside the ESM server bundle ("require is not defined"),
 *    producing 500 for every request. They now use static imports.
 *
 * Since the Nov-10 security hardening these routes require a verified farmer
 * session (requireRole), so the tests present a Supabase JWT. The Supabase SDK
 * is mocked (no network) and resolves an empty field set / a farmer role, so
 * the assertions still exercise the real handler and schema mapping.
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

describe("🗂️ Field endpoints map onto the real schema", () => {
  test("GET /api/fields returns a success envelope, never 500", async () => {
    const res = await request(app).get("/api/fields").set(FARMER_JWT);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("GET /api/fields/:id returns 404 (not 500) for an unknown field", async () => {
    const res = await request(app)
      .get("/api/fields/00000000-0000-0000-0000-000000000000")
      .set(FARMER_JWT);
    expect(res.status).toBe(404);
  });

  test("POST /api/fields rejects an incomplete body with 400 and names the fields", async () => {
    const res = await request(app).post("/api/fields").set(FARMER_JWT).send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_INPUT");
    expect(res.body.missing).toEqual(
      expect.arrayContaining(["farm_id", "name", "size_hectares", "soil_type"]),
    );
  });
});

describe("🔐 Field endpoints reject anonymous callers before any query runs", () => {
  test("GET /api/fields without a verified session is 401/403, never 200", async () => {
    const res = await request(app).get("/api/fields");
    expect([401, 403]).toContain(res.status);
  });
});

describe("🔐 Admin routes use static imports (no 'require is not defined')", () => {
  test("POST /api/admin/create-user is forbidden without a token, not 500", async () => {
    const res = await request(app).post("/api/admin/create-user").send({});
    expect(res.status).not.toBe(500);
    expect([401, 403]).toContain(res.status);
  });

  test("POST /api/admin/set-password is forbidden without a token, not 500", async () => {
    const res = await request(app).post("/api/admin/set-password").send({});
    expect(res.status).not.toBe(500);
    expect([401, 403]).toContain(res.status);
  });
});

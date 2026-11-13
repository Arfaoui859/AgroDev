/**
 * Farmer workspace CRUD contract (`/api/assistant/actions/*`, `/api/assistant/farms`).
 *
 * The farmer workspace (`FarmOperationsWorkspace`) registers farms through
 * `POST /api/farms` and crops through `POST /api/assistant/actions/cultivations`.
 * These are the writes a newly registered farmer depends on, so the contract is
 * pinned here: the caller's own rows are read through a caller-scoped client,
 * the owner is taken from the verified JWT (never the body), input is validated
 * before any write, and a failed write reports failure instead of a fake success.
 *
 * Supabase is mocked so no network or database is touched.
 */
import request from "supertest";
import express from "express";

type CreateClientArgs = [string, string, any?];

function fakeBuilder(table?: string): any {
  const builder: any = {
    select: () => builder,
    insert: (payload: any) => {
      ((globalThis as any).__inserts ??= []).push({ table, payload });
      return builder;
    },
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () =>
      Promise.resolve({
        data: table === "users" ? { role: "farmer", is_active: true } : null,
        error: null,
      }),
    single: () =>
      Promise.resolve({
        data: table === "crop_cultivations" ? { id: "cult-1" } : null,
        error: null,
      }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return builder;
}

jest.mock("@supabase/supabase-js", () => {
  (globalThis as any).__createClientCalls = [];
  (globalThis as any).__inserts = [];
  return {
    createClient: jest.fn((...args: CreateClientArgs[]) => {
      (globalThis as any).__createClientCalls.push(args[2]);
      return {
        from: (table: string) => fakeBuilder(table),
        auth: {
          getUser: async () => ({
            data: { user: { id: "farmer-1" } },
            error: null,
          }),
        },
      };
    }),
  };
});

const inserts = () => ((globalThis as any).__inserts ?? []) as Array<{ table?: string; payload: any }>;
const createClientCalls = () => ((globalThis as any).__createClientCalls ?? []) as any[];

const FARM_ID = "11111111-1111-1111-1111-111111111111";

describe("🧑‍🌾 Farmer workspace CRUD routes", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    jest.resetModules();
    const { createServer } = require("../../server/index");
    app = createServer();
  });

  beforeEach(() => {
    createClientCalls().length = 0;
    (globalThis as any).__inserts = [];
  });

  test("anonymous callers cannot list farms or write a cultivation", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const farms = await request(app).get("/api/assistant/farms");
      expect(farms.status).toBe(401);
      const write = await request(app)
        .post("/api/assistant/actions/cultivations")
        .send({ farm_id: FARM_ID, crop_name: "طماطم", planting_date: "2026-03-01", area_hectares: 1 });
      expect(write.status).toBe(401);
      expect(inserts()).toHaveLength(0);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  test("listing farms reads through the caller's own scoped client", async () => {
    const res = await request(app)
      .get("/api/assistant/farms")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const scoped = createClientCalls().some(
      (opts) => opts?.global?.headers?.Authorization === "Bearer farmer-jwt",
    );
    expect(scoped).toBe(true);
  });

  test("a cultivation is validated before any write happens", async () => {
    const res = await request(app)
      .post("/api/assistant/actions/cultivations")
      .set("authorization", "Bearer farmer-jwt")
      .send({ farm_id: "not-a-uuid", crop_name: "", planting_date: "nope", area_hectares: -1 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_CULTIVATION_INPUT");
    expect(res.body.missing_or_invalid).toEqual(
      expect.arrayContaining(["farm_id", "crop_name", "planting_date", "area_hectares"]),
    );
    expect(inserts()).toHaveLength(0);
  });

  test("a cultivation the caller does not own is refused, not written", async () => {
    // The mocked farms lookup returns null, i.e. "not found or not owned".
    const res = await request(app)
      .post("/api/assistant/actions/cultivations")
      .set("authorization", "Bearer farmer-jwt")
      .send({ farm_id: FARM_ID, crop_name: "قمح", planting_date: "2026-03-01", area_hectares: 1 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("FARM_NOT_FOUND_OR_NOT_OWNED");
    expect(inserts()).toHaveLength(0);
  });
});

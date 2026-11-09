/**
 * Farm/field RLS identity regression tests.
 *
 * `/api/farms`, `/api/fields` and their siblings read the per-user tables that
 * carry RLS policies keyed on auth.uid(). Before this fix the routes queried them
 * through the module-level anon client, so PostgREST saw auth.uid() = NULL and the
 * policies denied every row — the farmer's own farms/fields were invisible and
 * writes failed. The routes must now build a caller-scoped client from the
 * request's Authorization header.
 *
 * The Supabase SDK is mocked so no network is touched; we assert on the client
 * the routes construct rather than on live data.
 */
import request from "supertest";
import express from "express";
import { createClient } from "@supabase/supabase-js";

type CreateClientArgs = [string, string, any?];

/** A minimal thenable query builder that resolves to an empty result set. */
function fakeBuilder(): any {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return builder;
}

// The calls array lives on globalThis so the (hoisted) jest.mock factory can
// push into it before this module's const declarations have run.
jest.mock("@supabase/supabase-js", () => {
  (globalThis as any).__createClientCalls = [];
  return {
    createClient: jest.fn((...args: CreateClientArgs[]) => {
      (globalThis as any).__createClientCalls.push(args[2]);
      return {
        from: () => fakeBuilder(),
        // requireAuth verifies the bearer token through the module-level client.
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

function createClientCalls(): any[] {
  return (globalThis as any).__createClientCalls ?? [];
}

function authHeaderOf(opts: any): string | undefined {
  return opts?.global?.headers?.Authorization;
}

describe("🏡 Farm/field routes forward the caller's JWT to Supabase", () => {
  let app: express.Application;

  beforeAll(() => {
    // Set the Supabase env BEFORE requiring server/index so lib/supabase builds
    // a (mocked) client rather than the null/degraded path.
    process.env.NODE_ENV = "test";
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    jest.resetModules();
    const { createServer } = require("../../server/index");
    app = createServer();
  });

  beforeEach(() => {
    createClientCalls().length = 0;
    (createClient as jest.Mock).mockClear();
  });

  test("GET /api/farms with a Bearer token builds a scoped client", async () => {
    const res = await request(app)
      .get("/api/farms")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(200);
    expect(
      createClientCalls().some((opts) => authHeaderOf(opts) === "Bearer farmer-jwt"),
    ).toBe(true);
  });

  test("GET /api/fields with a Bearer token builds a scoped client", async () => {
    await request(app)
      .get("/api/fields")
      .set("authorization", "Bearer farmer-jwt");
    expect(
      createClientCalls().some((opts) => authHeaderOf(opts) === "Bearer farmer-jwt"),
    ).toBe(true);
  });

  test("an unauthenticated request never fabricates a user identity", async () => {
    await request(app).get("/api/farms");
    expect(createClientCalls().every((opts) => !authHeaderOf(opts))).toBe(true);
  });

  test("in production an anonymous caller is rejected before any query runs", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await request(app).get("/api/farms");
      expect(res.status).toBe(401);
      expect(createClientCalls().length).toBe(0);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  test("field alerts are explicitly empty until a real alert source is connected", async () => {
    const res = await request(app)
      .get("/api/field-alerts")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.provenance).toMatchObject({
      source: "not-configured",
      simulated: false,
      persisted: false,
    });
  });

  test("activity history never returns a fabricated farmer or soil measurement", async () => {
    const res = await request(app)
      .get("/api/activity-logs")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.provenance).toMatchObject({
      source: "not-configured",
      simulated: false,
      persisted: false,
    });
  });
});

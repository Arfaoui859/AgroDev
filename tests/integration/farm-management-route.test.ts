/**
 * Farm-management dashboard route contract.
 *
 * Regression guard for the rewrite away from random demo data: the overview
 * must read the caller's own rows through a caller-scoped Supabase client and
 * must fail closed (401/403/503) rather than serve invented figures when no
 * verified session or database is available.
 */
import request from "supertest";
import express from "express";

type CreateClientArgs = [string, string, any?];

function fakeBuilder(table?: string): any {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () =>
      Promise.resolve({
        data: table === "users" ? { role: "farmer", is_active: true } : null,
        error: null,
      }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };
  return builder;
}

jest.mock("@supabase/supabase-js", () => {
  (globalThis as any).__createClientCalls = [];
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

function authHeaderOf(opts: any): string | undefined {
  return opts?.global?.headers?.Authorization;
}

describe("farm-management dashboard route", () => {
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
    ((globalThis as any).__createClientCalls ??= []).length = 0;
  });

  test("an anonymous caller cannot read the overview", async () => {
    const res = await request(app).get("/api/farm-management/overview");
    expect([401, 403]).toContain(res.status);
  });

  test("a verified farmer reads the overview through a caller-scoped client", async () => {
    const res = await request(app)
      .get("/api/farm-management/overview")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(
      ((globalThis as any).__createClientCalls ?? []).some(
        (opts: any) => authHeaderOf(opts) === "Bearer farmer-jwt",
      ),
    ).toBe(true);
  });

  test("the labour endpoint fails closed rather than inventing attendance", async () => {
    const res = await request(app)
      .get("/api/farm-management/labor")
      .set("authorization", "Bearer farmer-jwt");
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("FARM_LABOR_NOT_CONNECTED");
    expect(res.headers["x-agrogrowth-data-status"]).toBe("unavailable");
  });
});

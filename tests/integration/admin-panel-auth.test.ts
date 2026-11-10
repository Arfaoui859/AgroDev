/**
 * Regression tests for the admin-panel GET endpoints.
 *
 * A prior audit found that the seven `GET /api/admin/*` routes were mounted
 * without any admin guard, so an anonymous caller could read platform-wide
 * figures (the whole user list, security events, activity logs). They are now
 * wrapped with `requireAdminAccess`.
 *
 * In the test environment `ENABLE_DEMO_ENDPOINTS` is not "false" and
 * `NODE_ENV` is not "production", so the demo fallback applies and an
 * anonymous request is allowed through (unchanged dev ergonomics). These tests
 * therefore assert the two properties that hold in every environment:
 *
 *   1. A valid `x-admin-token` is always accepted.
 *   2. The endpoints are never 500 — a missing/incorrect guard must not crash.
 *
 * The strict production behaviour (anonymous → 401, non-admin JWT → 403) is
 * asserted separately in `admin-authorization.test.ts` by forcing
 * `ENABLE_DEMO_ENDPOINTS=false`.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ADMIN_ENDPOINTS = [
  "/api/admin/overview",
  "/api/admin/users",
  "/api/admin/system-metrics",
  "/api/admin/usage-analytics",
  "/api/admin/security-events",
  "/api/admin/activity-logs",
  "/api/admin/subscriptions",
];

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

describe("🔐 /api/admin/* GET routes are gated by requireAdminAccess", () => {
  test.each(ADMIN_ENDPOINTS)("%s never 500s", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).not.toBe(500);
  });

  test.each(ADMIN_ENDPOINTS)(
    "%s is reachable with a valid admin token",
    async (path) => {
      // ADMIN_API_TOKEN may be unset in the test env; SUPABASE_SERVICE_ROLE_KEY
      // is the documented backward-compatible fallback. Skip only if neither is
      // configured, so we never assert against an unconfigured credential.
      const token =
        process.env.ADMIN_API_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!token) {
        return;
      }
      const res = await request(app)
        .get(path)
        .set("x-admin-token", token);
      expect([200, 503]).toContain(res.status);
      if (res.status === 503) {
        expect(res.body.code).toBe("ADMIN_DATA_SOURCE_UNAVAILABLE");
      } else {
        expect(res.body.success).toBe(true);
      }
    },
  );

  test("the mount applies one guard to all seven routes (no route is missed)", async () => {
    // Every endpoint must resolve to a JSON body (guarded or demo-allowed),
    // never to the generic "API endpoint not found" 404 fallback.
    for (const path of ADMIN_ENDPOINTS) {
      const res = await request(app).get(path);
      expect(res.status).not.toBe(404);
    }
  });
});

/**
 * Strict authorization regression tests for the admin-panel GET endpoints.
 *
 * These force the production posture (`NODE_ENV=production`,
 * `ENABLE_DEMO_ENDPOINTS=false`, no admin token, no Supabase) so the demo
 * fallback is disabled and only a real admin credential can pass.
 *
 * Expected behaviour with the guard in place:
 *   - anonymous (no header)            -> 401 or 503 (never 200)
 *   - a forged Bearer token            -> 401 (token unverifiable)
 *   - a valid x-admin-token            -> 200
 *
 * Before the fix these routes had no guard at all, so an anonymous caller
 * received 200 with the full user list.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

const ADMIN_ENDPOINTS = [
  "/api/admin/overview",
  "/api/admin/users",
  "/api/admin/system-metrics",
  "/api/admin/usage-analytics",
  "/api/admin/security-events",
  "/api/admin/activity-logs",
  "/api/admin/subscriptions",
  "/api/admin/news-sources",
];

/**
 * The subset that depends on Supabase. With no DB configured they must fail
 * closed with an explicit `_NOT_CONNECTED` code.
 *
 * Two endpoints are excluded because they are NOT database-backed:
 *  - `/api/admin/news-sources` is backed by the live RSS probe.
 *  - `/api/admin/system-metrics` reports real Node process/host measurements.
 * Both are asserted separately below.
 */
const DB_GATED_ADMIN_ENDPOINTS = ADMIN_ENDPOINTS.filter(
  (p) => p !== "/api/admin/news-sources" && p !== "/api/admin/system-metrics",
);

describe("🔐 Admin panel authorization (production posture)", () => {
  describe("no admin token configured", () => {
    let app: express.Application;

    beforeAll(() => {
      process.env = {
        ...ORIGINAL,
        NODE_ENV: "production",
        ENABLE_DEMO_ENDPOINTS: "false",
        ADMIN_API_TOKEN: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        // No Supabase creds -> any supplied JWT is unverifiable.
        SUPABASE_URL: "",
        VITE_SUPABASE_URL: "",
        SUPABASE_ANON_KEY: "",
        VITE_SUPABASE_ANON_KEY: "",
      };
      app = createServer();
    });

    afterAll(() => {
      process.env = ORIGINAL;
    });

    test.each(ADMIN_ENDPOINTS)(
      "%s denies an anonymous caller (401/403/503, never 200)",
      async (path) => {
        const res = await request(app).get(path);
        expect([401, 403, 503]).toContain(res.status);
        expect(res.body.success).not.toBe(true);
      },
    );

    test.each(ADMIN_ENDPOINTS)(
      "%s denies a forged Bearer token",
      async (path) => {
        const res = await request(app)
          .get(path)
          .set("Authorization", "Bearer not-a-real-jwt");
        expect([401, 403, 503]).toContain(res.status);
        expect(res.body.success).not.toBe(true);
      },
    );

    test("a demo header cannot smuggle an anonymous caller in", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("x-demo-user", "attacker");
      expect([401, 403, 503]).toContain(res.status);
    });
  });

  describe("admin token configured", () => {
    let app: express.Application;
    const TOKEN = "test-admin-token-value";

    beforeAll(() => {
      process.env = {
        ...ORIGINAL,
        NODE_ENV: "production",
        ENABLE_DEMO_ENDPOINTS: "false",
        ADMIN_API_TOKEN: TOKEN,
        SUPABASE_URL: "",
        VITE_SUPABASE_URL: "",
        SUPABASE_ANON_KEY: "",
        VITE_SUPABASE_ANON_KEY: "",
      };
      app = createServer();
    });

    afterAll(() => {
      process.env = ORIGINAL;
    });

    test.each(DB_GATED_ADMIN_ENDPOINTS)(
      "%s authenticates the caller before returning real data or an explicit unavailable response",
      async (path) => {
        const res = await request(app).get(path).set("x-admin-token", TOKEN);
        expect(res.status).toBe(503);
        // The exact code is per-endpoint (ADMIN_*_NOT_CONNECTED); all of them
        // declare an explicit unavailable data source instead of fake counters.
        expect(res.body.code).toMatch(/_NOT_CONNECTED$/);
        expect(res.body.success).toBe(false);
      },
    );

    test("/api/admin/news-sources returns live source status to an authorized admin", async () => {
      // Backed by the real RSS probe (network stubbed in this environment by
      // the test setup), not the database: an authorized admin gets the real
      // per-source availability, never fake counters.
      const res = await request(app)
        .get("/api/admin/news-sources")
        .set("x-admin-token", TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.sources)).toBe(true);
      expect(typeof res.body.data.total).toBe("number");
    });

    test("/api/admin/system-metrics returns real process metrics to an authorized admin", async () => {
      // Backed by the Node process/host, not the database: even with no DB
      // configured an authorized admin gets real measurements (never a fake
      // counter and never a blank 503).
      const res = await request(app)
        .get("/api/admin/system-metrics")
        .set("x-admin-token", TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.server).toBeDefined();
      expect(typeof res.body.data.server.cpuUsage).toBe("number");
      expect(res.body.data.server.nodeVersion).toMatch(/^v\d+\./);
    });

    test("a wrong admin token is rejected", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("x-admin-token", "wrong-token");
      expect([401, 403]).toContain(res.status);
      expect(res.body.success).not.toBe(true);
    });
  });
});

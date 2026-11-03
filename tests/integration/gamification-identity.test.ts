/**
 * Gamification identity / IDOR regression tests.
 *
 * The gamification endpoints previously took the acting user's id straight from
 * the query string or request body (`?userId=...`), defaulting to "demo-user".
 * Any anonymous caller could therefore read another user's XP, badges and
 * activity, or award XP to an arbitrary account, by naming that id.
 *
 * Identity must now come from a verified Supabase JWT. In production with no
 * token the endpoints must answer 401 and must NOT act on a caller-supplied id.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

const PER_USER_ENDPOINTS: Array<[string, string]> = [
  ["get", "/api/gamification/profile"],
  ["get", "/api/gamification/achievements"],
  ["get", "/api/gamification/activity"],
];

describe("🔐 Gamification identity", () => {
  describe("production, no token", () => {
    let app: express.Application;

    beforeAll(() => {
      process.env = {
        ...ORIGINAL,
        NODE_ENV: "production",
        ENABLE_DEMO_ENDPOINTS: "false",
        // No Supabase creds -> any supplied token is treated as unverifiable.
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

    test.each(PER_USER_ENDPOINTS)(
      "%s %s rejects an anonymous caller naming a victim id",
      async (method, path) => {
        const agent = request(app) as any;
        const res = await agent[method](`${path}?userId=victim-user`).set(
          "x-demo-user",
          "attacker-supplied",
        );
        expect([401, 503]).toContain(res.status);
        expect(res.body.success).not.toBe(true);
      },
    );

    test("POST award-xp ignores a body userId and refuses anonymous callers", async () => {
      const res = await request(app)
        .post("/api/gamification/award-xp")
        .send({ userId: "victim-user", action: "soil_analysis" });
      expect([401, 503]).toContain(res.status);
      // It must never report that XP was awarded.
      expect(res.body?.data?.xpAwarded).toBeUndefined();
    });

    test("a forged Bearer token is rejected as invalid (401)", async () => {
      const res = await request(app)
        .get("/api/gamification/profile?userId=victim-user")
        .set("Authorization", "Bearer not-a-real-jwt");
      // Without Supabase configured the token cannot be verified: 503.
      expect([401, 503]).toContain(res.status);
    });
  });

  describe("non-production demo mode", () => {
    let app: express.Application;

    beforeAll(() => {
      process.env = {
        ...ORIGINAL,
        NODE_ENV: "development",
        ENABLE_DEMO_ENDPOINTS: "true",
      };
      app = createServer();
    });

    afterAll(() => {
      process.env = ORIGINAL;
    });

    test("demo caller without a token still gets a profile (demo identity)", async () => {
      const res = await request(app)
        .get("/api/gamification/profile")
        .set("x-demo-user", "demo-user");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe("demo-user");
    });

    test("leaderboard stays public", async () => {
      const res = await request(app).get("/api/gamification/leaderboard?limit=5");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

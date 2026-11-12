/**
 * Authorization contract for the idempotent profile self-provisioning endpoint.
 *
 * `/api/auth/ensure-profile` exists so a user whose `public.users` row was never
 * created (e.g. the trusted `auth.users` trigger is absent on a given database)
 * can recover without being locked out. It must never be usable to mint or
 * elevate a profile without a verified session, and it must never accept a
 * client-supplied role or user id.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

describe("POST /api/auth/ensure-profile — authorization", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env = {
      ...ORIGINAL,
      NODE_ENV: "production",
      ENABLE_DEMO_ENDPOINTS: "false",
      ADMIN_API_TOKEN: "",
      SUPABASE_URL: "",
      VITE_SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      VITE_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    };
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("denies an anonymous caller", async () => {
    const res = await request(app).post("/api/auth/ensure-profile");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("denies a forged Bearer token", async () => {
    const res = await request(app)
      .post("/api/auth/ensure-profile")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("a demo header cannot smuggle an anonymous caller in (production posture)", async () => {
    const res = await request(app)
      .post("/api/auth/ensure-profile")
      .set("x-demo-user", "attacker");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("ignores a client-supplied role in the body (never trusts it)", async () => {
    const res = await request(app)
      .post("/api/auth/ensure-profile")
      .send({ role: "admin", userId: "00000000-0000-0000-0000-000000000000" });
    // Unauthenticated: the body is irrelevant, the request is still rejected.
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });
});

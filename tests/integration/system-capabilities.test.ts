/**
 * Public capability probes used by the SPA service-status panel.
 *
 * These replaced the admin-gated `/api/test/*` routes the client used to probe,
 * which reported the database as unavailable whenever the admin token was
 * correctly configured. They must stay public and must never echo a credential.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🔎 public capability endpoints", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test.each(["/api/system/database", "/api/system/auth", "/api/system/ai", "/api/system/"])(
    "GET %s answers 200 without an admin token",
    async (url) => {
      const res = await request(app).get(url).expect(200);
      expect(typeof res.body.available === "boolean" || res.body.database).toBeTruthy();
    },
  );

  test("the database probe names the missing variables but no values", async () => {
    const res = await request(app).get("/api/system/database").expect(200);
    expect(Array.isArray(res.body.requiresConfiguration)).toBe(true);
    const serialised = JSON.stringify(res.body);
    // Never leak a credential value.
    expect(serialised).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // JWT
    expect(serialised).not.toMatch(/sk-[A-Za-z0-9]{10,}/); // OpenAI-style key
  });
});

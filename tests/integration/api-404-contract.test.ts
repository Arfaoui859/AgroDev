/**
 * Unknown `/api/*` routes must answer a JSON 404.
 *
 * In dev the Vite middleware chain used to fall through to the SPA and answer
 * `200 text/html` for any unmatched API path, so a frontend calling a route
 * that no longer exists looked like a success and the breakage went unnoticed.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🧭 API 404 contract", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("an unknown API route returns JSON 404, not SPA HTML", async () => {
    const res = await request(app).get("/api/definitely-not-a-route").expect(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body.error).toMatch(/not found/i);
    expect(res.body.path).toBe("/api/definitely-not-a-route");
  });

  test("the 404 applies to every method", async () => {
    for (const method of ["get", "post", "put", "patch", "delete"] as const) {
      const res = await (request(app) as any)[method]("/api/no-such-thing");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    }
  });

  test("a real route still responds normally", async () => {
    const res = await request(app).get("/api/ping").expect(200);
    // The ping route echoes PING_MESSAGE, defaulting to "ping".
    expect(res.body.message).toBe(process.env.PING_MESSAGE ?? "ping");
  });
});

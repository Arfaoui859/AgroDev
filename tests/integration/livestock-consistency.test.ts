/**
 * Livestock data integrity: no synthetic herd is allowed in the application.
 *
 * The livestock routes are now backed by tenant-scoped persistence
 * (database/livestock-persistence.sql) and every read/write is scoped to the
 * caller's verified session under RLS. Two guarantees must hold regardless of
 * configuration:
 *   1. an unauthenticated caller is never served data (no demo fallback);
 *   2. no endpoint ever returns fabricated animals or derived metrics.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("Livestock endpoints require a verified session and never serve demo data", () => {
  test.each([
    "/api/livestock-management/animals",
    "/api/livestock-management/animals/11111111-1111-1111-1111-111111111111",
    "/api/livestock-management/health-alerts",
    "/api/livestock-management/health-events",
    "/api/livestock-management/reproduction-events",
    "/api/livestock-management/herds",
    "/api/livestock-management/feed-inventory",
  ])("%s denies an anonymous caller (no demo dataset)", async (path) => {
    const response = await request(app).get(path);
    expect([401, 403, 503]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
    expect(Array.isArray(response.body.data) ? response.body.data.length : 0).toBe(0);
  });

  test("feed optimization reports an honest not-computed state, not invented rations", async () => {
    const response = await request(app).post("/api/livestock-management/feed-optimization").send({});
    expect([401, 403, 200]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.computed).toBe(false);
      expect(response.body.isRealData).toBe(false);
      expect(response.body.data).toEqual([]);
    }
  });
});

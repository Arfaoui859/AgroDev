/**
 * Livestock data integrity: no synthetic herd is allowed in the application.
 * Until persistent, user-scoped records are connected, every livestock route
 * must fail closed and must not return fabricated animals or derived metrics.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("Livestock endpoints require persisted real records", () => {
  test.each([
    "/api/livestock-management/animals",
    "/api/livestock-management/animals/animal_1",
    "/api/livestock-management/health-alerts",
    "/api/livestock-management/breeding-schedule",
    "/api/livestock-management/feed-inventory",
    "/api/livestock-management/production-analytics",
  ])("%s returns unavailable instead of a demo dataset", async (path) => {
    const response = await request(app).get(path).expect(503);
    expect(response.headers["x-data-provenance"]).toBe("unavailable");
    expect(response.headers["x-is-real-data"]).toBe("false");
    expect(response.body.success).toBe(false);
    expect(response.body.dataAvailable).toBe(false);
    expect(response.body.isRealData).toBe(false);
    expect(response.body.code).toBe("LIVESTOCK_DATA_STORE_NOT_CONNECTED");
    expect(response.body.data).toEqual([]);
  });
});

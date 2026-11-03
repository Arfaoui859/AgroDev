/**
 * Market endpoint regression tests.
 *
 * `/api/market/all` and `/api/market/trends` returned 500 on every call: the
 * Supabase query embedded `crop:crops(name, name_ar)` but the deployed schema
 * has no foreign key from market_prices to crops, so PostgREST rejected the
 * relationship (PGRST200). Crop names are now resolved with a separate lookup,
 * and an empty price table yields an honest empty summary instead of
 * Math.max() over [] producing -Infinity.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("📈 Market endpoints", () => {
  test("GET /api/market/all never 500s on a broken/empty schema", async () => {
    const res = await request(app).get("/api/market/all");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    const summary = res.body.data.summary;
    // Empty DB: nulls, never ±Infinity.
    for (const key of ["highestPrice", "lowestPrice", "averagePrice"]) {
      expect(summary[key] === null || Number.isFinite(summary[key])).toBe(true);
    }
    expect(res.body.data.isRealData).toBe(true);
    expect(res.body.data.dataSource).toBe("database");
  });

  test("GET /api/market/trends never 500s and reports its sample size", async () => {
    const res = await request(app).get("/api/market/trends").query({ period: "30" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(typeof res.body.data.sampleSize).toBe("number");
    expect(res.body.data.trends).toBeDefined();
  });
});

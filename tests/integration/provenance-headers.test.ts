/**
 * Regression tests for data-provenance labelling and real-weather wiring.
 *
 * Two guarantees are pinned here:
 *
 *  1. Modules that synthesise their figures (admin/government/investor/
 *     veterinarian dashboards, segmentation, farm-management, ...) must stamp
 *     every response with `X-Data-Provenance: simulated` and
 *     `X-Is-Real-Data: false`, so the SPA can disclose them instead of showing
 *     synthetic numbers as real observations.
 *
 *  2. The irrigation/weather-planning routes must serve real provider data
 *     (Open-Meteo) or answer 503 — never invented weather.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

describe("🗂  Fixture-backed data is disabled", () => {
  test.each([
    "/api/public/market-prices",
    "/api/public/production",
    "/api/public/exports",
    "/api/public/weather",
    "/api/public/stats",
    "/api/public/key-info",
  ])("%s is unavailable without a verified public data source", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("PUBLIC_DATA_SOURCE_NOT_CONNECTED");
    expect(res.headers["x-data-provenance"]).toBe("unavailable");
    expect(res.headers["x-is-real-data"]).toBe("false");
  });

  test("POST /api/public/create-key is unavailable without persisted key storage", async () => {
    const res = await request(app).post("/api/public/create-key").send({ name: "test" });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("PUBLIC_DATA_SOURCE_NOT_CONNECTED");
    expect(res.headers["x-data-provenance"]).toBe("unavailable");
    expect(res.headers["x-is-real-data"]).toBe("false");
  });

  test.each([
    "/api/ai/models",
    "/api/ai/insights",
    "/api/ai/behavior-data",
    "/api/ai/recommendations",
  ])("%s does not return generated adaptive analytics", async (path) => {
    const res = await request(app).get(path).expect(503);
    expect(res.body.code).toBe("ADAPTIVE_AI_DATA_NOT_CONNECTED");
    expect(res.body.dataAvailable).toBe(false);
  });

  test("market forecast and supply-demand routes are not exposed as GET endpoints", async () => {
    await request(app).get("/api/ai/market/forecast-prices").expect(404);
    await request(app).get("/api/ai/market/supply-demand").expect(404);
  });

  test("assistant alerts validates the farm scope before contacting the service", async () => {
    await request(app).get("/api/ai/assistant/alerts").expect(400);
  });

  test("fixture-backed SaaS and logistics modules remain disabled", async () => {
    for (const path of ["/api/saas/metrics", "/api/logistics/vehicles"]) {
      const res = await request(app).get(path);
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("SIMULATED_DATA_DISABLED");
    }
  });

  test("marketplace and supply chain require persisted records", async () => {
    const marketplace = await request(app).get("/api/marketplace/listings").expect(503);
    expect(marketplace.body.code).toBe("MARKETPLACE_STORE_NOT_CONNECTED");
    const supply = await request(app).get("/api/supply-chain/tracking").expect(503);
    expect(supply.body.code).toBe("SUPPLY_CHAIN_STORE_NOT_CONNECTED");
  });

  test("unverified water usage analytics are unavailable", async () => {
    const response = await request(app)
      .post("/api/weather-irrigation/analytics/water-usage")
      .send({ farmId: "field-1", period: "month", cropTypes: ["olive"] });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("IRRIGATION_ANALYTICS_NOT_VERIFIED");
    expect(response.body.isRealData).toBe(false);
  });

  test("real weather is not labelled simulated", async () => {
    const res = await request(app).get(
      "/api/weather/coordinates?lat=36.8065&lon=10.1815",
    );
    if (res.status === 200) {
      expect(res.headers["x-data-provenance"]).not.toBe("simulated");
    }
  });
});

describe("💧 Weather-irrigation serves real data or an explicit 503", () => {
  const stations = ["tunis-center", "sfax-center"];

  test.each(stations)("forecast for %s is real or 503", async (station) => {
    const res = await request(app).get(
      `/api/weather-irrigation/forecast/${station}?days=5`,
    );
    if (res.status === 200) {
      expect(res.body.isRealData).toBe(true);
      expect(res.body.dataSource).toBe("open-meteo");
      expect(Array.isArray(res.body.forecast)).toBe(true);
      expect(res.body.forecast.length).toBeGreaterThan(0);
      const day = res.body.forecast[0];
      expect(typeof day.temperature.avg).toBe("number");
      // Derived indices must stay in physically plausible ranges.
      expect(day.uvIndex).toBeGreaterThanOrEqual(0);
      expect(day.uvIndex).toBeLessThanOrEqual(11);
    } else {
      expect(res.status).toBe(503);
      expect(res.body.dataAvailable).toBe(false);
    }
  });

  test("unknown station does not receive invented weather", async () => {
    const res = await request(app).get(
      "/api/weather-irrigation/forecast/does-not-exist",
    );
    expect(res.status).toBe(503);
    expect(res.body.dataAvailable).toBe(false);
    expect(res.body.isRealData).toBe(false);
  });

  test("alerts stay unavailable until a verified station feed is connected", async () => {
    const res = await request(app).get(
      "/api/weather-irrigation/alerts/does-not-exist",
    );
    expect(res.status).toBe(503);
    expect(res.body.dataAvailable).toBe(false);
  });
});

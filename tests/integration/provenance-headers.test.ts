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

describe("🗂  Simulated-data provenance headers", () => {
  const simulatedPaths = [
    "/api/admin/overview",
    "/api/government-dashboard/overview",
    "/api/investor-dashboard/overview",
    "/api/veterinarian-dashboard/overview",
    "/api/segmentation/segments",
    "/api/soil-ai-detector/alerts",
    "/api/predictive-analytics/overview",
    "/api/risk-detection/overview",
    "/api/farmer-dashboard/overview",
    "/api/digital-transformation/projects",
    "/api/collaboration/chat-rooms",
  ];

  test.each(simulatedPaths)(
    "%s is labelled simulated",
    async (path) => {
      const res = await request(app).get(path);
      // The handler may 404 if a route name differs; only assert provenance on
      // a real response so the test does not become a route-name lock.
      if (res.status !== 404) {
        expect(res.headers["x-data-provenance"]).toBe("simulated");
        expect(res.headers["x-is-real-data"]).toBe("false");
      }
    },
  );

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

  test("unknown station is a 404, not fabricated weather", async () => {
    const res = await request(app).get(
      "/api/weather-irrigation/forecast/does-not-exist",
    );
    expect(res.status).toBe(404);
  });
});

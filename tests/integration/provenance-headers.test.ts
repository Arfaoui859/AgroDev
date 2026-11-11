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
    // SaaS / logistics / supply-chain modules serve fixed in-memory fixtures
    // (mock vehicles, orders, plans, tracking records). They must be labelled
    // too, otherwise the SPA shows demo numbers as live operational records.
    "/api/saas/metrics",
    "/api/saas/analytics",
    "/api/saas/subscriptions",
    "/api/saas/plans",
    "/api/subscription/plans",
    "/api/subscription/payment-methods",
    "/api/subscription/promo-codes",
    "/api/supply-chain/tracking",
    "/api/supply-chain/metrics",
    "/api/supply-chain/nodes",
    "/api/logistics/vehicles",
    "/api/logistics/orders",
    "/api/logistics/metrics",
    "/api/marketplace/listings",
    "/api/marketplace/inquiries",
    "/api/marketplace/analytics",
    // Fixture-backed routers with no database or licensed feed behind them:
    // emergency response, IP management, emerging technology and the trader
    // dashboard all build their records from fixed in-memory arrays.
    "/api/emergency-response/scenarios",
    "/api/emergency-response/plans",
    "/api/emergency-response/contacts",
    "/api/ip-management/patents",
    "/api/ip-management/trademarks",
    "/api/ip-management/licenses",
    "/api/emerging-tech/technologies",
    "/api/emerging-tech/investments",
    "/api/emerging-tech/market-trends",
    "/api/trader-dashboard/overview",
    "/api/trader-dashboard/inventory",
    "/api/trader-dashboard/orders",
    "/api/livestock-management/animals",
    "/api/livestock-management/feed-inventory",
    "/api/public/market-prices",
    "/api/public/production",
    "/api/public/exports",
    "/api/public/weather",
    // Advanced livestock APIs read static in-memory records and must disclose it.
    "/api/animals",
    "/api/animal-health/animal-001",
    "/api/breeding-recommendations",
    "/api/feed-recommendations/animal-001",
    "/api/optimize-feed-budget",
    "/api/health-alerts",
    "/api/livestock-dashboard",
    // Investor and agronomist dashboards are generated from seeded demo
    // generators: fabricated returns, portfolios and supervised farms.
    "/api/investor/dashboard",
    "/api/investor/opportunities",
    "/api/investor/profitability",
    "/api/investor/insights",
    "/api/investor/portfolio",
    "/api/agronomist-dashboard/overview",
    "/api/agronomist-dashboard/farms",
    "/api/agronomist-dashboard/disease-analyses",
    "/api/agronomist-dashboard/recommendations",
    "/api/agronomist-dashboard/training-programs",
    // The alert/task feed serves a seeded fixture for `user-123`; there is no
    // per-farmer alert store behind it.
    "/api/alerts/user/user-123",
    "/api/alerts/user/user-123/stats",
    "/api/tasks/user/user-123/today",
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

  test("advanced livestock feed optimization is explicitly simulated", async () => {
    const res = await request(app)
      .post("/api/optimize-feed-budget")
      .send({ budget: 1000 });
    expect(res.status).toBe(200);
    expect(res.headers["x-data-provenance"]).toBe("simulated");
    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.body.dataSource).toBe("static-demo-records");
  });

  test("the fixture-backed modules actually return payloads", async () => {
    // Guards against the provenance assertion above silently passing on a 404:
    // these paths are consumed by five SPA screens, so they must resolve.
    for (const path of [
      "/api/saas/metrics",
      "/api/logistics/vehicles",
      "/api/supply-chain/tracking",
      "/api/marketplace/listings",
      "/api/animals",
      "/api/breeding-recommendations",
      "/api/livestock-dashboard",
    ]) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
    }
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

  test("unknown station is a 404, not fabricated weather", async () => {
    const res = await request(app).get(
      "/api/weather-irrigation/forecast/does-not-exist",
    );
    expect(res.status).toBe(404);
  });

  test("alerts for an unknown station is a 404, not a crash", async () => {
    // Regression: /alerts/:stationId passed a null forecast into the alerts
    // generator, which threw on forecast.forEach and killed the process.
    const res = await request(app).get(
      "/api/weather-irrigation/alerts/does-not-exist",
    );
    expect(res.status).toBe(404);
  });
});

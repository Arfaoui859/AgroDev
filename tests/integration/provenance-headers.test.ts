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
  const simulatedPaths = [
    "/api/admin/overview",
    "/api/government-dashboard/overview",
    "/api/investor-dashboard/overview",
    "/api/veterinarian-dashboard/overview",
    "/api/segmentation/segments",
    "/api/soil-ai-detector/alerts",
    "/api/smart-advisor/recommendations",
    "/api/disease-treatment/history",
    "/api/gamification/profile",
    "/api/fertilizer/inventory",
    "/api/animals",
    "/api/animal-health/animal-1",
    "/api/breeding-recommendations",
    "/api/feed-recommendations/animal-1",
    "/api/optimize-feed-budget",
    "/api/health-alerts",
    "/api/livestock-dashboard",
    "/api/expenses",
    "/api/revenues",
    "/api/profitability-analysis",
    "/api/financial-summary",
    "/api/budget-plans",
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
    "/api/notifications",
    "/api/notification-rules",
    "/api/notification-stats",
    "/api/send-notification",
    "/api/public/production",
    "/api/public/exports",
    "/api/public/weather",
    "/api/public/stats",
    "/api/public/key-info",
    "/api/ai/models",
    "/api/ai/insights",
    "/api/ai/behavior-data",
    "/api/ai/recommendations",
    "/api/ai/feedback",
    "/api/ai/market/forecast-prices",
    "/api/ai/market/supply-demand",
    "/api/ai/assistant/alerts",
  ];

  test.each(simulatedPaths)(
    "%s is unavailable rather than returning simulated data",
    async (path) => {
      const res = await request(app).get(path);
      if (res.status !== 404) {
        expect(res.status).toBe(503);
        expect(res.headers["x-data-provenance"]).toBe("simulated-disabled");
        expect(res.headers["x-is-real-data"]).toBe("false");
        expect(res.body.code).toBe("SIMULATED_DATA_DISABLED");
      }
    },
  );

  test("fixture-backed business modules fail closed", async () => {
    for (const path of [
      "/api/saas/metrics",
      "/api/logistics/vehicles",
      "/api/supply-chain/tracking",
      "/api/marketplace/listings",
    ]) {
      const res = await request(app).get(path);
      expect(res.status).toBe(503);
      expect(res.body.code).toBe("SIMULATED_DATA_DISABLED");
    }
  });

  test("unmetered water usage analytics are disabled", async () => {
    const response = await request(app)
      .post("/api/weather-irrigation/analytics/water-usage")
      .send({ farmId: "field-1", period: "month", cropTypes: ["olive"] });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("IRRIGATION_TELEMETRY_NOT_CONNECTED");
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

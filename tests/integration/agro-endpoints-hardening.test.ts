/**
 * Regression tests for the fertilizer and irrigation modules.
 *
 * Both routers are fail-closed at the baseline: the bundled fertilizer /
 * pesticide catalogue carries invented doses, application rates, pre-harvest
 * intervals and supplier names, and the irrigation scheduler fabricates weather
 * and soil-moisture values. Presenting any of that as agronomic advice is
 * forbidden, so both routers answer an explicit 503 until a verified local
 * product registry and field telemetry are connected.
 *
 * The water-usage analytics, trader-order and notification blocks pin the
 * related fail-closed / authorization contracts.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("🧴 Fertilizer module fails closed (no verified product registry)", () => {
  const cases: Array<[string, "get" | "post"]> = [
    ["/api/fertilizer/track/effectiveness", "post"],
    ["/api/fertilizer/inventory", "get"],
    ["/api/fertilizer/recommendations/fertilizer", "post"],
    ["/api/fertilizer/recommendations/pesticide", "post"],
    ["/api/fertilizer/schedule/comprehensive", "post"],
  ];

  test.each(cases)(
    "%s answers an explicit 503, never fabricated dosages",
    async (url, method) => {
      const res = await (request(app) as any)[method](url).send({});
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("FERTILIZER_REFERENCE_NOT_VERIFIED");
      expect(res.body.data).toBeNull();
    },
  );
});

describe("💧 Smart irrigation fails closed (no verified field telemetry)", () => {
  const cases: Array<[string, "get" | "post"]> = [
    ["/api/smart-irrigation/schedule", "post"],
    ["/api/smart-irrigation/soil-moisture/field-tomato-01", "get"],
    ["/api/smart-irrigation/weather/Tunis", "get"],
    ["/api/smart-irrigation/schedules/user-123", "get"],
    ["/api/smart-irrigation/recommend", "post"],
    ["/api/smart-irrigation/start", "post"],
  ];

  test.each(cases)(
    "%s answers an explicit 503, never fabricated telemetry",
    async (url, method) => {
      const res = await (request(app) as any)[method](url).send({});
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("SMART_IRRIGATION_NOT_VALIDATED");
      expect(res.body.data).toBeNull();
    },
  );
});

describe("💧 Irrigation water-usage analytics fail closed (no metered telemetry)", () => {
  const URL = "/api/weather-irrigation/analytics/water-usage";

  test("an empty body is an explicit 503, never a fabricated 200 or a 500", async () => {
    const res = await request(app).post(URL).send({});
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("IRRIGATION_ANALYTICS_NOT_VERIFIED");
    expect(res.body.isRealData).toBe(false);
  });

  test("a full payload is still refused: the platform has no water metering", async () => {
    const res = await request(app)
      .post(URL)
      .send({ farmId: "farm-001", period: "month", cropTypes: ["olive", "tomato"] });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("IRRIGATION_ANALYTICS_NOT_VERIFIED");
    expect(res.body.data).toBeNull();
  });
});

describe("🌦️ Irrigation schedule station validation", () => {
  const URL = "/api/weather-irrigation/irrigation/schedule";

  test("a missing stationId is an explicit 503, never a misleading 404 or a 500", async () => {
    const res = await request(app).post(URL).send({ cropType: "olive" });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("IRRIGATION_ANALYTICS_NOT_VERIFIED");
  });
});

describe("📦 Trader order creation requires an authorized trader session", () => {
  const URL = "/api/trader-dashboard/orders";

  // Since the Nov-10 hardening the trader dashboard is mounted behind
  // requireRole(["trader"]). An anonymous caller is rejected (401/403) before
  // order validation runs, so it can never receive a fabricated order total.
  test("an anonymous order is rejected before validation or persistence", async () => {
    const res = await request(app).post(URL).send({});
    expect([401, 403]).toContain(res.status);
    expect(res.body.data).toBeUndefined();
  });

  test("an anonymous order with products is still rejected (no fabricated total)", async () => {
    const res = await request(app)
      .post(URL)
      .send({ type: "sale", clientName: "Ali", products: [{ name: "seed", totalPrice: 30 }] });
    expect([401, 403]).toContain(res.status);
    expect(res.body.data).toBeUndefined();
  });
});

describe("🔔 Notification feed requires persisted, user-scoped records", () => {
  test("does not expose a fabricated feed without an authenticated database session", async () => {
    const res = await request(app).get("/api/notifications");
    // The feed is guarded by requireAuth + requireVerifiedAuth: an anonymous or
    // demo caller is rejected (401/403) before any query runs. It never returns
    // a fabricated feed, and never a 200 with invented notifications.
    expect([401, 403]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
    expect(Array.isArray(res.body.data)).not.toBe(true);
  });
});

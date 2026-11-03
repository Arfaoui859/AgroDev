/**
 * AI service health coverage.
 *
 * `/api/ai/health` used to probe only the five original microservices, so the
 * pest-control, irrigation-optimization and weather/yield services could be down
 * without the monitoring view noticing. This pins the monitored set to every
 * service the gateway can address.
 *
 * The request contract for the assistant alerts endpoint is pinned too: it
 * previously proxied to a `/smart-alerts` path the assistant service does not
 * serve, which surfaced as a permanent 404 in the UI.
 */
import express from "express";
import request from "supertest";
import { createServer } from "../../server/index";

jest.mock("axios", () => {
  const callable: any = jest.fn(async () => ({ data: { ok: true }, status: 200 }));
  callable.__esModule = true;
  callable.default = callable;
  callable.post = callable;
  return callable;
});

describe("🩺 AI service health coverage", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  test("every gateway service is monitored", async () => {
    const res = await request(app).get("/api/ai/health").expect(200);
    const keys = res.body.services.map((s: { key: string }) => s.key);
    for (const key of [
      "soil_analysis",
      "crop_recommendation",
      "image_diagnosis",
      "market_forecast",
      "smart_assistant",
      "weather_yield",
      "pest_control",
      "irrigation_optimization",
    ]) {
      expect(keys).toContain(key);
    }
    expect(res.body.overview.totalServices).toBe(res.body.services.length);
  });

  test("alerts require a farmer id instead of requesting a missing path", async () => {
    const res = await request(app).get("/api/ai/assistant/alerts").expect(400);
    expect(res.body.error).toBe("farmer_id is required");
  });

  test("alerts with a farmer id reach the per-farmer endpoint", async () => {
    const res = await request(app)
      .get("/api/ai/assistant/alerts?farmer_id=farmer-9")
      .expect(200);
    expect(res.body).toHaveProperty("dataSource");
  });
});

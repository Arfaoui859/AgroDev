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

const mockSentUrls: string[] = [];

jest.mock("axios", () => {
  const callable: any = jest.fn(async (config: any) => {
    mockSentUrls.push(config?.url ?? config);
    return { data: { ok: true }, status: 200 };
  });
  callable.__esModule = true;
  callable.default = callable;
  callable.post = callable;
  callable.get = jest.fn(async (config: any) => {
    mockSentUrls.push(config?.url ?? config);
    return {
      data: { status: "healthy", model_source: "gemini", is_real_model: true },
      status: 200,
    };
  });
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
    process.env.SMART_ASSISTANT_URL = "http://127.0.0.1:8005";
    mockSentUrls.length = 0;
    const res = await request(app).get("/api/ai/assistant/alerts?farmer_id=farmer-9");
    // The regression this guards: the request must go to the per-farmer path,
    // not a non-existent /smart-alerts route. Whether the response carries real
    // data depends on the service's provenance; an honest 503 is acceptable and
    // must never be a fabricated 200.
    expect(mockSentUrls.some((u) => String(u).includes("/alerts/farmer-9"))).toBe(true);
    expect(mockSentUrls.every((u) => !String(u).includes("/smart-alerts"))).toBe(true);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("dataSource");
    } else {
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    }
  });
});

/**
 * A host that answers the health probe with HTTP 429 is reachable but its
 * inference availability is unverified. The monitoring view must say so
 * honestly (status "rate_limited", reachable true, not "available") and must
 * surface any Retry-After hint instead of pretending the service is healthy.
 */
import express from "express";
import request from "supertest";
import { createServer } from "../../server/index";

const rateLimited: Record<string, number> = {};

jest.mock("axios", () => {
  const callable: any = jest.fn();
  callable.__esModule = true;
  callable.default = callable;
  callable.post = jest.fn(async () => ({ data: { ok: true }, status: 200 }));
  callable.get = jest.fn(async (config: any) => {
    const url = String(config?.url ?? config);
    if (rateLimited[url]) {
      const error: any = new Error("Request failed with status code 429");
      error.response = { status: 429, headers: { "retry-after": "120" } };
      throw error;
    }
    return { data: { status: "healthy", model_source: "synthetic-demo" }, status: 200 };
  });
  return callable;
});

describe("🩺 AI health check is rate-limit aware", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.SOIL_ANALYSIS_URL = "http://127.0.0.1:18001";
    process.env.CROP_RECOMMENDATION_URL = "http://127.0.0.1:18002";
    process.env.IMAGE_DIAGNOSIS_URL = "http://127.0.0.1:18003";
    process.env.MARKET_FORECAST_URL = "http://127.0.0.1:18004";
    process.env.SMART_ASSISTANT_URL = "http://127.0.0.1:18005";
    process.env.WEATHER_YIELD_INTELLIGENCE_URL = "http://127.0.0.1:18006";
    process.env.PEST_CONTROL_URL = "http://127.0.0.1:18007";
    process.env.IRRIGATION_OPTIMIZATION_URL = "http://127.0.0.1:18008";
    app = createServer();
  });

  test("a 429 host is reported rate_limited and reachable, never available", async () => {
    rateLimited["http://127.0.0.1:18001/health"] = 1;
    const res = await request(app).get("/api/ai/health?force=true").expect(200);
    const soil = res.body.services.find((s: any) => s.key === "soil_analysis");
    expect(soil.status).toBe("rate_limited");
    expect(soil.reachable).toBe(true);
    expect(soil.retryAfterMs).toBe(120000);
    // The rate-limited host must not be counted among available services.
    const availableKeys = res.body.services
      .filter((s: any) => s.status === "available")
      .map((s: any) => s.key);
    expect(availableKeys).not.toContain("soil_analysis");
    expect(res.body.overview.rateLimitedServices).toBeGreaterThanOrEqual(1);
  });
});

/**
 * Production capability reporting must never advertise a `http://localhost`
 * microservice URL, and must not report a microservice-backed capability as
 * "configured" or "available" when no URL was set.
 *
 * Regression: `ai-capabilities.ts` used to default every unset service URL to
 * `http://localhost:<port>`, so a hosted deployment reported
 * `microserviceConfigured: true` with a localhost URL for services it could
 * never reach — and, worse, treated a microservice-primary capability as
 * available because a URL string existed.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

const ORIGINAL = { ...process.env };

const SERVICE_ENV_KEYS = [
  "SOIL_ANALYSIS_URL",
  "CROP_RECOMMENDATION_URL",
  "IMAGE_DIAGNOSIS_URL",
  "MARKET_FORECAST_URL",
  "MARKET_PREDICTION_URL",
  "SMART_ASSISTANT_URL",
  "INTELLIGENT_AGENT_URL",
  "WEATHER_YIELD_INTELLIGENCE_URL",
  "SMART_MARKETPLACE_URL",
  "PEST_CONTROL_URL",
  "IRRIGATION_OPTIMIZATION_URL",
];

describe("🧭 AI capabilities never report localhost in production", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env = { ...ORIGINAL, NODE_ENV: "production" };
    delete process.env.RENDER;
    delete process.env.RENDER_SERVICE_ID;
    for (const key of SERVICE_ENV_KEYS) delete process.env[key];
    resetServiceProbeCache();
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
    resetServiceProbeCache();
  });

  test("no capability advertises a localhost microservice URL", async () => {
    const res = await request(app).get("/api/ai/capabilities").expect(200);
    for (const cap of res.body.capabilities) {
      expect(JSON.stringify(cap)).not.toMatch(/localhost/);
    }
  });

  test("microservice-backed capabilities degrade to unavailable when unset", async () => {
    const ids = [
      "pest-control",
      "irrigation-optimizer",
      "weather-yield-planner",
      "market-forecast",
    ];
    for (const id of ids) {
      const res = await request(app).get(`/api/ai/capabilities/${id}`).expect(200);
      expect(res.body.microserviceConfigured).toBe(false);
      expect(res.body.microserviceUrl).toBeNull();
      expect(res.body.available).toBe(false);
      expect(res.body.engine).toBe("unavailable");
    }
  });
});

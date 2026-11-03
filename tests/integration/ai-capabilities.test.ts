/**
 * AI capability + provenance tests.
 *
 * These exercise the real Express app. They assert two things:
 *  1. every AI capability the client health-checks now resolves (no more 404s
 *     that left every AI feature permanently disabled in the UI), and
 *  2. no endpoint ever presents rule-based output as model inference.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🧠 AI capability discovery", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  const probedCapabilities = [
    "crop-recommendation",
    "soil-analysis",
    "climate-crop-matcher",
    "plant-disease-detection",
    "leaf-scan",
    "pest-control",
    "weather-yield-planner",
    "yield-predictor",
    "irrigation-optimizer",
    "market-forecast",
    "supply-demand",
    "smart-match",
    "farming-tasks-planner",
    "agro-chat",
    "alert-notifier",
  ];

  test.each(probedCapabilities)(
    "GET /api/ai/%s is reachable and reports provenance",
    async (id) => {
      const response = await request(app).get(`/api/ai/${id}`).expect(200);
      expect(response.body).toHaveProperty("capability", id);
      expect(typeof response.body.available).toBe("boolean");
      expect(typeof response.body.dataSource).toBe("string");
      expect(typeof response.body.provenance).toBe("string");
      expect(response.body).toHaveProperty("isRealData");
    },
  );

  test("capability catalogue summarises model-powered vs rule-based", async () => {
    const response = await request(app).get("/api/ai/capabilities").expect(200);
    expect(Array.isArray(response.body.capabilities)).toBe(true);
    expect(response.body.capabilities.length).toBeGreaterThanOrEqual(15);
    expect(response.body.summary.total).toBe(response.body.capabilities.length);
    expect(response.body.summary).toHaveProperty("modelPowered");
    expect(response.body).toHaveProperty("llm");
  });

  test("unknown capability is a clean 404", async () => {
    await request(app).get("/api/ai/not-a-capability").expect(404);
  });

  test("POST /api/ai/soil-analysis returns rule-based analysis, flagged as such", async () => {
    const response = await request(app)
      .post("/api/ai/soil-analysis")
      .send({ ph: 6.5, nitrogen: 40, phosphorus: 25, potassium: 180, moisture: 35 })
      .expect(200);
    expect(response.body.dataSource).toBe("rule-based");
    expect(response.body.isRealData).toBe(false);
    expect(response.body).toHaveProperty("health_score");
    expect(response.body).toHaveProperty("properties");
  });

  test("POST /api/ai/crop-recommendation returns ranked crops with provenance", async () => {
    const response = await request(app)
      .post("/api/ai/crop-recommendation")
      .send({ ph: 7, temperature: 22, rainfall: 450, season: "winter" })
      .expect(200);
    expect(response.body.dataSource).toBe("rule-based");
    expect(response.body.isRealData).toBe(false);
    expect(Array.isArray(response.body.recommendations)).toBe(true);
    expect(response.body.recommendations.length).toBeGreaterThan(0);
  });

  test("vision capability is honestly unavailable when no service is configured", async () => {
    const response = await request(app)
      .get("/api/ai/plant-disease-detection")
      .expect(200);
    // No IMAGE_DIAGNOSIS_URL is configured in the test environment.
    if (response.body.engine === "vision-model") {
      expect(response.body.available).toBe(true);
    } else {
      expect(response.body.available).toBe(false);
      expect(response.body.isRealData).toBe(false);
      expect(response.body.requiresConfiguration).toBeTruthy();
    }
  });

  test("market forecast is not fabricated without a real feed", async () => {
    const response = await request(app).get("/api/ai/market-forecast").expect(200);
    expect(response.body.available).toBe(false);
    expect(response.body.isRealData).toBe(false);
  });
});

import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("Fixture-backed API groups fail closed", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  const expectUnavailable = async (response: any, code: string) => {
    expect(response.status).toBe(503);
    expect(response.body.code).toBe(code);
    expect(response.body.isRealData).toBe(false);
    expect(response.body.data).toBeNull();
  };

  test("soil AI detector fixture data is not exposed", async () => {
    await expectUnavailable(
      await request(app).get("/api/soil-ai-detector/history/field-42"),
      "LEGACY_SOIL_DETECTOR_DISABLED",
    );
    await expectUnavailable(
      await request(app).get("/api/soil-ai-detector/alerts"),
      "LEGACY_SOIL_DETECTOR_DISABLED",
    );
  });

  test("rule-based crop suggestions with hard-coded economics are disabled", async () => {
    await expectUnavailable(
      await request(app).post("/api/smart-crop-suggestions/recommendations").send({}),
      "SIMULATED_DATA_DISABLED",
    );
    await expectUnavailable(
      await request(app).get("/api/smart-crop-suggestions/market-analysis/olive"),
      "SIMULATED_DATA_DISABLED",
    );
  });

  test("synthetic market analysis series are not exposed", async () => {
    await expectUnavailable(
      await request(app).get("/api/market-analysis/prices/current"),
      "MARKET_SOURCE_NOT_CONNECTED",
    );
    await expectUnavailable(
      await request(app).get("/api/market-analysis/predictions/olive"),
      "MARKET_SOURCE_NOT_CONNECTED",
    );
  });

  test("public market prices cannot be mistaken for live quotes", async () => {
    await expectUnavailable(
      await request(app)
        .get("/api/public/market-prices")
        .set("X-API-Key", "public_demo_key_12345"),
      "PUBLIC_DATA_SOURCE_NOT_CONNECTED",
    );
  });
});

import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("Fixture-backed API groups fail closed", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  const expectDisabled = async (response: any) => {
    expect(response.status).toBe(503);
    expect(["MARKET_SOURCE_NOT_CONNECTED", "PUBLIC_DATA_SOURCE_NOT_CONNECTED"]).toContain(response.body.code);
    expect(response.body.isRealData).toBe(false);
    expect(response.headers["x-data-provenance"]).toBe("simulated-disabled");
  };

  test("soil AI detector fixture data is not exposed", async () => {
    await expectDisabled(
      await request(app).get("/api/soil-ai-detector/history/field-42"),
    );
    await expectDisabled(
      await request(app).get("/api/soil-ai-detector/alerts"),
    );
  });

  test("rule-based crop suggestions with hard-coded economics are disabled", async () => {
    await expectDisabled(
      await request(app).post("/api/smart-crop-suggestions/recommendations").send({}),
    );
    await expectDisabled(
      await request(app).get("/api/smart-crop-suggestions/market-analysis/olive"),
    );
  });

  test("synthetic market analysis series are not exposed", async () => {
    await expectDisabled(
      await request(app).get("/api/market-analysis/prices/current"),
    );
    await expectDisabled(
      await request(app).get("/api/market-analysis/predictions/olive"),
    );
  });

  test("public market prices cannot be mistaken for live quotes", async () => {
    await expectDisabled(
      await request(app)
        .get("/api/public/market-prices")
        .set("X-API-Key", "public_demo_key_12345"),
    );
  });
});

/**
 * The soil-AI and smart-crop demo endpoints are explicitly labelled simulated.
 * They previously reshuffled their numbers with Math.random() on every request,
 * which made the same field/crop look different each refresh and could be
 * mistaken for live measurements. These tests pin them to a deterministic,
 * seeded generator so the same input yields the same output.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🎲 Deterministic simulated demo endpoints", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("soil history is stable for a given field and labelled simulated", async () => {
    const first = await request(app).get("/api/soil-ai-detector/history/field-42").expect(200);
    const second = await request(app).get("/api/soil-ai-detector/history/field-42").expect(200);
    expect(second.body).toEqual(first.body);
    expect(first.headers["x-data-provenance"]).toBe("simulated");
    expect(first.body.data.analysisHistory).toHaveLength(12);
  });

  test("soil alerts are stable and labelled simulated", async () => {
    const first = await request(app).get("/api/soil-ai-detector/alerts").expect(200);
    const second = await request(app).get("/api/soil-ai-detector/alerts").expect(200);
    expect(second.body).toEqual(first.body);
    expect(first.headers["x-data-provenance"]).toBe("simulated");
  });

  test("crop recommendations declare rule-based provenance", async () => {
    const res = await request(app)
      .post("/api/smart-crop-suggestions/recommendations")
      .send({
        soilProfile: {
          ph: 7,
          nitrogen: 40,
          phosphorus: 25,
          potassium: 180,
          organicMatter: 2.5,
          electricalConductivity: 1.2,
          moisture: 30,
          texture: "loamy",
          drainage: "good",
          depth: 60,
        },
        climateData: {
          region: "Sfax",
          zone: "semi-arid",
          avgTemperature: 22,
          minTemperature: 8,
          maxTemperature: 35,
          annualRainfall: 300,
          humidity: 60,
          windSpeed: 12,
          frostDays: 2,
        },
        farmerGoals: {
          primary: "profit",
          budget: 5000,
          experience: "intermediate",
          marketPreference: "local",
          riskTolerance: "medium",
          waterAvailability: "moderate",
        },
      })
      .expect(200);
    expect(res.body.engine).toBe("rule-based");
    expect(res.body.isRealData).toBe(false);
  });

  test("the synthesised market preview is stable per crop", async () => {
    const first = await request(app).get("/api/smart-crop-suggestions/market-analysis/olive").expect(200);
    const second = await request(app).get("/api/smart-crop-suggestions/market-analysis/olive").expect(200);
    expect(second.body).toEqual(first.body);
    expect(first.body.dataSource).toBe("simulated");
    expect(first.body.isRealData).toBe(false);
  });
});

describe("🌐 Public data API is stable across requests", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  const DEMO_KEY = "public_demo_key_12345";

  test("market prices are byte-identical on two consecutive calls", async () => {
    const a = await request(app)
      .get("/api/public/market-prices")
      .set("X-API-Key", DEMO_KEY);
    const b = await request(app)
      .get("/api/public/market-prices")
      .set("X-API-Key", DEMO_KEY);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    // Strip the volatile lastUpdated field before comparing.
    const strip = (body: any) =>
      JSON.stringify(
        (body.data ?? body.prices ?? []).map?.(
          ({ lastUpdated, ...rest }: any) => rest,
        ) ?? body,
      );
    expect(strip(a.body)).toBe(strip(b.body));
  });

  test("public market data is labelled simulated, not presented as live", async () => {
    const res = await request(app)
      .get("/api/public/market-prices")
      .set("X-API-Key", DEMO_KEY);
    expect(res.status).toBe(200);
    expect(res.body.meta.isRealData).toBe(false);
    expect(res.body.meta.dataSource).toBe("simulated");
  });
});

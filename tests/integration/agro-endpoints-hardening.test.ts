/**
 * Regression tests for endpoints that previously crashed (500) on partial or
 * empty input, or that returned fabricated numbers presented as real data.
 *
 * - POST /api/fertilizer/track/effectiveness  500 on a partial payload
 * - POST /api/smart-irrigation/schedule       500 "Cannot read properties of
 *                                             undefined (reading 'moistureLevel')"
 * - GET  /api/smart-irrigation/weather/:loc   invented random weather
 * - GET  /api/fertilizer/inventory            random availability labels
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("🧪 Fertilizer effectiveness tracking", () => {
  const URL = "/api/fertilizer/track/effectiveness";

  test("computes a score from a full payload", async () => {
    const res = await request(app)
      .post(URL)
      .send({
        applicationId: "app-1",
        productName: "NPK",
        beforeCondition: { healthScore: 50 },
        afterCondition: { healthScore: 72 },
        weatherConditions: { temperature: 20, wind: 10 },
        userRating: 5,
      })
      .expect(200);
    expect(typeof res.body.effectivenessScore).toBe("number");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("rule-based");
  });

  test("rejects a partial payload instead of throwing a 500", async () => {
    const res = await request(app).post(URL).send({ applicationId: "a1" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_INPUT");
  });

  test("an empty body is a 400, not a crash", async () => {
    const res = await request(app).post(URL).send({});
    expect(res.status).toBe(400);
  });

  test("does not report a health regression as an improvement", async () => {
    const res = await request(app)
      .post(URL)
      .send({
        beforeCondition: { healthScore: 80 },
        afterCondition: { healthScore: 60 },
      })
      .expect(200);
    expect(res.body.improvements.join(" ")).toContain("تراجع");
  });
});

describe("💧 Smart irrigation", () => {
  test("creates a schedule for a known field and labels it simulated", async () => {
    const res = await request(app)
      .post("/api/smart-irrigation/schedule")
      .send({ fieldId: "field-tomato-01", cropType: "tomato", stage: "Vegetative" })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.dataSource).toBe("simulated");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.data.scheduleId).toBeTruthy();
  });

  test("an unknown field returns 409, never a 500", async () => {
    const res = await request(app)
      .post("/api/smart-irrigation/schedule")
      .send({ fieldId: "does-not-exist", cropType: "tomato", stage: "Vegetative" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("DATA_UNAVAILABLE");
  });

  test("missing required fields return 400", async () => {
    const res = await request(app)
      .post("/api/smart-irrigation/schedule")
      .send({ fieldId: "field-tomato-01" });
    expect(res.status).toBe(400);
  });

  test("soil-moisture responses are labelled simulated", async () => {
    const res = await request(app)
      .get("/api/smart-irrigation/soil-moisture/field-tomato-01")
      .expect(200);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("simulated");
  });

  test("weather is either real provider data or an explicit 503", async () => {
    const res = await request(app).get("/api/smart-irrigation/weather/Tunis");
    if (res.status === 200) {
      expect(res.body.isRealData).toBe(true);
      expect(res.body.source.provider).toBeTruthy();
      // A real observation, not a random number in a plausible range.
      expect(typeof res.body.data.temperature).toBe("number");
      expect(res.body.data.forecast.next7Days.length).toBeGreaterThan(0);
    } else {
      expect(res.status).toBe(503);
      expect(res.body.dataAvailable).toBe(false);
    }
  });
});

describe("🧴 Fertilizer inventory", () => {
  test("availability is never a random in-stock/out-of-stock guess", async () => {
    const a = await request(app).get("/api/fertilizer/inventory").expect(200);
    const b = await request(app).get("/api/fertilizer/inventory").expect(200);
    expect(a.body.fertilizers.map((f: any) => f.availability)).toEqual(
      b.body.fertilizers.map((f: any) => f.availability),
    );
    expect(a.body.dataSource).toBe("reference-catalogue");
    expect(a.body.isRealData).toBe(false);
  });
});

/**
 * The detailed soil-analysis endpoints fall back to a deterministic demo
 * generator when no provider credential is configured. They previously
 * returned that generated report with no provenance fields at all, so the
 * client could not tell a demo report from a real analysis, and the report
 * lookup endpoint answered `success: true` for an ID that was never stored.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🌱 Detailed soil analysis provenance", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("a demo analysis is labelled, not presented as real", async () => {
    const res = await request(app)
      .post("/api/soil-analysis/analyze")
      .send({ ph: 7.2, moisture: 28, nitrogen: 40, phosphorus: 25, potassium: 180 })
      .expect(200);

    // With no provider configured the engine must disclose its demo source.
    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("rule-based-demo");
    expect(res.body.data.soilAnalysis).toBeDefined();
  });

  test("a batch response carries the same provenance contract", async () => {
    const res = await request(app)
      .post("/api/soil-analysis/batch")
      .send({ soils: [{ ph: 6.8, moisture: 31 }, { ph: 7.9, moisture: 22 }] })
      .expect(200);

    expect(res.body.totalRequested).toBe(2);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("rule-based-demo");
    expect(res.headers["x-is-real-data"]).toBe("false");
  });

  test("batch validation still rejects malformed payloads", async () => {
    await request(app).post("/api/soil-analysis/batch").send({ soils: [] }).expect(400);
    await request(app).post("/api/soil-analysis/batch").send({ soils: "no" }).expect(400);
  });

  test("report lookup does not fake a success for an unstored id", async () => {
    const res = await request(app).get("/api/soil-analysis/report/never-stored").expect(501);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/not implemented/i);
  });
});

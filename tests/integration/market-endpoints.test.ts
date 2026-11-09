import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

describe("📈 Market endpoints", () => {
  test("GET /api/market/all never fabricates prices when no records exist", async () => {
    const response = await request(app).get("/api/market/all");
    if (response.status === 503) {
      expect(response.body.code).toBe("MARKET_DATA_NOT_AVAILABLE");
      expect(response.body.dataAvailable).toBe(false);
      return;
    }
    expect(response.status).toBe(200);
    expect(response.body.data.isRealData).toBe(false);
    expect(response.body.data.sourceVerified).toBe(false);
  });

  test("GET /api/market/trends does not infer trends from an empty database", async () => {
    const response = await request(app)
      .get("/api/market/trends")
      .query({ period: "30" });
    if (response.status === 503) {
      expect(response.body.dataAvailable).toBe(false);
      return;
    }
    expect(response.status).toBe(200);
    expect(response.body.data.isRealData).toBe(false);
    expect(response.body.data.sourceVerified).toBe(false);
    expect(typeof response.body.data.sampleSize).toBe("number");
  });
});

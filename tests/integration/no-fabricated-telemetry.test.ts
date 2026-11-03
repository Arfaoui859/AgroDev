/**
 * Regression tests for fabricated-telemetry removal.
 *
 * These endpoints used to return `Math.random()` values presented as live
 * measurements:
 *
 *  - `/api/sensors` and `/api/real-time-data` served a demo IoT fleet with
 *    random jitter, so frozen demo numbers looked like a live stream.
 *  - `/api/weather-irrigation/analytics/water-usage` invented per-crop water
 *    consumption and daily trends.
 *
 * They must now be labelled as simulated and return stable values, so the SPA
 * can disclose them instead of showing them as metered data.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

describe("📡 Demo sensor endpoints are labelled, not disguised", () => {
  test("/api/sensors stamps simulated provenance and discloses in the body", async () => {
    const res = await request(app).get("/api/sensors");
    expect(res.status).toBe(200);
    expect(res.headers["x-data-provenance"]).toBe("demo-fleet");
    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.dataSource).toBe("simulated");
  });

  test("/api/real-time-data reports the stored reading unchanged", async () => {
    const first = await request(app).get("/api/real-time-data");
    expect(first.status).toBe(200);
    expect(first.headers["x-is-real-data"]).toBe("false");

    const sensors = Object.values(first.body.data.sensors) as Array<{
      value: number;
      change: string;
      changePercent: number;
    }>;
    expect(sensors.length).toBeGreaterThan(0);
    for (const s of sensors) {
      expect(s.change).toBe("unchanged");
      expect(s.changePercent).toBe(0);
    }

    // No jitter: a second call must return identical values.
    const second = await request(app).get("/api/real-time-data");
    expect(second.body.data.sensors).toEqual(first.body.data.sensors);
  });

  test("/api/real-time-data does not invent weather or latency figures", async () => {
    const res = await request(app).get("/api/real-time-data");
    expect(res.body.data.weather).toBeNull();
    expect(res.body.data.systemHealth.dataLatency).toBeNull();
    expect(res.body.data.systemHealth.errorRate).toBeNull();
  });
});

describe("💧 Water-usage analytics are labelled and deterministic", () => {
  test("returns stable, disclosed estimate rather than random measurements", async () => {
    const payload = {
      farmId: "farm-1",
      period: "week",
      cropTypes: ["tomato", "olive"],
    };

    const first = await request(app)
      .post("/api/weather-irrigation/analytics/water-usage")
      .send(payload);
    expect(first.status).toBe(200);
    expect(first.headers["x-data-provenance"]).toBe("simulated");
    expect(first.headers["x-is-real-data"]).toBe("false");
    expect(first.body.isRealData).toBe(false);
    expect(first.body.disclaimer).toBeTruthy();

    const second = await request(app)
      .post("/api/weather-irrigation/analytics/water-usage")
      .send(payload);
    expect(second.body.breakdown).toEqual(first.body.breakdown);
    expect(second.body.trends).toEqual(first.body.trends);
  });
});

/**
 * Fail-closed regression tests for telemetry and irrigation data.
 * Sensor readings require a connected device registry and persistent telemetry;
 * water-use analytics require verified crop-water coefficients and farm data.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => { app = createServer(); });

describe("Telemetry does not fabricate sensor readings", () => {
  test.each(["/api/sensors", "/api/real-time-data"])("%s stays unavailable without connected devices", async (path) => {
    const response = await request(app).get(path).expect(503);
    expect(response.body.code).toBe(path === "/api/sensors" ? "SENSOR_REGISTRY_NOT_CONNECTED" : "SENSOR_STREAM_NOT_CONNECTED");
    expect(response.body.dataAvailable).toBe(false);
    expect(response.body.isRealData).toBe(false);
    expect(response.headers["x-data-provenance"]).toBe("unavailable");
  });
});

describe("Irrigation analytics require verified inputs", () => {
  test("water usage does not return estimated values as measurements", async () => {
    const response = await request(app)
      .post("/api/weather-irrigation/analytics/water-usage")
      .send({ farmId: "farm-1", period: "week", cropTypes: ["tomato", "olive"] })
      .expect(503);
    expect(response.body.code).toBe("IRRIGATION_ANALYTICS_NOT_VERIFIED");
    expect(response.body.data).toBeNull();
  });
});

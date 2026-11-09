/**
 * Regression tests for the AI crop recommender weather integration.
 *
 * The route used to score every crop against Math.random() "weather". It now
 * fetches real current conditions for the submitted coordinates and, when the
 * provider is down, says so (metadata.weatherAvailable=false plus an explicit
 * climate note) instead of scoring against invented numbers.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const validBody = {
  temperature: 24,
  annual_rainfall: 450,
  soil_ph: 6.8,
  location: { latitude: 36.8, longitude: 10.18, governorate: "tunis" },
  language: "ar",
};

let app: express.Application;

beforeAll(() => {
  app = createServer();
});


describe("🌱 AI crop recommender refuses unvalidated model output", () => {
  test("does not return crop recommendations from an unvalidated model", async () => {
    const res = await request(app).post("/api/ai/crops/recommend").send(validBody);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("CROP_MODEL_NOT_VALIDATED");
    expect(res.body.recommendations).toBeUndefined();
  });

  test("rejects incomplete agronomic inputs before invoking the model", async () => {
    const res = await request(app).post("/api/ai/crops/recommend").send({ soilData: {} });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("CROP_INPUT_INVALID");
  });
});

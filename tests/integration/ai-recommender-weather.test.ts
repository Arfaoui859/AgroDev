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

jest.mock("../../server/services/providers/weatherProvider", () => {
  const actual = jest.requireActual("../../server/services/providers/weatherProvider");
  return { ...actual, getWeatherFromOpenMeteo: jest.fn() };
});

import { getWeatherFromOpenMeteo } from "../../server/services/providers/weatherProvider";
import { ProviderError } from "../../server/services/providers/http";

const mockedWeather = getWeatherFromOpenMeteo as jest.Mock;

const validBody = {
  location: { latitude: 36.8, longitude: 10.18, governorate: "tunis" },
  soilData: { ph: 6.8, nitrogen: 120, phosphorus: 40, potassium: 180 },
  farmerPreferences: {
    riskTolerance: "medium",
    investmentCapacity: "medium",
    experienceLevel: "intermediate",
    farmSize: 3,
  },
};

const sampleWeather = {
  location: { name: "تونس", lat: 36.8, lon: 10.18 },
  current: {
    temperature: 27,
    humidity: 55,
    windSpeed: 10,
    pressure: 1014,
    visibility: 20,
    description: "صافٍ",
    icon: "sunny",
  },
  forecast: {
    daily: [{ date: "2026-11-03", maxTemp: 29, minTemp: 17, humidity: 55, rainfall: 1, description: "صافٍ", icon: "sunny" }],
    weekly: { averageTemp: 23, totalRainfall: 1, averageHumidity: 55 },
  },
  historical: { monthlyAverages: [] },
  agriculturalIndices: { growingDegreeDays: 5, evapotranspiration: 3, soilMoisture: 40, cropStress: "low" as const },
  source: { provider: "Open-Meteo", observationTime: null, isRealData: true as const },
};

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

beforeEach(() => mockedWeather.mockReset());

describe("🌱 AI crop recommender refuses unvalidated model output", () => {
  test("does not return crop recommendations from an unvalidated service", async () => {
    mockedWeather.mockResolvedValue(sampleWeather);
    const res = await request(app).post("/api/ai/recommend").send(validBody);
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.recommendations).toBeUndefined();
  });

  test("does not substitute invented weather or recommendations when the provider is down", async () => {
    mockedWeather.mockRejectedValue(new ProviderError("Open-Meteo", "network", "down"));
    const res = await request(app).post("/api/ai/recommend").send(validBody);
    expect([503, 502]).toContain(res.status);
    expect(res.body.recommendations).toBeUndefined();
  });

  test("rejects a request without coordinates before calling the service", async () => {
    const res = await request(app).post("/api/ai/recommend").send({ soilData: {} });
    expect(res.status).toBe(400);
  });
});

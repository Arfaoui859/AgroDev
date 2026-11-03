/**
 * Regression tests for the weather/crop planner real-data contract.
 *
 * These endpoints previously synthesised forecasts with Math.random(). They now
 * call the Open-Meteo provider. The provider is stubbed here so the tests are
 * hermetic, and the contract asserted is about behaviour, not the upstream:
 *   - a real forecast is returned and labelled as real;
 *   - an unknown location is a 404, not invented weather;
 *   - a provider outage is a 503, not invented weather.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

jest.mock("../../server/services/providers/weatherProvider", () => {
  const actual = jest.requireActual("../../server/services/providers/weatherProvider");
  const { ProviderError } = jest.requireActual("../../server/services/providers/http");
  return {
    ...actual,
    getWeatherFromOpenMeteo: jest.fn(),
    getHistoricalWeatherFromOpenMeteo: jest.fn(),
  };
});

import {
  getWeatherFromOpenMeteo,
  getHistoricalWeatherFromOpenMeteo,
} from "../../server/services/providers/weatherProvider";
import { ProviderError } from "../../server/services/providers/http";

const mockedCurrent = getWeatherFromOpenMeteo as jest.Mock;
const mockedHistorical = getHistoricalWeatherFromOpenMeteo as jest.Mock;

const sampleWeather = {
  location: { name: "تونس العاصمة", lat: 36.8065, lon: 10.1815 },
  current: {
    temperature: 24,
    humidity: 61,
    windSpeed: 12,
    pressure: 1015,
    visibility: 20,
    description: "صافٍ",
    icon: "sunny",
  },
  forecast: {
    daily: Array.from({ length: 14 }, (_, i) => ({
      date: `2026-11-${String(i + 1).padStart(2, "0")}`,
      maxTemp: 26 + i,
      minTemp: 14 + i,
      humidity: 60,
      rainfall: i === 0 ? 3 : 0,
      description: "صافٍ",
      icon: "sunny",
      solarRadiation: 5,
      uvIndex: 4,
      pressure: 1015,
      visibility: 20,
      windDirection: 270,
      windSpeed: 12,
    })),
    weekly: { averageTemp: 20, totalRainfall: 3, averageHumidity: 60 },
  },
  historical: { monthlyAverages: [] },
  agriculturalIndices: {
    growingDegreeDays: 10,
    evapotranspiration: 3,
    soilMoisture: 40,
    cropStress: "low" as const,
  },
  source: { provider: "Open-Meteo", observationTime: "2026-11-03T10:00", isRealData: true as const },
};

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

beforeEach(() => {
  mockedCurrent.mockReset();
  mockedHistorical.mockReset();
});

describe("🌦️ Weather crop planner uses real provider data", () => {
  test("alerts return real conditions and are labelled real", async () => {
    mockedCurrent.mockResolvedValue(sampleWeather);
    const res = await request(app).get("/api/weather-crop-planner/alerts/tunis");
    expect(res.status).toBe(200);
    expect(res.body.isRealData).toBe(true);
    expect(res.body.dataSource).toBe("Open-Meteo");
    expect(res.body.currentConditions.temperature).toBe(24);
  });

  test("smart-schedule labels the forecast real", async () => {
    mockedCurrent.mockResolvedValue(sampleWeather);
    const res = await request(app)
      .post("/api/weather-crop-planner/smart-schedule")
      .send({
        cropType: "olive",
        farmLocation: "tunis",
        plannedTasks: [
          { taskId: "t1", taskType: "irrigation", scheduledDate: "2026-11-02" },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.isRealData).toBe(true);
    expect(Array.isArray(res.body.optimizedSchedule)).toBe(true);
  });

  test("irrigation-optimization labels the forecast real", async () => {
    mockedCurrent.mockResolvedValue(sampleWeather);
    const res = await request(app)
      .post("/api/weather-crop-planner/irrigation-optimization")
      .send({ cropType: "olive", farmSize: 2, farmLocation: "sfax" });
    expect(res.status).toBe(200);
    expect(res.body.isRealData).toBe(true);
    expect(Array.isArray(res.body.optimizedPlan)).toBe(true);
  });

  test("historical-analysis returns real monthly averages", async () => {
    mockedHistorical.mockResolvedValue({
      monthly: [
        { month: "2026-01", avgTemp: 12, totalRainfall: 60, avgHumidity: 70 },
        { month: "2026-02", avgTemp: 13, totalRainfall: 55, avgHumidity: 68 },
      ],
      source: { provider: "Open-Meteo Archive", isRealData: true },
    });
    const res = await request(app).get(
      "/api/weather-crop-planner/historical-analysis/tunis/olive",
    );
    expect(res.status).toBe(200);
    expect(res.body.isRealData).toBe(true);
    expect(res.body.dataSource).toBe("Open-Meteo Archive");
    expect(res.body.monthlyAverages).toHaveLength(2);
  });

  test("an unknown location is a 404, not invented weather", async () => {
    const res = await request(app).get("/api/weather-crop-planner/alerts/atlantis");
    expect(res.status).toBe(404);
    expect(mockedCurrent).not.toHaveBeenCalled();
  });

  test("a provider outage is a 503, not invented weather", async () => {
    mockedCurrent.mockRejectedValue(
      new ProviderError("Open-Meteo", "network", "boom"),
    );
    const res = await request(app).get("/api/weather-crop-planner/alerts/tunis");
    expect(res.status).toBe(503);
    expect(res.body.isRealData).toBe(false);
  });
});

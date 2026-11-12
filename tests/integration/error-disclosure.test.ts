/**
 * Transport-error disclosure regression tests.
 *
 * Node and axios attach the resolved host to transport failures
 * (`getaddrinfo ENOTFOUND ai-soil-analysis.internal`,
 * `connect ECONNREFUSED 10.0.0.7:8001`). Several public endpoints echoed that
 * raw message in the response body, letting an anonymous caller enumerate the
 * backend's private service topology.
 *
 * These tests drive the real handlers with a stubbed upstream that rejects with
 * an address-bearing error, and assert the address never reaches the client.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { ProviderError } from "../../server/services/providers/http";

// The gateway calls the axios default export as a function, which does not go
// through the `request` property, so spyOn cannot intercept it. Replace the
// module instead and control the rejection object directly.
jest.mock("axios", () => {
  const actual = jest.requireActual("axios");
  const mock = jest.fn() as unknown as jest.Mock & { post: jest.Mock; get: jest.Mock };
  mock.post = jest.fn();
  mock.get = jest.fn();
  return { __esModule: true, default: mock, AxiosError: actual.AxiosError };
});

jest.mock("../../server/services/providers/weatherProvider", () => {
  const actual = jest.requireActual("../../server/services/providers/weatherProvider");
  return {
    ...actual,
    getWeatherFromOpenMeteo: jest.fn(),
  };
});

import axios from "axios";
import { getWeatherFromOpenMeteo } from "../../server/services/providers/weatherProvider";

const mockedAxios = axios as unknown as jest.Mock;
const mockedWeather = getWeatherFromOpenMeteo as jest.Mock;
const PRIVATE_HOST = "ai-soil-analysis.internal";

describe("🔒 Transport errors never disclose internal addresses", () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    // Point a configured AI service at a private host so a failed call carries
    // that host in its message.
    process.env.SOIL_ANALYSIS_URL = `http://${PRIVATE_HOST}:8001`;
    app = createServer();
  });

  afterEach(() => {
    mockedAxios.mockReset();
    mockedWeather.mockReset();
  });

  test("GET /api/weather/coordinates does not echo a DNS failure host", async () => {
    mockedWeather.mockRejectedValue(
      new ProviderError(
        "Open-Meteo",
        "network",
        `getaddrinfo ENOTFOUND ${PRIVATE_HOST}`,
      ),
    );
    const res = await request(app).get("/api/weather/coordinates?lat=36.8&lon=10.2");
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain(PRIVATE_HOST);
    // The coarse category is still useful to the client.
    expect(res.body.message).toBe("dns_resolution_failed");
    expect(res.body.dataAvailable).toBe(false);
  });

  test("GET /api/weather/coordinates collapses a connection refusal", async () => {
    mockedWeather.mockRejectedValue(
      new ProviderError("Open-Meteo", "network", "connect ECONNREFUSED 10.0.0.7:8001"),
    );
    const res = await request(app).get("/api/weather/coordinates?lat=36.8&lon=10.2");
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain("10.0.0.7");
    expect(res.body.message).toBe("connection_refused");
  });

  test("POST /api/ai/soil/analyze does not echo a transport host on a 5xx", async () => {
    mockedAxios.mockRejectedValue({
      message: `getaddrinfo ENOTFOUND ${PRIVATE_HOST}`,
      response: { status: 500, data: `<html>upstream error at http://${PRIVATE_HOST}:8001</html>` },
      isAxiosError: true,
    });
    const res = await request(app)
      .post("/api/ai/soil/analyze")
      .send({ sensor_data: { ph: 6.5 } });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain(PRIVATE_HOST);
    expect(res.body.message).toBe("Upstream service returned an unexpected error response");
  });

  test("POST /api/ai/soil/analyze still forwards an intentional structured refusal", async () => {
    const structured = {
      code: "MODEL_NOT_VALIDATED",
      message: "Production output is disabled until a validated model is available.",
      production_ready: false,
    };
    mockedAxios.mockRejectedValue({
      message: "Request failed with status code 503",
      response: { status: 503, data: structured },
      isAxiosError: true,
    });
    const res = await request(app)
      .post("/api/ai/soil/analyze")
      .send({ sensor_data: { ph: 6.5 } });
    expect(res.status).toBe(503);
    // A deliberate upstream contract is preserved verbatim.
    expect(res.body.message).toEqual(structured);
  });
});

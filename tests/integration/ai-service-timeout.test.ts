/**
 * The gateway's direct microservice calls must honour `AI_SERVICE_TIMEOUT_MS`.
 * An idle Render free-tier container can take 20-60s to cold-start, so operators
 * need to raise the per-call timeout without a code change. The default stays
 * 30s so existing behaviour is unchanged.
 *
 * Axios is mocked, so the Python services need not be running.
 */
import express from "express";
import request from "supertest";

const sentConfigs: any[] = [];

jest.mock("axios", () => {
  const callable: any = jest.fn(async (config: any) => {
    sentConfigs.push(config);
    return { data: { ok: true }, status: 200 };
  });
  callable.__esModule = true;
  callable.default = callable;
  callable.post = callable;
  return callable;
});

async function lastTimeout(): Promise<number> {
  const { createServer } = require("../../server/index");
  const app: express.Application = createServer();
  sentConfigs.length = 0;
  await request(app)
    .post("/api/ai/soil/analyze")
    .send({ sensor_data: { ph: 6.5 } });
  return sentConfigs[sentConfigs.length - 1].timeout;
}

describe("AI gateway microservice timeout is env-configurable", () => {
  afterEach(() => {
    delete process.env.AI_SERVICE_TIMEOUT_MS;
    jest.resetModules();
  });

  test("defaults to 30000ms", async () => {
    delete process.env.AI_SERVICE_TIMEOUT_MS;
    jest.resetModules();
    expect(await lastTimeout()).toBe(30_000);
  });

  test("honours AI_SERVICE_TIMEOUT_MS when set", async () => {
    process.env.AI_SERVICE_TIMEOUT_MS = "60000";
    jest.resetModules();
    expect(await lastTimeout()).toBe(60_000);
  });
});

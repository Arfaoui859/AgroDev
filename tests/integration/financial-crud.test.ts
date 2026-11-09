import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("Financial routes fail closed until persistent storage is connected", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test.each([
    ["POST", "/api/expenses"],
    ["GET", "/api/expenses"],
    ["POST", "/api/revenues"],
    ["GET", "/api/revenues"],
    ["GET", "/api/profitability-analysis"],
    ["GET", "/api/financial-summary"],
    ["POST", "/api/budget-plans"],
    ["GET", "/api/budget-plans"],
  ])("%s %s does not expose in-memory financial records", async (method, path) => {
    const response = method === "POST"
      ? await request(app).post(path).send({})
      : await request(app).get(path);
    expect(response.status).toBe(503);
    expect(response.body.code).toBe("SIMULATED_DATA_DISABLED");
    expect(response.body.isRealData).toBe(false);
  });
});

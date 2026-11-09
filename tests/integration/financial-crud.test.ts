import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("Financial routes require a verified session and persistent storage", () => {
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
    if (path.includes("budget-plans")) {
      expect(response.status).toBe(501);
      expect(response.body.code).toBe("BUDGET_PLAN_NOT_IMPLEMENTED");
    } else {
      expect(response.status).toBe(503);
      expect(response.body.code).toBe("FARM_FINANCE_DATABASE_UNAVAILABLE");
    }
  });
});

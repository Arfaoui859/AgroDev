/**
 * Financial routes require a verified session and persistent storage.
 *
 * Budget plans were previously hard-stubbed with a 501. They are now backed by
 * public.farm_budget_plans (owner-scoped, RLS) like the rest of the finance
 * ledger, so an anonymous caller must be denied — never served in-memory data.
 */
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
    ["PUT", "/api/budget-plans/11111111-1111-1111-1111-111111111111"],
    ["DELETE", "/api/budget-plans/11111111-1111-1111-1111-111111111111"],
  ])("%s %s denies an anonymous caller (never in-memory records)", async (method, path) => {
    const response = method === "POST"
      ? await request(app).post(path).send({})
      : method === "PUT"
        ? await request(app).put(path).send({})
        : method === "DELETE"
          ? await request(app).delete(path)
          : await request(app).get(path);
    expect([401, 403, 503]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
  });
});

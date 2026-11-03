/**
 * Financial summary trends were hardcoded (`incomeGrowth: 5.2`, `3.1`, `8.7`)
 * regardless of the underlying records — the dashboard showed a confident
 * "+5.2% vs previous period" even when income and expenses were both zero.
 * The growth figures are now derived from the stored records.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("💰 Financial summary trends are derived from data", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("an empty period reports zero growth, not fabricated numbers", async () => {
    const res = await request(app)
      .get("/api/financial-summary?period=yearly&year=2099")
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.trends).toEqual({
      incomeGrowth: 0,
      expenseGrowth: 0,
      profitGrowth: 0,
    });
  });

  test("growth reflects the actual change between consecutive periods", async () => {
    const res = await request(app)
      .get("/api/financial-summary?period=quarterly&year=2024&quarter=3")
      .expect(200);

    // Q2 held the wheat sale (600 TND); Q3 holds nothing, so income is -100%.
    expect(res.body.data.trends.incomeGrowth).toBe(-100);
  });
});

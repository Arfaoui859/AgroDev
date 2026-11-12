/**
 * Budget planning — payload validation and fail-closed behaviour.
 *
 * Plans persist in public.farm_budget_plans and are owner-scoped. The payload
 * validator must force `user_id` from the verified identity (never the body)
 * and reject malformed input before any database write.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { budgetPlanPayload } from "../../server/routes/farm-finance";

const ORIGINAL = { ...process.env };
const USER = "11111111-1111-1111-1111-111111111111";

function unconfigured() {
  process.env = {
    ...ORIGINAL,
    NODE_ENV: "production",
    ENABLE_DEMO_ENDPOINTS: "false",
    ADMIN_API_TOKEN: "",
    SUPABASE_URL: "",
    VITE_SUPABASE_URL: "",
    SUPABASE_ANON_KEY: "",
    VITE_SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  };
}

describe("Budget planning — authorization", () => {
  let app: express.Application;
  beforeAll(() => {
    unconfigured();
    app = createServer();
  });
  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("anonymous GET /api/budget-plans is denied", async () => {
    const res = await request(app).get("/api/budget-plans");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("anonymous POST /api/budget-plans is denied", async () => {
    const res = await request(app).post("/api/budget-plans").send({ cropType: "tomato", plannedArea: 2, seasonYear: 2026 });
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });
});

describe("Budget planning — payload validation (owner is never client-supplied)", () => {
  test("accepts a valid plan and forces user_id from the argument", () => {
    const parsed = budgetPlanPayload(
      {
        cropType: "tomato",
        plannedArea: 2.5,
        seasonYear: 2026,
        customExpenses: [{ category: "seeds", plannedAmount: 300 }],
        user_id: "attacker",
      },
      USER,
    );
    expect("payload" in parsed).toBe(true);
    if ("payload" in parsed) {
      expect(parsed.payload.user_id).toBe(USER);
      expect(parsed.payload.crop_type).toBe("tomato");
      expect(parsed.payload.season_year).toBe(2026);
      expect(parsed.payload.planned_area_hectares).toBe(2.5);
      expect(parsed.payload.currency).toBe("TND");
      expect(parsed.payload.status).toBe("draft");
      expect(parsed.payload.projected_revenue).toBeNull();
      expect(parsed.payload.planned_expenses).toEqual([{ category: "seeds", plannedAmount: 300 }]);
    } else throw new Error("expected a payload");
  });

  test("rejects a missing crop type", () => {
    expect(budgetPlanPayload({ plannedArea: 2, seasonYear: 2026 }, USER)).toEqual({ error: "INVALID_CROP_TYPE" });
  });

  test("rejects a non-positive planned area", () => {
    expect(budgetPlanPayload({ cropType: "tomato", plannedArea: 0, seasonYear: 2026 }, USER)).toEqual({ error: "INVALID_PLANNED_AREA" });
  });

  test("rejects an out-of-range season year", () => {
    expect(budgetPlanPayload({ cropType: "tomato", plannedArea: 2, seasonYear: 1990 }, USER)).toEqual({ error: "INVALID_SEASON_YEAR" });
  });

  test("rejects a negative projected revenue", () => {
    expect(budgetPlanPayload({ cropType: "tomato", plannedArea: 2, seasonYear: 2026, projectedRevenue: -5 }, USER)).toEqual({ error: "INVALID_PROJECTED_REVENUE" });
  });

  test("rejects a malformed farm id", () => {
    expect(budgetPlanPayload({ cropType: "tomato", plannedArea: 2, seasonYear: 2026, farm_id: "not-a-uuid" }, USER)).toEqual({ error: "INVALID_FARM_ID" });
  });

  test("drops malformed expense lines rather than persisting them", () => {
    const parsed = budgetPlanPayload(
      {
        cropType: "tomato",
        plannedArea: 2,
        seasonYear: 2026,
        customExpenses: [
          { category: "seeds", plannedAmount: 100 },
          { category: "", plannedAmount: 50 },
          { category: "labor", plannedAmount: "oops" },
          { category: "water", plannedAmount: 20 },
        ],
      },
      USER,
    );
    if ("payload" in parsed) {
      expect(parsed.payload.planned_expenses).toEqual([
        { category: "seeds", plannedAmount: 100 },
        { category: "water", plannedAmount: 20 },
      ]);
    } else throw new Error("expected a payload");
  });
});

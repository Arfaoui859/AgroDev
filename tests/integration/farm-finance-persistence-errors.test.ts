import express from "express";
import request from "supertest";

let databaseError: { code: string; message: string } | null = null;

jest.mock("../../server/lib/supabase", () => ({
  scopedClientFromAuthHeader: () => ({
    from: () => {
      const builder: any = {
        insert: () => builder,
        select: () => builder,
        single: async () => ({
          data: null,
          error: databaseError,
        }),
      };
      return builder;
    },
  }),
}));

import { createExpense } from "../../server/routes/farm-finance";

function appForFinance() {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.identitySource = "jwt";
    req.userId = "farmer-1";
    next();
  });
  app.post("/api/expenses", createExpense);
  return app;
}

describe("farm finance persistence error classification", () => {
  beforeEach(() => {
    databaseError = null;
  });

  const validExpense = {
    amount: 125,
    date: "2026-11-09",
    category: "seeds",
    currency: "TND",
  };

  test("reports a missing migration with an actionable code", async () => {
    databaseError = {
      code: "PGRST205",
      message: "Could not find the table public.farm_expenses in the schema cache",
    };

    const response = await request(appForFinance())
      .post("/api/expenses")
      .set("Authorization", "Bearer test-jwt")
      .send(validExpense);

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("FARM_FINANCE_MIGRATION_REQUIRED");
    expect(response.body.databaseCode).toBe("PGRST205");
  });

  test("returns forbidden when Supabase rejects the write through RLS", async () => {
    databaseError = {
      code: "42501",
      message: "new row violates row-level security policy",
    };

    const response = await request(appForFinance())
      .post("/api/expenses")
      .set("Authorization", "Bearer test-jwt")
      .send(validExpense);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("FARM_FINANCE_RLS_DENIED");
    expect(response.body.databaseCode).toBe("42501");
  });

  test("rejects invalid expense input before calling persistence", async () => {
    const response = await request(appForFinance())
      .post("/api/expenses")
      .set("Authorization", "Bearer test-jwt")
      .send({ ...validExpense, amount: -1 });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_EXPENSE");
  });
});

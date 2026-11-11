import express from "express";
import request from "supertest";

jest.mock("../../server/lib/supabase", () => ({
  scopedClientFromAuthHeader: jest.fn(),
}));
const { scopedClientFromAuthHeader: mockScopedClientFromAuthHeader } = require("../../server/lib/supabase");
const { getSoilAnalysisHistory } = require("../../server/routes/soil-analysis-records");

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const FIELD_ID = "22222222-2222-4222-8222-222222222222";

function makeApp(identity: "jwt" | "demo" | "none" = "jwt") {
  const app = express();
  app.use((req, _res, next) => {
    if (identity !== "none") {
      req.identitySource = identity;
      req.userId = "authenticated-user";
    }
    next();
  });
  app.get("/records", getSoilAnalysisHistory);
  return app;
}

function configureDatabase(options: { farm?: unknown; field?: unknown; history?: unknown[] } = {}) {
  const calls: Array<{ table: string; filters: Array<[string, unknown]>; selected?: string }> = [];
  const client = {
    from: jest.fn((table: string) => {
      const call = { table, filters: [] as Array<[string, unknown]>, selected: undefined as string | undefined };
      calls.push(call);
      const builder: any = {
        select: jest.fn((columns: string) => { call.selected = columns; return builder; }),
        eq: jest.fn((column: string, value: unknown) => { call.filters.push([column, value]); return builder; }),
        maybeSingle: jest.fn(async () => ({
          data: table === "farms" ? (options.farm === undefined ? { id: FARM_ID } : options.farm)
            : (options.field === undefined ? { id: FIELD_ID } : options.field),
          error: null,
        })),
        order: jest.fn(() => builder),
        limit: jest.fn(async () => ({ data: options.history ?? [], error: null })),
      };
      return builder;
    }),
  };
  mockScopedClientFromAuthHeader.mockReturnValue(client);
  return { client, calls };
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/soil-analysis/records", () => {
  test("requires a verified JWT identity", async () => {
    const response = await request(makeApp("demo")).get("/records").query({ farm_id: FARM_ID });
    expect(response.status).toBe(401);
    expect(mockScopedClientFromAuthHeader).not.toHaveBeenCalled();
  });

  test("validates farm, field and bounded limit before database access", async () => {
    const app = makeApp();
    expect((await request(app).get("/records").query({ farm_id: "bad" })).status).toBe(400);
    expect((await request(app).get("/records").query({ farm_id: FARM_ID, limit: 1000 })).status).toBe(400);
    expect(mockScopedClientFromAuthHeader).not.toHaveBeenCalled();
  });

  test("returns 404 when RLS hides the requested farm", async () => {
    configureDatabase({ farm: null });
    const response = await request(makeApp()).get("/records").query({ farm_id: FARM_ID })
      .set("Authorization", "Bearer user-jwt");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("FARM_NOT_FOUND");
  });

  test("rejects a field that is not visible under the selected farm", async () => {
    configureDatabase({ field: null });
    const response = await request(makeApp()).get("/records")
      .query({ farm_id: FARM_ID, field_id: FIELD_ID })
      .set("Authorization", "Bearer user-jwt");
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("FIELD_NOT_FOUND");
  });

  test("returns only the requested farm/field history using the caller JWT and bounded ordering", async () => {
    const history = [{ id: "analysis-1", farm_id: FARM_ID, section_id: FIELD_ID, ph_level: 6.5 }];
    const { calls } = configureDatabase({ history });
    const response = await request(makeApp()).get("/records")
      .query({ farm_id: FARM_ID, field_id: FIELD_ID, limit: 10 })
      .set("Authorization", "Bearer user-jwt");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(history);
    expect(response.body.meta).toMatchObject({ farm_id: FARM_ID, field_id: FIELD_ID, limit: 10, count: 1 });
    expect(mockScopedClientFromAuthHeader).toHaveBeenCalledWith("Bearer user-jwt");
    expect(calls[2].filters).toEqual([["farm_id", FARM_ID], ["section_id", FIELD_ID]]);
    expect(calls[2].selected).toContain("analysis_result");
  });
});

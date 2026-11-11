import express from "express";
import request from "supertest";

const scopedClientFromAuthHeader = jest.fn();
jest.mock("../../server/lib/supabase", () => ({
  scopedClientFromAuthHeader: (...args: unknown[]) => scopedClientFromAuthHeader(...args),
}));

import { saveSoilAnalysis } from "../../server/routes/soil-analysis-records";

const FARM_ID = "11111111-1111-4111-8111-111111111111";
const FIELD_ID = "22222222-2222-4222-8222-222222222222";

function makeApp(identity: "jwt" | "demo" | "none" = "jwt") {
  const app = express();
  app.use(express.json());
  app.post("/records", (req, _res, next) => {
    if (identity !== "none") {
      req.identitySource = identity;
      req.userId = "authenticated-user";
    }
    next();
  }, saveSoilAnalysis);
  return app;
}

function configureDatabase(options: { farm?: unknown; field?: unknown } = {}) {
  const saved: Record<string, unknown>[] = [];
  const client = {
    from: jest.fn((table: string) => {
      const builder: any = {
        select: jest.fn(() => builder),
        eq: jest.fn(() => builder),
        maybeSingle: jest.fn(async () => ({
          data: table === "farms" ? (options.farm === undefined ? { id: FARM_ID } : options.farm)
            : (options.field === undefined ? { id: FIELD_ID } : options.field),
          error: null,
        })),
        insert: jest.fn((row: Record<string, unknown>) => {
          saved.push(row);
          return builder;
        }),
        single: jest.fn(async () => ({
          data: { id: "33333333-3333-4333-8333-333333333333", ...saved[saved.length - 1] },
          error: null,
        })),
      };
      return builder;
    }),
  };
  scopedClientFromAuthHeader.mockReturnValue(client);
  return { client, saved };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/soil-analysis/records", () => {
  test("requires a verified JWT identity; demo and anonymous identities cannot persist", async () => {
    const res = await request(makeApp("demo")).post("/records").send({});
    expect(res.status).toBe(401);
    expect(scopedClientFromAuthHeader).not.toHaveBeenCalled();
  });

  test("rejects malformed identifiers and invalid sensor payloads before database access", async () => {
    const app = makeApp();
    const badId = await request(app).post("/records").send({ farm_id: "farm-1", sensor_data: {} });
    expect(badId.status).toBe(400);
    const badData = await request(app).post("/records").send({ farm_id: FARM_ID, sensor_data: [] });
    expect(badData.status).toBe(400);
    expect(scopedClientFromAuthHeader).not.toHaveBeenCalled();
  });

  test("returns 404 when RLS hides a farm not owned by the caller", async () => {
    configureDatabase({ farm: null });
    const res = await request(makeApp()).post("/records")
      .set("Authorization", "Bearer user-jwt")
      .send({ farm_id: FARM_ID, sensor_data: { ph: 6.5 } });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("FARM_NOT_FOUND");
  });

  test("returns 404 when the selected field does not belong to the selected farm", async () => {
    configureDatabase({ field: null });
    const res = await request(makeApp()).post("/records")
      .set("Authorization", "Bearer user-jwt")
      .send({ farm_id: FARM_ID, field_id: FIELD_ID, sensor_data: { ph: 6.5 } });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("FIELD_NOT_FOUND");
  });

  test("persists only allow-listed data through the caller-scoped client", async () => {
    const { saved } = configureDatabase();
    const res = await request(makeApp()).post("/records")
      .set("Authorization", "Bearer user-jwt")
      .send({
        farm_id: FARM_ID,
        field_id: FIELD_ID,
        analysis_type: "lab",
        sensor_data: { ph: 6.5, moisture: 45 },
        analysis_result: { texture: "loam" },
        recommendations: [{ action: "retest" }],
        health_score: 80,
        owner_id: "attacker-controlled",
        created_at: "2000-01-01T00:00:00.000Z",
      });

    expect(res.status).toBe(201);
    expect(scopedClientFromAuthHeader).toHaveBeenCalledWith("Bearer user-jwt");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      farm_id: FARM_ID,
      section_id: FIELD_ID,
      analysis_type: "lab",
      sensor_data: { ph: 6.5, moisture: 45 },
      analysis_result: { texture: "loam" },
      recommendations: [{ action: "retest" }],
      health_score: 80,
    });
    expect(saved[0]).not.toHaveProperty("owner_id");
    expect(saved[0]).not.toHaveProperty("created_at");
  });

  test("rejects oversized JSON payloads and out-of-range health scores", async () => {
    configureDatabase();
    const app = makeApp();
    const oversized = await request(app).post("/records")
      .set("Authorization", "Bearer user-jwt")
      .send({ farm_id: FARM_ID, sensor_data: { notes: "x".repeat(105 * 1024) } });
    expect(oversized.status).toBe(413);
    const invalidScore = await request(app).post("/records")
      .set("Authorization", "Bearer user-jwt")
      .send({ farm_id: FARM_ID, sensor_data: {}, health_score: 120 });
    expect(invalidScore.status).toBe(400);
  });
});

/**
 * Livestock API — authorization, fail-closed behaviour and honest
 * "not computed" states.
 *
 * The livestock endpoints previously served synthetic demo data, then failed
 * closed. They now read/write the caller's own persisted rows under RLS. These
 * tests pin the contract that matters for safety:
 *   - no verified session => never a success payload;
 *   - without a configured database => an explicit 503, never fabricated data;
 *   - feed-optimization / breeding / feed-recommendation => honest
 *     "not computed" states (no invented rations or pairings).
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import {
  animalPayload,
  getLivestockDashboard,
} from "../../server/routes/livestock";
import { getBreedingRecommendations, getFeedRecommendations } from "../../server/routes/advanced-livestock-management";

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

describe("Livestock API — authorization", () => {
  let app: express.Application;
  beforeAll(() => {
    unconfigured();
    app = createServer();
  });
  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("anonymous GET /api/livestock-management/animals is denied", async () => {
    const res = await request(app).get("/api/livestock-management/animals");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("a forged Bearer token cannot read the herd", async () => {
    const res = await request(app)
      .get("/api/livestock-management/animals")
      .set("Authorization", "Bearer not-a-real-jwt");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("a demo header cannot smuggle an anonymous caller in (production posture)", async () => {
    const res = await request(app)
      .get("/api/livestock-management/animals")
      .set("x-demo-user", "attacker");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });

  test("anonymous POST /api/livestock-management/animals is denied", async () => {
    const res = await request(app)
      .post("/api/livestock-management/animals")
      .send({ earTag: "T1", species: "beef_cattle", gender: "female" });
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });
});

describe("Livestock — animal payload validation (client can never set user_id/role)", () => {
  test("accepts a valid animal and forces user_id from the argument", () => {
    const parsed = animalPayload(
      { earTag: "TN-0001", species: "dairy_cattle", gender: "female", weight: 480, breed: "Holstein" },
      USER,
    );
    expect("payload" in parsed).toBe(true);
    if ("payload" in parsed) {
      expect(parsed.payload.user_id).toBe(USER);
      expect(parsed.payload.ear_tag).toBe("TN-0001");
      expect(parsed.payload.current_weight_kg).toBe(480);
      expect(parsed.payload.currency).toBe("TND");
    }
  });

  test("ignores a client-supplied user_id in the body", () => {
    const parsed = animalPayload(
      { earTag: "TN-0002", species: "beef_cattle", gender: "male", user_id: "attacker" },
      USER,
    );
    if ("payload" in parsed) expect(parsed.payload.user_id).toBe(USER);
    else throw new Error("expected a payload");
  });

  test("rejects a missing ear tag", () => {
    expect(animalPayload({ species: "beef_cattle", gender: "male" }, USER)).toEqual({ error: "EAR_TAG_REQUIRED" });
  });

  test("rejects an unknown species", () => {
    expect(animalPayload({ earTag: "T", species: "dragon", gender: "male" }, USER)).toEqual({ error: "INVALID_SPECIES" });
  });

  test("rejects an invalid sex", () => {
    expect(animalPayload({ earTag: "T", species: "beef_cattle", gender: "other" }, USER)).toEqual({ error: "INVALID_SEX" });
  });

  test("rejects a non-positive weight", () => {
    expect(animalPayload({ earTag: "T", species: "beef_cattle", gender: "male", weight: -5 }, USER)).toEqual({ error: "INVALID_WEIGHT" });
  });

  test("rejects an invalid ISO birth date", () => {
    expect(animalPayload({ earTag: "T", species: "beef_cattle", gender: "male", birthDate: "31-12-2020" }, USER)).toEqual({ error: "INVALID_BIRTH_DATE" });
  });
});

describe("Livestock — honest not-computed states (no fabricated rations/pairings)", () => {
  function fakeRes() {
    const out: any = {};
    const res: any = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader(k: string, v: string) { this.headers[k] = v; return this; },
      set(k: string, v: string) { this.headers[k] = v; return this; },
      status(code: number) { this.statusCode = code; return this; },
      json(body: unknown) { out.body = body; return this; },
    };
    return { res, out };
  }

  test("breeding recommendations report GENETIC_DATA_REQUIRED, not a made-up pairing", async () => {
    const { res, out } = fakeRes();
    await getBreedingRecommendations({} as any, res);
    expect(out.body.computed).toBe(false);
    expect(out.body.isRealData).toBe(false);
    expect(out.body.reason).toBe("GENETIC_DATA_REQUIRED");
    expect(out.body.data).toEqual([]);
  });

  test("feed recommendations report NUTRITIONAL_PROFILE_REQUIRED", async () => {
    const { res, out } = fakeRes();
    await getFeedRecommendations({} as any, res);
    expect(out.body.computed).toBe(false);
    expect(out.body.reason).toBe("NUTRITIONAL_PROFILE_REQUIRED");
  });

  test("feed optimization requires a configured database (503), never invented numbers", async () => {
    unconfigured();
    const { res, out } = fakeRes();
    const req: any = { identitySource: "jwt", userId: USER, header: () => undefined, query: {} };
    await getLivestockDashboard(req, res);
    // No Supabase client configured => fail closed with an explicit code.
    expect([403, 503]).toContain(res.statusCode);
    expect(out.body.success).toBe(false);
    process.env = ORIGINAL;
  });
});

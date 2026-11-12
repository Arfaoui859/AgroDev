/**
 * Sensor endpoints — authorization and fail-closed behaviour.
 *
 * `GET /api/sensors` previously returned 503 unconditionally even though
 * `sensor_devices` / `sensor_readings` exist with owner-scoped RLS. It now
 * reads the caller's own devices and their latest readings. These tests pin
 * the safety contract: no verified session and no configured database must
 * never yield a success payload, and an empty registry is reported honestly
 * rather than back-filled with synthetic values.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { getSensors, getRealTimeData } from "../../server/routes/notifications";

const ORIGINAL = { ...process.env };

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

describe("Sensor API — authorization", () => {
  let app: express.Application;
  beforeAll(() => {
    unconfigured();
    app = createServer();
  });
  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("anonymous GET /api/sensors is denied (never a success payload)", async () => {
    const res = await request(app).get("/api/sensors");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
    expect(res.body.data ?? []).toEqual([]);
  });

  test("anonymous GET /api/real-time-data is denied", async () => {
    const res = await request(app).get("/api/real-time-data");
    expect([401, 403, 503]).toContain(res.status);
    expect(res.body.success).not.toBe(true);
  });
});

describe("Sensor API — fails closed without a configured database", () => {
  beforeEach(unconfigured);
  afterEach(() => { process.env = ORIGINAL; });

  test("getSensors returns 503 with an explicit code, never synthetic readings", async () => {
    const { res, out } = fakeRes();
    await getSensors({ identitySource: "jwt", userId: "u1", header: () => undefined } as any, res);
    expect(res.statusCode).toBe(503);
    expect(out.body.success).toBe(false);
    expect(out.body.code).toBe("SENSOR_REGISTRY_NOT_CONNECTED");
    expect(out.body.isRealData).toBe(false);
  });

  test("getRealTimeData returns 503 with an explicit code, never synthetic readings", async () => {
    const { res, out } = fakeRes();
    await getRealTimeData({ identitySource: "jwt", userId: "u1", header: () => undefined, query: {} } as any, res);
    expect(res.statusCode).toBe(503);
    expect(out.body.success).toBe(false);
    expect(out.body.code).toBe("SENSOR_STREAM_NOT_CONNECTED");
  });
});

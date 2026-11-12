/**
 * The pest-control, irrigation-optimization and weather-yield routers used to
 * return hand-written mock payloads while real Python microservices for the same
 * capabilities were running unused. These tests stand up a throwaway HTTP server
 * that mimics the microservice envelope and assert that:
 *
 *   1. the router actually forwards to the microservice (real network I/O), and
 *   2. the response is tagged with the provenance the service declares, so a
 *      synthetic/heuristic result is never presented as model inference.
 *
 * A second set asserts the honest-failure path: when the service is down the
 * router must return an error, never a fabricated success.
 */
import http from "node:http";
import express from "express";
import request from "supertest";
import { createServer } from "../../server/index";
import { resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

interface FakeService {
  url: string;
  close: () => Promise<void>;
  calls: string[];
}

/** Stand up a fake microservice. `health` shapes the /health provenance body. */
function startFakeService(
  handler: (path: string, method: string) => { status?: number; body: unknown },
  health: Record<string, unknown> = { status: "healthy", model_source: "synthetic-demo" },
): Promise<FakeService> {
  const calls: string[] = [];
  const server = http.createServer((req, res) => {
    const path = req.url ?? "/";
    calls.push(path);
    if (path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(health));
      return;
    }
    const { status = 200, body } = handler(path, req.method ?? "GET");
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        calls,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

describe("🛡️ Real microservice proxies (no mock payloads)", () => {
  let app: express.Application;
  const savedEnv: Record<string, string | undefined> = {};
  const ENV_KEYS = [
    "PEST_CONTROL_URL",
    "IRRIGATION_OPTIMIZATION_URL",
    "WEATHER_YIELD_INTELLIGENCE_URL",
  ];

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  afterEach(() => {
    resetServiceProbeCache();
  });

  test("pest analyze-problem refuses synthetic service output", async () => {
    const fake = await startFakeService((path) => ({
      body: { success: true, data: { pest_identification: { identified_pest: "aphids" }, marker: path } },
    }));
    process.env.PEST_CONTROL_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/analyze-problem")
      .send({ crop_type: "tomato", symptoms: ["أوراق مجعدة"] })
      .expect(503);

    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(fake.calls).not.toContain("/analyze-pest-problem");

    await fake.close();
  });

  test("pest severity does not proxy an unvalidated rule service", async () => {
    const fake = await startFakeService((path) => ({
      body: { success: true, data: { received_path: path } },
    }));
    process.env.PEST_CONTROL_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/assess-severity")
      .send({ pest_name: "aphids", affected_area_percentage: 40 })
      .expect(503);

    expect(res.body.success).toBe(false);
    expect(fake.calls.some((c) => c.startsWith("/assess-severity?"))).toBe(false);

    await fake.close();
  });

  test("irrigation optimize refuses unvalidated crop-water model output", async () => {
    const fake = await startFakeService(() => ({
      body: { success: true, data: { schedule: "real" } },
    }));
    process.env.IRRIGATION_OPTIMIZATION_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/irrigation-optimization/optimize")
      .send({ crop_type: "wheat", growth_stage: "vegetative" })
      .expect(503);

    expect(res.body.success).toBe(false);
    expect(fake.calls).not.toContain("/optimize-irrigation");

    await fake.close();
  });

  test("weather-plan refuses unvalidated yield model output", async () => {
    const fake = await startFakeService(() => ({
      body: { success: true, data: { seasonal_plan: "real" } },
    }));
    process.env.WEATHER_YIELD_INTELLIGENCE_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/weather-yield-intelligence/weather-plan")
      .send({ crop_options: ["wheat"] })
      .expect(503);

    expect(res.body.success).toBe(false);
    expect(fake.calls).not.toContain("/create-weather-plan");

    await fake.close();
  });

  test("a model service (not heuristic) is reported as real data", async () => {
    const fake = await startFakeService(
      () => ({ body: { success: true, data: { ok: true } } }),
      { status: "healthy", model_source: "trained-model-v2" },
    );
    process.env.PEST_CONTROL_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/analyze-problem")
      .send({ crop_type: "tomato" })
      .expect(200);

    expect(res.body.isRealData).toBe(true);
    expect(res.body.dataSource).toBe("microservice");

    await fake.close();
  });

  test("an unreachable microservice yields an honest error, not fake success", async () => {
    process.env.PEST_CONTROL_URL = "http://127.0.0.1:1";
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/analyze-problem")
      .send({ crop_type: "tomato" });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });
});

describe("🐛 Pest identification is honest rule-based, not a model", () => {
  let app: express.Application;
  const savedEnv: Record<string, string | undefined> = {};
  const ENV_KEYS = ["PEST_CONTROL_URL"];

  beforeAll(() => {
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  });

  afterAll(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  afterEach(() => {
    resetServiceProbeCache();
  });

  test("returns a rule-based identification labelled not-real-data", async () => {
    const fake = await startFakeService((path) =>
      path.startsWith("/identify-pest")
        ? {
            body: {
              success: true,
              data: {
                identification: {
                  identified_pest: "aphids",
                  pest_name_ar: "المن",
                  category: "حشرات",
                  identification_method: "symptom_based",
                  confidence_score: 0,
                },
              },
              model_source: "symptom-keyword-rules",
              message: "keyword match only; not a trained model",
            },
          }
        : { body: { success: true, data: {} } },
    );
    process.env.PEST_CONTROL_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/identify-from-symptoms")
      .send({ crop_type: "tomato", symptoms: ["أوراق مجعدة"] })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.pest_identification.identified_pest).toBe("aphids");
    // The keyword matcher is not calibrated: confidence is reported as 0 and
    // the result is never presented as model inference.
    expect(res.body.data.pest_identification.confidence_score).toBe(0);
    expect(res.body.dataSource).toBe("rule-based");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.modelSource).toBe("symptom-keyword-rules");
    expect(fake.calls).toContain("/identify-pest");

    await fake.close();
  });

  test("refuses without symptoms and never calls the service", async () => {
    const fake = await startFakeService(() => ({ body: { success: true, data: {} } }));
    process.env.PEST_CONTROL_URL = fake.url;
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/identify-from-symptoms")
      .send({ crop_type: "tomato", symptoms: [] })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe("SYMPTOMS_REQUIRED");
    expect(fake.calls).not.toContain("/identify-pest");

    await fake.close();
  });

  test("fails closed when the service is down instead of inventing a pest", async () => {
    process.env.PEST_CONTROL_URL = "http://127.0.0.1:1";
    app = createServer();

    const res = await request(app)
      .post("/api/pest-control/identify-from-symptoms")
      .send({ crop_type: "tomato", symptoms: ["أوراق مجعدة"] });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });
});

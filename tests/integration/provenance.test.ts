/**
 * Provenance-probe tests.
 *
 * A configured microservice URL is not proof that a trained model is running.
 * These tests boot real HTTP services that self-report their model source, and
 * assert the platform labels their output honestly:
 *   - /health with model_source "heuristic-demo"  -> engine "heuristic",
 *     isRealData false
 *   - /health with a real model source            -> engine "vision-model",
 *     isRealData true
 *   - no service reachable                        -> "unavailable"
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { probeService, resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

type Kind = "heuristic" | "trained" | "none";

let kind: Kind = "none";
let server: http.Server | undefined;
let visionUrl: string;
const savedEnv: Record<string, string | undefined> = {};

async function startRateLimitedService() {
  const srv = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(429, { "Content-Type": "application/json", "Retry-After": "30" });
      res.end(JSON.stringify({ error: "rate limited" }));
      return;
    }
    res.writeHead(404).end("{}");
  });
  await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
  return srv;
}

async function startService(reportedModelSource: string) {
  const srv = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          model_source: reportedModelSource,
        }),
      );
      return;
    }
    res.writeHead(404).end("{}");
  });
  await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
  return srv;
}

beforeAll(() => {
  savedEnv.IMAGE_DIAGNOSIS_URL = process.env.IMAGE_DIAGNOSIS_URL;
});

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
  resetServiceProbeCache();
});

afterAll(() => {
  if (savedEnv.IMAGE_DIAGNOSIS_URL === undefined) delete process.env.IMAGE_DIAGNOSIS_URL;
  else process.env.IMAGE_DIAGNOSIS_URL = savedEnv.IMAGE_DIAGNOSIS_URL;
});

describe("🔬 Microservice provenance probe", () => {
  let app: express.Application;

  test("HTTP 429 confirms host reachability but leaves model provenance unknown", async () => {
    server = await startRateLimitedService();
    visionUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const probe = await probeService(visionUrl);
    expect(probe.reachable).toBe(true);
    expect(probe.modelSource).toBeNull();
    expect(probe.heuristic).toBe(false);
  });
  beforeAll(() => {
    app = createServer();
  });

  test("heuristic-reporting service is not advertised as a trained model", async () => {
    server = await startService("heuristic-demo");
    visionUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.IMAGE_DIAGNOSIS_URL = visionUrl;
    resetServiceProbeCache();

    const response = await request(app)
      .get("/api/ai/plant-disease-detection")
      .expect(200);
    expect(response.body.microserviceReachable).toBe(true);
    expect(response.body.engine).toBe("heuristic");
    expect(response.body.isRealData).toBe(false);
    expect(response.body.modelSource).toBe("heuristic-demo");
  });

  test("trained-model-reporting service is advertised as model-powered", async () => {
    server = await startService("plantnet-v2");
    visionUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.IMAGE_DIAGNOSIS_URL = visionUrl;
    resetServiceProbeCache();

    const response = await request(app)
      .get("/api/ai/plant-disease-detection")
      .expect(200);
    expect(response.body.microserviceReachable).toBe(true);
    expect(response.body.engine).toBe("vision-model");
    expect(response.body.isRealData).toBe(true);
    expect(response.body.modelSource).toBe("plantnet-v2");
  });

  test("configured but unreachable service is unavailable, not fabricated", async () => {
    // Point at a port nothing is listening on.
    process.env.IMAGE_DIAGNOSIS_URL = "http://127.0.0.1:1";
    resetServiceProbeCache();

    const response = await request(app)
      .get("/api/ai/plant-disease-detection")
      .expect(200);
    expect(response.body.microserviceReachable).toBe(false);
    expect(response.body.available).toBe(false);
    expect(response.body.isRealData).toBe(false);
    expect(response.body.requiresConfiguration).toContain("not reachable");
  });

  test("capability catalogue never counts an unavailable engine as available", async () => {
    process.env.IMAGE_DIAGNOSIS_URL = "http://127.0.0.1:1";
    resetServiceProbeCache();
    const response = await request(app).get("/api/ai/capabilities").expect(200);
    const vision = response.body.capabilities.find(
      (c: { id: string }) => c.id === "plant-disease-detection",
    );
    expect(vision.engine).toBe("unavailable");
    expect(response.body.summary.available).toBeLessThan(response.body.summary.total);
  });
});

/**
 * Every AI endpoint must answer the same provenance questions: where the
 * result came from (`dataSource`), whether it is real inference
 * (`isRealData`) and which engine produced it (`modelSource`). The UI relies
 * on these fields to label results, so a missing flag silently reads as
 * "real" to any consumer that checks `isRealData !== false`.
 */
describe("🏷️ Uniform provenance contract across AI endpoints", () => {
  let app: express.Application;
  const saved: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ["SOIL_ANALYSIS_URL", "CROP_RECOMMENDATION_URL"]) {
      saved[key] = process.env[key];
      process.env[key] = "http://127.0.0.1:1";
    }
    app = createServer();
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  test("soil analysis does not substitute a heuristic result when the service is down", async () => {
    const res = await request(app)
      .post("/api/ai/soil/analyze")
      .send({ sensor_data: { ph: 6.5, nitrogen: 40, phosphorus: 20, potassium: 150 } })
      .expect(503);
    expect(res.body.success).toBe(false);
  });

  test("crop recommendation refuses unvalidated inference", async () => {
    const res = await request(app)
      .post("/api/ai/crops/recommend")
      .send({ ph: 7, temperature: 22, rainfall: 450, season: "winter" })
      .expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.recommendations).toBeUndefined();
  });

  test("assistant states it is not real inference when no LLM is configured", async () => {
    const res = await request(app)
      .post("/api/ai/assistant/chat")
      .send({ message: "كيف أحسن محصول الطماطم؟", language: "ar" })
      .expect(200);
    expect(res.body.dataSource).toBe("rule-based");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.modelSource).toBe("rule-based-engine");
  });
});

describe("marketplace and supply-chain persistence requirements", () => {
  let app: express.Express;
  beforeAll(async () => { app = createServer(); });

  it.each([
    "/api/marketplace/listings",
    "/api/marketplace/inquiries",
    "/api/marketplace/analytics",
    "/api/supply-chain/nodes",
  ])("%s fails closed without persisted marketplace data", async (path) => {
    const res = await request(app).get(path).expect(503);
    expect(res.body.success).toBe(false);
    expect(res.body.dataAvailable).toBe(false);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.code).toBe(path.includes("supply-chain") ? "SUPPLY_CHAIN_STORE_NOT_CONNECTED" : "MARKETPLACE_STORE_NOT_CONNECTED");
  });
});

/**
 * The agronomist dashboard renders supervised farms, disease analyses, training
 * programmes and expert metrics. AgroGrowth has no agronomist database wired
 * yet, so those are a seeded demonstration dataset. The UI must be able to tell
 * that apart from real records, otherwise a hardcoded "24 active farms" reads
 * as live production data.
 */
describe("agronomist dashboard requires verified farm records", () => {
  let app: express.Express;
  beforeAll(() => { app = createServer(); });

  it.each([
    "/api/agronomist-dashboard/overview",
    "/api/agronomist-dashboard/farms",
    "/api/agronomist-dashboard/disease-analyses",
    "/api/agronomist-dashboard/training-programs",
    "/api/agronomist-dashboard/performance-analysis",
    "/api/agronomist-dashboard/metrics",
  ])("%s does not return seeded demonstration figures", async (path) => {
    const res = await request(app).get(path).expect(503);
    expect(res.body.code).toBe("DASHBOARD_DATA_SOURCE_NOT_CONNECTED");
    expect(res.body.data).toBeNull();
  });
});

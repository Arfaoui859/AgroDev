/**
 * Microservice reachability reporting.
 *
 * A configured service URL is not proof that a model is running behind it.
 * `resolveEngine()` probes the service's own /health and reports
 * `microserviceReachable` + the provenance the service declares, so the SPA
 * never enables a feature on the strength of an env var alone.
 *
 * A throwaway HTTP server stands in for the microservice: it is real network
 * I/O, not a mocked module.
 */
import http from "node:http";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

function startFakeService(
  body: Record<string, unknown>,
  status = 200,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((_req, res) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

describe("🔎 AI capability reachability reflects the live service", () => {
  let app: express.Application;
  const savedEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of ["SOIL_ANALYSIS_URL", "CROP_RECOMMENDATION_URL"]) {
      savedEnv[key] = process.env[key];
    }
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  afterEach(() => {
    resetServiceProbeCache();
  });

  test("a reachable service is reported with the provenance it declares", async () => {
    const fake = await startFakeService({
      status: "healthy",
      model_source: "synthetic-demo",
    });
    process.env.SOIL_ANALYSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app).get("/api/ai/soil-analysis").expect(200);
    expect(res.body.microserviceConfigured).toBe(true);
    expect(res.body.microserviceReachable).toBe(true);
    expect(res.body.modelSource).toBe("synthetic-demo");
    // Synthetic provenance must never be presented as a trained model.
    expect(res.body.isRealData).toBe(false);

    await fake.close();
  });

  test("an unreachable service is reported as not reachable, with its fallback engine", async () => {
    process.env.SOIL_ANALYSIS_URL = "http://127.0.0.1:1";
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app).get("/api/ai/soil-analysis").expect(200);
    expect(res.body.microserviceConfigured).toBe(true);
    expect(res.body.microserviceReachable).toBe(false);
    // Declared fallback is the in-process rule-based engine, which stays usable.
    expect(res.body.engine).toBe("rule-based");
    expect(res.body.available).toBe(true);
    expect(res.body.isRealData).toBe(false);
  });

  test("a vision service that self-reports heuristic inference is not called a model", async () => {
    const fake = await startFakeService({
      status: "healthy",
      model_source: "heuristic-demo",
    });
    process.env.SOIL_ANALYSIS_URL = "http://127.0.0.1:1";
    process.env.CROP_RECOMMENDATION_URL = "http://127.0.0.1:1";
    process.env.IMAGE_DIAGNOSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app)
      .get("/api/ai/plant-disease-detection")
      .expect(200);
    expect(res.body.microserviceReachable).toBe(true);
    expect(res.body.engine).toBe("heuristic");
    expect(res.body.isRealData).toBe(false);

    delete process.env.IMAGE_DIAGNOSIS_URL;
    await fake.close();
  });

  test("trained lab soil models are reported available only when the service declares loadable models", async () => {
    const fake = await startFakeService({
      status: "healthy",
      model_source: "deterministic-rules",
      // Matches the real soil service /health shape: the lab artifacts are
      // available to load, so metadata_ready is true.
      lab_assisted: { loaded: false, metadata_ready: true, expected_models: 7 },
    });
    process.env.SOIL_ANALYSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app)
      .get("/api/ai/capabilities/lab-soil-models")
      .expect(200);
    expect(res.body.available).toBe(true);
    expect(res.body.engine).toBe("microservice");
    expect(res.body.microserviceReachable).toBe(true);

    await fake.close();
  });

  test("lab soil models are unavailable when the service loads no trained models", async () => {
    const fake = await startFakeService({
      status: "healthy",
      model_source: "deterministic-rules",
      lab_assisted: { loaded: false, metadata_ready: false, models_available: 0, expected_models: 7 },
    });
    process.env.SOIL_ANALYSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app)
      .get("/api/ai/capabilities/lab-soil-models")
      .expect(200);
    // Reachable host, but no trained model is loaded: never advertise one.
    expect(res.body.available).toBe(false);
    expect(res.body.engine).toBe("unavailable");

    await fake.close();
  });

  test("a rate-limited (HTTP 429) vision host is never advertised as a live model", async () => {
    // A 429 proves the host answered, but not that any model is running. The
    // capability must stay unavailable with unverified provenance instead of
    // being reported as a working vision model.
    const savedLlm: Record<string, string | undefined> = {};
    for (const k of ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL", "GEMINI_API_KEY", "OPENAI_API_KEY"]) {
      savedLlm[k] = process.env[k];
      delete process.env[k];
    }
    const fake = await startFakeService({ detail: "rate limited" }, 429);
    process.env.IMAGE_DIAGNOSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app)
      .get("/api/ai/capabilities/plant-disease-detection")
      .expect(200);
    expect(res.body.microserviceReachable).toBe(true);
    expect(res.body.provenanceUnverified).toBe(true);
    expect(res.body.available).toBe(false);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.engine).toBe("unavailable");

    for (const [k, v] of Object.entries(savedLlm)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    await fake.close();
  });

  test("a pest-control host that declares no provenance is not advertised as a live model", async () => {
    const fake = await startFakeService({ status: "healthy" });
    process.env.PEST_CONTROL_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();

    const res = await request(app)
      .get("/api/ai/capabilities/pest-control")
      .expect(200);
    expect(res.body.microserviceReachable).toBe(true);
    expect(res.body.provenanceUnverified).toBe(true);
    expect(res.body.available).toBe(false);
    expect(res.body.isRealData).toBe(false);

    delete process.env.PEST_CONTROL_URL;
    await fake.close();
  });
});

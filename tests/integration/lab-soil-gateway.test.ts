/**
 * Laboratory-assisted soil prediction gateway.
 *
 * The soil microservice ships seven *genuinely trained* models fitted on the
 * iSDA wet-chemistry reference dataset. Its generic /health reports
 * `model_source: "deterministic-rules"` for the separate rule analyzer, so the
 * shared provenance gate in `respondFromMicroservice` (correctly) rejects the
 * rule engine — but the lab models are a distinct, verifiable capability that
 * must still be reachable.
 *
 * These tests stand up a throwaway HTTP server that mimics the microservice and
 * assert that:
 *   1. the gateway forwards the caller's lab values to `/predict-lab-soil`,
 *   2. the response is tagged as model inference (never as measured data), and
 *   3. malformed input is rejected before any network call is made.
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
  lastBody: any;
}

function startFakeSoilService(): Promise<FakeService> {
  const calls: string[] = [];
  const state = { lastBody: null as any };
  const server = http.createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];
    calls.push(path);
    if (path === "/health") {
      // The rule analyzer self-reports deterministic-rules; the lab models are
      // a separate capability and must not be blocked by this.
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", model_source: "deterministic-rules" }));
      return;
    }
    if (path === "/lab-models/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ready",
          models_loaded: 0,
          models_available: 7,
          expected_models: 7,
          prediction_scope: "lab_assisted_only",
          field_validated: false,
        }),
      );
      return;
    }
    if (path === "/predict-lab-soil") {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        state.lastBody = JSON.parse(raw || "{}");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            prediction_scope: "lab_assisted_only",
            field_validated: false,
            tunisia_validated: false,
            models: {
              ph: { status: "predicted", prediction: 6.68, coverage: 1, metrics: { r2: 0.52 } },
              carbon_organic: { status: "predicted", prediction: 14.3, coverage: 1 },
            },
          }),
        );
      });
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        calls,
        get lastBody() {
          return state.lastBody;
        },
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

describe("🧪 Lab-assisted soil gateway", () => {
  let app: express.Application;
  let fake: FakeService;
  const savedUrl = process.env.SOIL_ANALYSIS_URL;

  beforeAll(async () => {
    fake = await startFakeSoilService();
    process.env.SOIL_ANALYSIS_URL = fake.url;
    resetServiceProbeCache();
    app = createServer();
  });

  afterAll(async () => {
    if (savedUrl === undefined) delete process.env.SOIL_ANALYSIS_URL;
    else process.env.SOIL_ANALYSIS_URL = savedUrl;
    resetServiceProbeCache();
    await fake.close();
  });

  test("forwards lab values to the real model and tags the result honestly", async () => {
    const res = await request(app)
      .post("/api/ai/soil/predict-lab")
      .send({ lab_values: { ph: 7.1, carbon_organic: 12.5 } })
      .expect(200);

    expect(fake.calls).toContain("/predict-lab-soil");
    expect(fake.lastBody).toEqual({ lab_values: { ph: 7.1, carbon_organic: 12.5 } });
    expect(res.body.success).toBe(true);
    expect(res.body.dataSource).toBe("trained-model-inference");
    // Model inference is never a measured/field-validated result.
    expect(res.body.isRealData).toBe(false);
    expect(res.body.fieldValidated).toBe(false);
    expect(res.body.data.models.ph.prediction).toBeCloseTo(6.68, 2);
  });

  test("rejects non-numeric lab values before calling the service", async () => {
    const before = fake.calls.length;
    const res = await request(app)
      .post("/api/ai/soil/predict-lab")
      .send({ lab_values: { ph: "high" } })
      .expect(400);
    expect(res.body.code).toBe("INVALID_LAB_VALUES");
    expect(fake.calls.length).toBe(before);
  });

  test("rejects an empty or unknown-only payload", async () => {
    await request(app)
      .post("/api/ai/soil/predict-lab")
      .send({ lab_values: {} })
      .expect(400);
    await request(app)
      .post("/api/ai/soil/predict-lab")
      .send({ lab_values: { not_an_analyte: 3 } })
      .expect(400);
  });

  test("drops unknown fields but keeps the recognised ones", async () => {
    const res = await request(app)
      .post("/api/ai/soil/predict-lab")
      .send({ lab_values: { ph: 6.9, bogus_field: 1 } })
      .expect(200);
    expect(fake.lastBody).toEqual({ lab_values: { ph: 6.9 } });
    expect(res.body.rejectedInputFields).toContain("bogus_field");
  });

  test("exposes lab model metadata without loading artifacts", async () => {
    const res = await request(app).get("/api/ai/soil/lab-models").expect(200);
    expect(res.body.data.expected_models).toBe(7);
    expect(res.body.data.field_validated).toBe(false);
  });
});

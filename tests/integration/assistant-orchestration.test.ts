/**
 * Assistant chat orchestration integration test.
 *
 * The chat endpoint must expose the multi-agent orchestration it performed:
 * the specialists it used, and a structured per-step trace with a plan,
 * provenance and honest status per step. This boots the real Express app.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("POST /api/ai/assistant/chat — multi-agent orchestration", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  test("returns an orchestration trace with a plan and per-step provenance", async () => {
    const response = await request(app)
      .post("/api/ai/assistant/chat")
      .send({
        message: "ما أفضل محصول لتربة pH 6.5 مع أمطار قليلة وكيف أسقي؟",
        language: "ar",
      })
      .expect(200);

    expect(Array.isArray(response.body.usedSpecialists)).toBe(true);
    expect(response.body.orchestrationTrace).toBeTruthy();
    const trace = response.body.orchestrationTrace;
    expect(Array.isArray(trace.plan)).toBe(true);
    expect(trace.plan.length).toBeGreaterThan(0);
    expect(trace.steps.length).toBe(trace.plan.length);
    for (const step of trace.steps) {
      expect(step).toHaveProperty("id");
      expect(step).toHaveProperty("status");
      expect(step).toHaveProperty("dataSource");
      expect(typeof step.isRealData).toBe("boolean");
    }
  });

  test("a pest-control question never yields an invented product", async () => {
    const response = await request(app)
      .post("/api/ai/assistant/chat")
      .send({ message: "أي مبيد أستعمل لمكافحة الحشرة؟", language: "ar" })
      .expect(200);

    const pest = (response.body.orchestrationTrace?.steps ?? []).find(
      (s: any) => s.id === "pest_control",
    );
    expect(pest).toBeTruthy();
    expect(pest.status).toBe("insufficient_input");
    expect(pest.findings).toEqual([]);
  });

  test("runs the trained lab models when the caller supplies analytes", async () => {
    const http = await import("node:http");
    const server = http.createServer((req, res) => {
      if ((req.url ?? "").startsWith("/predict-lab-soil")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            prediction_scope: "lab_assisted_only",
            field_validated: false,
            models: {
              ph: { status: "predicted", prediction: 6.68, coverage: 1, metrics: { r2: 0.52 } },
            },
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });
    const url = await new Promise<string>((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        const addr = server.address() as { port: number };
        resolve(`http://127.0.0.1:${addr.port}`);
      });
    });
    const saved = process.env.SOIL_ANALYSIS_URL;
    process.env.SOIL_ANALYSIS_URL = url;
    try {
      const response = await request(app)
        .post("/api/ai/assistant/chat")
        .send({
          message: "حلّل هذه القيم المخبرية للتربة",
          language: "ar",
          lab_values: { ph: 7.0, carbon_organic: 12 },
        })
        .expect(200);

      const labStep = (response.body.orchestrationTrace?.steps ?? []).find(
        (s: any) => s.id === "lab_soil",
      );
      expect(labStep).toBeTruthy();
      expect(labStep.dataSource).toBe("trained-model-inference");
      // Model inference is never presented as a measured observation.
      expect(labStep.isRealData).toBe(false);
      expect(response.body.usedSpecialists).toContain("lab_soil");
      expect(response.body.trainedModelSpecialists).toContain("lab_soil");
    } finally {
      if (saved === undefined) delete process.env.SOIL_ANALYSIS_URL;
      else process.env.SOIL_ANALYSIS_URL = saved;
      await new Promise<void>((done) => server.close(() => done()));
    }
  });
});

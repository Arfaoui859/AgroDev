/**
 * Regression tests for the adaptive-AI module honesty contract.
 *
 * `/api/ai/models`, `/api/ai/insights`, `/api/ai/behavior-data`,
 * `/api/ai/recommendations` and `/api/ai/feedback` serve a catalogue of
 * synthesised figures. They must be labelled simulated (header + body) so the
 * SPA can disclose them, and the model-training trigger must not fake a
 * started job.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

describe("🧠 Adaptive-AI endpoints declare their provenance", () => {
  const simulated = [
    "/api/ai/models",
    "/api/ai/insights",
    "/api/ai/behavior-data",
    "/api/ai/recommendations",
    "/api/ai/feedback",
  ];

  test.each(simulated)("%s is labelled simulated", async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.headers["x-data-provenance"]).toBe("simulated");
    expect(res.headers["x-is-real-data"]).toBe("false");
    expect(res.body.dataSource).toBe("simulated");
    expect(res.body.isRealData).toBe(false);
    expect(typeof res.body.disclaimer).toBe("string");
    expect(res.body.disclaimer.length).toBeGreaterThan(0);
  });

  test("feedback submission is accepted but not claimed as persisted", async () => {
    const res = await request(app)
      .post("/api/ai/feedback")
      .send({ rating: 5, comment: "great" });
    expect(res.status).toBe(200);
    expect(res.body.persisted).toBe(false);
    expect(res.headers["x-data-provenance"]).toBe("session");
  });

  test("model training reports 501 instead of a fake job id", async () => {
    const res = await request(app)
      .post("/api/ai/models/model_crop_pred_v3/train")
      .send({ trainingConfig: {} });
    expect(res.status).toBe(501);
    expect(res.body.success).toBe(false);
    expect(res.body.trainingJobId).toBeUndefined();
  });
});

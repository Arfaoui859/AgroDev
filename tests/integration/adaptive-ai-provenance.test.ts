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

describe("🧠 Adaptive-AI endpoints fail closed without persisted telemetry", () => {
  const paths = [
    "/api/ai/models",
    "/api/ai/insights",
    "/api/ai/behavior-data",
    "/api/ai/recommendations",
    "/api/ai/feedback",
  ];

  test.each(paths)("%s does not return generated analytics", async (path) => {
    const response = await request(app).get(path).expect(503);
    expect(response.body.code).toBe("ADAPTIVE_AI_DATA_NOT_CONNECTED");
    expect(response.body.dataAvailable).toBe(false);
  });

  test("feedback submission is not accepted without a persistent store", async () => {
    const response = await request(app)
      .post("/api/ai/feedback")
      .send({ rating: 5, comment: "great" })
      .expect(503);
    expect(response.body.code).toBe("ADAPTIVE_AI_DATA_NOT_CONNECTED");
  });

  test("model training reports 501 instead of a fake job id", async () => {
    const response = await request(app)
      .post("/api/ai/models/model_crop_pred_v3/train")
      .send({ trainingConfig: {} })
      .expect(501);
    expect(response.body.success).toBe(false);
    expect(response.body.trainingJobId).toBeUndefined();
  });
});

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
});

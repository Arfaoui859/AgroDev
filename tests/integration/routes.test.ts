/**
 * Route-mount regression tests.
 *
 * Several fully-implemented routers existed in server/routes/ but were never
 * registered on the Express app, so every client call to them returned a 404.
 * These tests assert that each client-facing module is actually reachable, and
 * that the newer modules honestly flag their demonstration data.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🧭 Route mounting regressions", () => {
  let app: express.Application;

  beforeAll(() => {
    app = createServer();
  });

  const mountedRoutes: [string, string][] = [
    ["/api/digital-transformation", "/projects"],
    ["/api/emergency-response", "/plans"],
    ["/api/emerging-tech", "/technologies"],
    ["/api/ip-management", "/patents"],
    ["/api/smart-advisor", "/context"],
    ["/api/digital-training", "/courses"],
    ["/api/predictive-analytics", "/models"],
    ["/api/risk-detection", "/alerts"],
  ];

  test.each(mountedRoutes)("%s%s responds (not 404)", async (prefix, path) => {
    const response = await request(app).get(`${prefix}${path}`);
    expect(response.status).not.toBe(404);
  });

  test("digital-training exposes the catalogue the client loads", async () => {
    const courses = await request(app).get("/api/digital-training/courses").expect(200);
    expect(Array.isArray(courses.body)).toBe(true);
    expect(courses.body.length).toBeGreaterThan(0);
    expect(courses.body[0]).toHaveProperty("id");
    expect(courses.body[0]).toHaveProperty("level");

    const enrollments = await request(app)
      .get("/api/digital-training/enrollments")
      .expect(200);
    expect(Array.isArray(enrollments.body)).toBe(true);
  });

  test("digital-training enrollment lifecycle persists progress", async () => {
    const created = await request(app)
      .post("/api/digital-training/enrollments")
      .send({ courseId: "course-soil-health", userId: "user-test" })
      .expect(201);
    expect(created.body).toHaveProperty("id");

    const updated = await request(app)
      .patch(`/api/digital-training/enrollments/${created.body.id}/progress`)
      .send({ progress: 100 })
      .expect(200);
    expect(updated.body.progress).toBe(100);
    expect(updated.body.status).toBe("completed");
  });

  test("digital-training rejects invalid progress values", async () => {
    const created = await request(app)
      .post("/api/digital-training/enrollments")
      .send({ courseId: "course-irrigation-101", userId: "user-bad" })
      .expect(201);

    await request(app)
      .patch(`/api/digital-training/enrollments/${created.body.id}/progress`)
      .send({ progress: 250 })
      .expect(400);
  });

  test("predictive analytics refuses unvalidated model registry and inference", async () => {
    const models = await request(app).get("/api/predictive-analytics/models").expect(503);
    expect(models.body.code).toBe("PREDICTIVE_MODELS_NOT_VALIDATED");
    expect(models.body.data).toBeNull();

    const prediction = await request(app)
      .post("/api/predictive-analytics/models/model-yield-1/predict")
      .send({ input_data: { rainfall: 300 } })
      .expect(503);
    expect(prediction.body.code).toBe("PREDICTIVE_MODELS_NOT_VALIDATED");
  });

  test("risk detection does not expose synthetic alerts or impact values", async () => {
    for (const path of [
      "/api/risk-detection/alerts",
      "/api/risk-detection/weather-risks",
      "/api/risk-detection/diseases",
      "/api/risk-detection/market-risks",
      "/api/risk-detection/sensors",
    ]) {
      const response = await request(app).get(path).expect(503);
      expect(response.body.code).toBe("RISK_FEEDS_NOT_VERIFIED");
      expect(response.body.data).toBeNull();
    }
    const action = await request(app)
      .post("/api/risk-detection/alerts/risk-1/acknowledge")
      .expect(503);
    expect(action.body.code).toBe("RISK_FEEDS_NOT_VERIFIED");
  });

  test("smart-advisor serves the context feeds the client requests", async () => {
    for (const path of [
      "/api/smart-advisor/context",
      "/api/smart-advisor/recommendations",
      "/api/smart-advisor/market-data",
      "/api/smart-advisor/weather",
      "/api/smart-advisor/soil-analysis",
      "/api/smart-advisor/chat-history",
    ]) {
      const response = await request(app).get(path);
      expect(response.status).not.toBe(404);
    }
  });
});

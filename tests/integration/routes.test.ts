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

  test("predictive-analytics lists models and refuses fake training", async () => {
    const models = await request(app).get("/api/predictive-analytics/models").expect(200);
    expect(Array.isArray(models.body)).toBe(true);

    const train = await request(app)
      .post(`/api/predictive-analytics/models/${models.body[0].id}/train`)
      .expect(501);
    expect(train.body.isRealData).toBe(false);
  });

  test("predictive-analytics predict requires input and never fabricates", async () => {
    await request(app)
      .post("/api/predictive-analytics/models/model-yield-1/predict")
      .send({ input_data: {} })
      .expect(400);

    const response = await request(app)
      .post("/api/predictive-analytics/models/model-yield-1/predict")
      .send({ input_data: { rainfall: 300 } })
      .expect(503);
    expect(response.body.isRealData).toBe(false);
  });

  test("risk-detection exposes all feeds and supports alert actions", async () => {
    const alerts = await request(app).get("/api/risk-detection/alerts").expect(200);
    expect(Array.isArray(alerts.body)).toBe(true);
    expect(alerts.body.length).toBeGreaterThan(0);

    await request(app).get("/api/risk-detection/weather-risks").expect(200);
    await request(app).get("/api/risk-detection/diseases").expect(200);
    await request(app).get("/api/risk-detection/market-risks").expect(200);
    await request(app).get("/api/risk-detection/sensors").expect(200);

    const alertId = alerts.body[0].id;
    const ack = await request(app)
      .post(`/api/risk-detection/alerts/${alertId}/acknowledge`)
      .expect(200);
    expect(ack.body.success).toBe(true);

    const esc = await request(app)
      .post(`/api/risk-detection/alerts/${alertId}/escalate`)
      .expect(200);
    expect(esc.body.alert.status).toBe("escalated");
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

/**
 * The AI gateway must translate UI payloads into the exact shapes the Python
 * microservices declare, otherwise Pydantic answers 422 and every request
 * silently degrades to the rule-based fallback while the UI still shows a
 * plausible-looking result.
 *
 * These tests pin the outbound request contract by mocking axios, so they do
 * not require the Python services to be running.
 */
import express from "express";
import request from "supertest";

const sentConfigs: any[] = [];

jest.mock("axios", () => {
  const callable: any = jest.fn(async (config: any) => {
    sentConfigs.push(config);
    return { data: { ok: true }, status: 200 };
  });
  callable.__esModule = true;
  callable.default = callable;
  callable.post = callable;
  return callable;
});

const { createServer } = require("../../server/index");

let app: express.Application;

beforeAll(() => {
  app = createServer();
});

beforeEach(() => {
  sentConfigs.length = 0;
});

const lastRequest = () => sentConfigs[sentConfigs.length - 1];

describe("🔌 AI gateway → microservice request contracts", () => {
  test("soil analysis drops a place-name location instead of sending a string", async () => {
    await request(app)
      .post("/api/ai/soil/analyze")
      .send({ sensor_data: { ph: 6.5 }, location: "Sfax" });

    const req = lastRequest();
    expect(req.url).toContain("/analyze-soil");
    expect(req.data.sensor_data).toEqual({ ph: 6.5 });
    // A string location makes Pydantic answer 422.
    expect(req.data.location).toBeUndefined();
  });

  test("soil analysis forwards real GPS coordinates", async () => {
    await request(app)
      .post("/api/ai/soil/analyze")
      .send({
        sensor_data: { ph: 6.5 },
        location: { latitude: 34.7, longitude: 10.7 },
      });

    expect(lastRequest().data.location).toEqual({
      latitude: 34.7,
      longitude: 10.7,
    });
  });

  test("crop recommendation renames rainfall→annual_rainfall and ph→soil_ph", async () => {
    await request(app)
      .post("/api/ai/crops/recommend")
      .send({
        ph: 6.5,
        temperature: 24,
        rainfall: 350,
        soil_quality_score: 0.7,
        water_availability: 0.8,
        target_market_price: 2.5,
        farmer_experience_years: 5,
        available_capital: 5000,
        area_hectares: 2,
        risk_tolerance: 0.5,
      });

    const req = lastRequest();
    expect(req.url).toContain("/recommend-crops");
    expect(req.data.soil_ph).toBe(6.5);
    expect(req.data.annual_rainfall).toBe(350);
    expect(req.data.temperature).toBe(24);
    expect(req.data.farm_size).toBe(2);
  });

  test("market forecast hits /forecast-price with the required fields", async () => {
    await request(app)
      .post("/api/ai/market/forecast-prices")
      .send({ crop: "olive", price: 8.5 });

    const req = lastRequest();
    // "/forecast-prices" does not exist on the service; the real path is singular.
    expect(req.url).toContain("/forecast-price");
    expect(req.url).not.toContain("/forecast-prices");
    expect(req.data.crop_type).toBe("olive");
    expect(req.data.current_price).toBe(8.5);
    expect(req.data.forecast_days).toBe(30);
  });

  test("farming task planning uses the real /plan-season endpoint", async () => {
    await request(app)
      .post("/api/ai/assistant/generate-tasks")
      .send({ crop_type: "wheat", field_id: "f1", planting_date: "2026-11-01", field_area: 2 });

    const req = lastRequest();
    expect(req.url).toContain("/plan-season");
    expect(req.url).not.toContain("/generate-tasks");
    expect(req.data).toMatchObject({
      crop_type: "wheat",
      field_id: "f1",
      planting_date: "2026-11-01",
      field_area: 2,
    });
  });

  test("task planning accepts the camelCase aliases the UI uses", async () => {
    await request(app)
      .post("/api/ai/assistant/generate-tasks")
      .send({ crop: "olive", fieldId: "f2", plantingDate: "2026-12-01", area: 3.5 });

    expect(lastRequest().data).toMatchObject({
      crop_type: "olive",
      field_id: "f2",
      planting_date: "2026-12-01",
      field_area: 3.5,
    });
  });

  test("crop comparison wraps the list in crops_data (the service's shape)", async () => {
    await request(app)
      .post("/api/ai/crops/compare")
      .send({ crops_data: [{ crop_name: "olive", farm_size: 3 }] });

    const req = lastRequest();
    expect(req.url).toContain("/compare-crops");
    // A bare list makes Pydantic answer 422; the service wants {crops_data: [...]}.
    expect(Array.isArray(req.data.crops_data)).toBe(true);
    expect(req.data.crops_data[0]).toMatchObject({
      crop_name: "olive",
      farm_size: 3,
    });
  });

  test("crop comparison accepts a bare crops list and normalises names", async () => {
    await request(app)
      .post("/api/ai/crops/compare")
      .send({ crops: [{ crop: "wheat", farm_size: 2 }] });

    expect(lastRequest().data.crops_data[0]).toMatchObject({
      crop_name: "wheat",
      farm_size: 2,
    });
  });

  test("crop comparison answers 400, not a silent 422, when nothing is comparable", async () => {
    const res = await request(app).post("/api/ai/crops/compare").send({});
    expect(res.status).toBe(400);
    expect(sentConfigs.length).toBe(0);
  });

  test("task planning answers 400 with the missing fields, not a Pydantic 422", async () => {
    const res = await request(app)
      .post("/api/ai/assistant/generate-tasks")
      .send({ crop: "olive" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/field_id/);
    expect(sentConfigs.length).toBe(0);
  });

  test("multi-agent orchestration forwards explicit tool inputs to the Intelligent Agent", async () => {
    await request(app)
      .post("/api/ai/assistant/orchestrate")
      .send({
        message: "Analyze my soil",
        language: "ar-tn",
        max_agents: 2,
        tool_inputs: { "soil.analyze": { sensor_data: { ph: 6.5 } } },
      });

    const req = lastRequest();
    expect(req.url).toContain("/orchestrate");
    expect(req.data).toMatchObject({
      message: "Analyze my soil",
      language: "ar-tn",
      max_agents: 2,
      tool_inputs: { "soil.analyze": { sensor_data: { ph: 6.5 } } },
    });
    expect(req.timeout).toBe(90000);
  });

  test("multi-agent image upload is converted to the private tool input", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    await request(app)
      .post("/api/ai/assistant/orchestrate")
      .field("message", "Diagnose this leaf disease")
      .field("language", "en")
      .field("user_context", JSON.stringify({ region: "Siliana" }))
      .field("tool_inputs", JSON.stringify({ "image.detect_disease": { plant_type: "tomato" } }))
      .field("max_agents", "2")
      .attach("file", png, { filename: "leaf.png", contentType: "image/png" });

    const req = lastRequest();
    expect(req.url).toContain("/orchestrate");
    expect(req.data.tool_inputs["image.detect_disease"]).toMatchObject({
      plant_type: "tomato",
      image_base64: png.toString("base64"),
    });
    expect(req.data.user_context).toEqual({ region: "Siliana" });
    expect(req.data.max_agents).toBe(2);
  });

  test("supply-demand forwards the fields the service requires", async () => {
    await request(app)
      .post("/api/ai/market/supply-demand")
      .send({ crop: "tomato", production: 1200 });

    const req = lastRequest();
    expect(req.url).toContain("/analyze-supply-demand");
    expect(req.data).toMatchObject({
      crop_type: "tomato",
      current_production: 1200,
      region: "tunisia",
      analysis_period: 30,
    });
  });
});

describe("📈 Market gateway validates before proxying", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("forecast-prices rejects a missing current_price with a clear 400", async () => {
    const res = await request(app)
      .post("/api/ai/market/forecast-prices")
      .send({ crop: "olive" });
    expect(res.status).toBe(400);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.message).toMatch(/current_price/);
  });

  test("supply-demand rejects a missing production with a clear 400", async () => {
    const res = await request(app)
      .post("/api/ai/market/supply-demand")
      .send({ crop: "olive" });
    expect(res.status).toBe(400);
    expect(res.body.isRealData).toBe(false);
    expect(res.body.message).toMatch(/current_production/);
  });
});

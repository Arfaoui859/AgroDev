/**
 * Vision-gateway forwarding tests.
 *
 * The image-diagnosis UI used to generate its "analysis" in the browser with
 * Math.random(); the four handlers now POST the real image to
 * /api/ai/images/{detect-disease,analyze-leaf,analyze-plant,quick-health-check},
 * which forward multipart form data to the configured vision service.
 *
 * These tests boot a fake vision service, point IMAGE_DIAGNOSIS_URL at it, and
 * assert the gateway forwards the image and optional fields, tags the response
 * with honest provenance, and never fabricates a diagnosis when the service is
 * down.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";
import { resetServiceProbeCache } from "../../server/services/providers/serviceProbe";

let upstream: http.Server | undefined;
let visionUrl: string;
const received: Array<{ url: string; contentType: string; body: string }> = [];
const savedEnv: Record<string, string | undefined> = {};

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function startVisionService() {
  const srv = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "healthy", model_source: "heuristic-demo" }));
        return;
      }
      received.push({
        url: req.url ?? "",
        contentType: req.headers["content-type"] ?? "",
        body,
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          disease_detection: {
            primary_disease: { disease: "early_blight", disease_name_ar: "اللفحة المبكرة" },
            top_predictions: [],
          },
          severity_assessment: { severity_level: "medium" },
          health_score: { health_score: 62.5 },
        }),
      );
    });
  });
  await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
  return srv;
}

beforeAll(async () => {
  savedEnv.IMAGE_DIAGNOSIS_URL = process.env.IMAGE_DIAGNOSIS_URL;
  upstream = await startVisionService();
  visionUrl = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`;
  process.env.IMAGE_DIAGNOSIS_URL = visionUrl;
  resetServiceProbeCache();
});

afterAll(async () => {
  if (upstream) await new Promise<void>((r) => upstream!.close(() => r()));
  if (savedEnv.IMAGE_DIAGNOSIS_URL === undefined) delete process.env.IMAGE_DIAGNOSIS_URL;
  else process.env.IMAGE_DIAGNOSIS_URL = savedEnv.IMAGE_DIAGNOSIS_URL;
});

describe("🔎 Vision gateway forwarding", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  beforeEach(() => {
    received.length = 0;
    resetServiceProbeCache();
  });

  test("forwards the image and returns the service diagnosis", async () => {
    const res = await request(app)
      .post("/api/ai/images/detect-disease")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" })
      .expect(200);
    expect(res.body.disease_detection.primary_disease.disease).toBe("early_blight");
    expect(received).toHaveLength(1);
    expect(received[0].url).toBe("/detect-disease");
    expect(received[0].contentType).toContain("multipart/form-data");
    expect(received[0].body).toContain("leaf.png");
  });

  test("tags heuristic service output with honest provenance", async () => {
    const res = await request(app)
      .post("/api/ai/images/detect-disease")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" })
      .expect(200);
    expect(res.body.dataSource).toBe("heuristic");
    expect(res.body.isRealData).toBe(false);
    expect(res.body.modelSource).toBe("heuristic-demo");
  });

  test("forwards the optional plant_type field", async () => {
    await request(app)
      .post("/api/ai/images/detect-disease")
      .field("plant_type", "tomato")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" })
      .expect(200);
    expect(received[0].body).toContain("tomato");
  });

  test("routes leaf and comprehensive analyses to their endpoints", async () => {
    await request(app)
      .post("/api/ai/images/analyze-leaf")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" })
      .expect(200);
    await request(app)
      .post("/api/ai/images/analyze-plant")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" })
      .expect(200);
    expect(received.map((r) => r.url)).toEqual(["/analyze-leaf", "/analyze-plant"]);
  });

  test("never fabricates a diagnosis when the service is down", async () => {
    process.env.IMAGE_DIAGNOSIS_URL = "http://127.0.0.1:1";
    resetServiceProbeCache();
    const res = await request(app)
      .post("/api/ai/images/detect-disease")
      .attach("file", PNG, { filename: "leaf.png", contentType: "image/png" });
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.disease_detection).toBeUndefined();
    process.env.IMAGE_DIAGNOSIS_URL = visionUrl;
  });
});

/**
 * Multimodal vision provider adapter tests.
 *
 * `diagnosePlantImage` must call a real OpenAI-compatible multimodal endpoint
 * and parse a structured diagnosis, and it must throw
 * ProviderError("vision","unconfigured") when no back-end is set — so callers
 * can never fall back to inventing a disease.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import { diagnosePlantImage, parseVisionDiagnosis, isVisionConfigured } from "../../server/services/providers/visionProvider";
import { ProviderError } from "../../server/services/providers/http";

const savedEnv: Record<string, string | undefined> = {};
let upstream: http.Server | undefined;
let receivedBody = "";

async function startChatService(payload: unknown, status = 200) {
  const srv = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      receivedBody = body;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(
          status === 200
            ? { choices: [{ message: { role: "assistant", content: JSON.stringify(payload) } }] }
            : { error: { message: "boom" } },
        ),
      );
    });
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
  return srv;
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

beforeEach(() => {
  for (const k of [
    "AI_BASE_URL",
    "AI_API_KEY",
    "AI_MODEL",
    "AI_VISION_MODEL",
    "OPENAI_API_KEY",
    "IMAGE_DIAGNOSIS_URL",
  ]) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(async () => {
  if (upstream) {
    await new Promise<void>((r) => upstream!.close(() => r()));
    upstream = undefined;
  }
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("🔬 parseVisionDiagnosis", () => {
  test("parses a well-formed JSON response", () => {
    const d = parseVisionDiagnosis(
      JSON.stringify({
        disease: "اللفحة المبكرة",
        diseaseId: "early-blight",
        confidence: 82,
        severity: "high",
        description: "بقع بنية",
        symptoms: ["بقع"],
        causes: ["رطوبة"],
        treatment: ["مبيد"],
        prevention: ["دورة زراعية"],
      }),
    );
    expect(d.disease).toBe("اللفحة المبكرة");
    expect(d.confidence).toBeCloseTo(0.82);
    expect(d.severity).toBe("high");
  });

  test("tolerates a ```json code fence", () => {
    const d = parseVisionDiagnosis('```json\n{"disease":"صدأ","confidence":0.5}\n```');
    expect(d.disease).toBe("صدأ");
  });

  test("throws on non-JSON instead of guessing", () => {
    expect(() => parseVisionDiagnosis("I think it is blight")).toThrow(ProviderError);
  });

  test("throws when the disease name is missing", () => {
    expect(() => parseVisionDiagnosis('{"confidence":0.9}')).toThrow(ProviderError);
  });
});

describe("👁 diagnosePlantImage", () => {
  test("throws ProviderError('unconfigured') when no back-end is set", async () => {
    expect(isVisionConfigured()).toBe(false);
    await expect(
      diagnosePlantImage({ image: { buffer: PNG, mimetype: "image/png" } }),
    ).rejects.toMatchObject({ provider: "vision", kind: "unconfigured" });
  });

  test("calls the multimodal endpoint and returns a real diagnosis", async () => {
    upstream = await startChatService({
      disease: "البياض الدقيقي",
      confidence: 0.77,
      severity: "medium",
      treatment: ["كبريت"],
      prevention: ["تهوية"],
    });
    process.env.AI_BASE_URL = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/v1`;
    process.env.AI_API_KEY = "test-key";
    process.env.AI_VISION_MODEL = "test-vision-model";

    const result = await diagnosePlantImage({
      image: { buffer: PNG, mimetype: "image/png" },
      cropType: "tomato",
      plantPart: "leaves",
    });

    expect(result.isRealData).toBe(true);
    expect(result.dataSource).toBe("llm");
    expect(result.diagnosis.disease).toBe("البياض الدقيقي");
    expect(result.diagnosis.confidence).toBeCloseTo(0.77);
    // The image must actually be sent as a data URL, not just the metadata.
    expect(receivedBody).toContain("data:image/png;base64,");
    expect(receivedBody).toContain("test-vision-model");
  });

  test("surfaces provider failures as errors, never a fabricated disease", async () => {
    upstream = await startChatService({}, 500);
    process.env.AI_BASE_URL = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/v1`;
    process.env.AI_API_KEY = "test-key";
    await expect(
      diagnosePlantImage({ image: { buffer: PNG, mimetype: "image/png" } }),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});

/**
 * End-to-end: the legacy /api/disease/analyze route no longer runs a
 * route-local vision or reference-table heuristic. Image diagnosis is served
 * only by the trained-model-gated /api/ai/images/* gateway, so this legacy
 * route fails closed even when an LLM is configured.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("🌿 /api/disease/analyze fails closed (no reference-table diagnosis)", () => {
  test("an uploaded image is refused rather than diagnosed from an unverified source", async () => {
    upstream = await startChatService({
      disease: "لفحة الأوراق",
      confidence: 0.9,
      severity: "high",
      treatment: ["مبيد نحاسي"],
      prevention: ["تقليل الرطوبة"],
    });
    process.env.AI_BASE_URL = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/v1`;
    process.env.AI_API_KEY = "test-key";
    process.env.AI_VISION_MODEL = "vision-test";

    const app: express.Application = createServer();
    const res = await request(app)
      .post("/api/disease/analyze")
      .field("cropType", "tomato")
      .field("plantPart", "leaves")
      .attach("images", PNG, { filename: "leaf.png", contentType: "image/png" });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("DISEASE_REFERENCE_NOT_VERIFIED");
    expect(res.body.data).toBeNull();
  });
});

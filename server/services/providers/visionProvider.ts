/**
 * Plant-disease vision provider adapter.
 *
 * Two real inference back-ends are supported, in priority order:
 *
 *  1. An OpenAI-compatible multimodal Chat Completions endpoint
 *     (AI_BASE_URL / AI_API_KEY / AI_VISION_MODEL). This covers OpenAI,
 *     OpenRouter, Groq vision models, a local Ollama with a vision model, ...
 *  2. An external vision microservice at IMAGE_DIAGNOSIS_URL
 *     (POST /detect-disease, multipart) when it is configured and reachable.
 *
 * When neither is available the adapter throws ProviderError("vision",
 * "unconfigured"). Callers must then report that diagnosis is unavailable —
 * never invent a disease. That contract is what keeps a rule-based guess from
 * being shown to a farmer as a model prediction.
 */

import {
  chatComplete,
  getLLMInfo,
  getVisionModel,
  isLLMConfigured,
} from "./llmProvider";
import { ProviderError } from "./http";

export interface VisionDiagnosis {
  /** Machine-readable identifier when the model returns one, else null. */
  diseaseId: string | null;
  /** Human-readable disease name (Arabic preferred, as requested). */
  disease: string;
  /** 0..1 */
  confidence: number;
  severity: "low" | "medium" | "high" | null;
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  /** Optional bounding boxes the model reported (normalised 0..1). */
  detectedAreas: Array<{ region: string; confidence: number; severity: number }>;
}

export interface VisionResult {
  diagnosis: VisionDiagnosis;
  /** "llm" when a multimodal model answered, "vision-service" for the microservice. */
  dataSource: "llm" | "vision-service";
  isRealData: true;
  modelSource: string;
  provider: string;
  /** Wall-clock latency of the vision inference call in milliseconds. */
  latencyMs: number;
}

function visionModel(): string {
  // AI_VISION_MODEL takes precedence, then the shared model. Never substitute a
  // text-only model for vision: if the configured model is not multimodal the
  // provider will reject the request and the caller reports diagnosis as failed.
  return getVisionModel();
}

export function isVisionConfigured(): boolean {
  return isLLMConfigured() || Boolean(process.env.IMAGE_DIAGNOSIS_URL);
}

export function getVisionInfo(): {
  configured: boolean;
  dataSource: "llm" | "vision-service" | null;
  model: string | null;
} {
  if (isLLMConfigured()) {
    return { configured: true, dataSource: "llm", model: visionModel() };
  }

  if (process.env.IMAGE_DIAGNOSIS_URL) {
    return {
      configured: true,
      dataSource: "vision-service",
      model: process.env.IMAGE_DIAGNOSIS_URL,
    };
  }
  return { configured: false, dataSource: null, model: null };
}

const SYSTEM_PROMPT = `أنت خبير أمراض نبات متخصص في الزراعة التونسية وشمال إفريقيا.
ستتلقى صورة لنبات أو جزء منه. حلّل الصورة بدقة وأعد النتيجة بصيغة JSON فقط بالبنية التالية:
{
  "disease": "اسم المرض بالعربية",
  "diseaseId": "معرّف إنجليزي قصير أو null",
  "confidence": 0.0-1.0,
  "severity": "low" | "medium" | "high" | null,
  "description": "وصف مختصر",
  "symptoms": ["..."],
  "causes": ["..."],
  "treatment": ["خطوات علاجية عملية"],
  "prevention": ["خطوات وقائية"]
}
قواعد صارمة:
- إذا كانت الصورة غير واضحة أو لا تُظهر نباتاً، أعد confidence منخفضاً واذكر ذلك في الوصف.
- لا تخترع مرضاً بثقة عالية إذا كنت غير متأكد؛ اخفض قيمة confidence.
- لا تُدرج أي نص خارج كائن JSON.`;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : trimmed).trim();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, 12);
}

function normaliseSeverity(value: unknown): VisionDiagnosis["severity"] {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

/** Parse and validate a model JSON response into a VisionDiagnosis. */
export function parseVisionDiagnosis(raw: string): VisionDiagnosis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new ProviderError("vision", "parse", "Vision model did not return valid JSON");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ProviderError("vision", "parse", "Vision model returned a non-object payload");
  }
  const obj = parsed as Record<string, unknown>;
  const disease = typeof obj.disease === "string" ? obj.disease.trim() : "";
  if (!disease) {
    throw new ProviderError("vision", "parse", "Vision response is missing a disease name");
  }
  const rawConfidence = typeof obj.confidence === "number" ? obj.confidence : Number(obj.confidence);
  const confidence = Number.isFinite(rawConfidence)
    ? Math.max(0, Math.min(1, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence))
    : 0.5;

  return {
    diseaseId: typeof obj.diseaseId === "string" && obj.diseaseId.trim() ? obj.diseaseId : null,
    disease,
    confidence,
    severity: normaliseSeverity(obj.severity),
    description: typeof obj.description === "string" ? obj.description : "",
    symptoms: toStringArray(obj.symptoms),
    causes: toStringArray(obj.causes),
    treatment: toStringArray(obj.treatment),
    prevention: toStringArray(obj.prevention),
    detectedAreas: [],
  };
}

export interface VisionRequest {
  image: { buffer: Buffer; mimetype: string };
  cropType?: string;
  plantPart?: string;
  symptoms?: string;
  language?: "ar" | "fr" | "en";
}

/**
 * Diagnose a plant disease from an image.
 * @throws ProviderError("vision", "unconfigured") when no back-end is configured.
 */
export async function diagnosePlantImage(request: VisionRequest): Promise<VisionResult> {
  if (!isLLMConfigured()) {
    throw new ProviderError(
      "vision",
      "unconfigured",
      "No vision back-end configured (set AI_BASE_URL + AI_API_KEY + AI_VISION_MODEL, or IMAGE_DIAGNOSIS_URL).",
    );
  }

  const dataUrl = `data:${request.image.mimetype};base64,${request.image.buffer.toString("base64")}`;
  const contextLines = [
    request.cropType ? `المحصول: ${request.cropType}` : null,
    request.plantPart ? `الجزء المصاب: ${request.plantPart}` : null,
    request.symptoms ? `أعراض وصفها المزارع: ${request.symptoms}` : null,
  ].filter(Boolean) as string[];

  const content = [
    { type: "text" as const, text: contextLines.join("\n") || "حلّل هذه الصورة." },
    { type: "image_url" as const, image_url: { url: dataUrl } },
  ];

  const started = Date.now();
  const answer = await chatComplete(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    {
      temperature: 0.1,
      maxTokens: 1200,
      json: true,
      model: visionModel(),
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 45_000,
      retries: Number(process.env.AI_MAX_RETRIES) || 1,
    },
  );

  return {
    diagnosis: parseVisionDiagnosis(answer),
    dataSource: "llm",
    isRealData: true,
    modelSource: `vision:${visionModel()}`,
    provider: getLLMInfo().provider,
    latencyMs: Date.now() - started,
  };
}

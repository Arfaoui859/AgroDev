/**
 * Pest control API.
 *
 * This router previously returned hand-written mock payloads (a fixed aphids
 * diagnosis, canned treatments) while the real `pest_control` microservice —
 * which identifies pests from symptoms and a trained classifier, assesses
 * severity and builds a treatment schedule — was running on port 8007 unused.
 * Every response below now comes from that service, tagged with the provenance
 * it declares so a heuristic answer is never presented as model inference.
 *
 * The public response envelope (`{ success, data, message }`) is preserved so
 * existing callers keep working.
 */

import { Router } from "express";
import {
  callMicroservice,
  legacyProvenance,
  respondServiceError,
  serviceBaseUrl,
} from "../services/providers/microserviceProxy";
import { localServiceFallback } from "./ai-services-gateway";
import {
  deriveSymptomsFromQuestion,
  identifyPestFromSymptoms,
  sanitiseSymptoms,
} from "../services/ai/pestControlClient";

const router = Router();

const PEST_SERVICE = () =>
  serviceBaseUrl(process.env.PEST_CONTROL_URL, localServiceFallback(8007));

const CAPABILITY = "pest-control";

/** Attach provenance without breaking the legacy {success,data,message} shape. */
function sendLegacy(
  res: Parameters<typeof respondServiceError>[0],
  result: {
    data: unknown;
    modelSource: string | null;
    heuristic: boolean;
    kind?: import("../services/providers/modelProvenance").ProvenanceKind;
  },
  message: string,
) {
  res.json({
    success: true,
    data: result.data,
    message,
    ...legacyProvenance(result),
  });
}

// Analyze a full pest problem: identification + severity + treatments + schedule
router.post("/analyze-problem", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: "/analyze-pest-problem",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم تحليل مشكلة الآفات بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Identify a pest from symptoms and/or an image
router.post("/identify", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: "/identify-pest",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم تحديد الآفة بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

/**
 * Rule-based symptom identification.
 *
 * The pest service's `/health` declares `synthetic-demo` (its full analysis and
 * treatment models are disabled), so the provenance-guarded proxy above
 * correctly refuses to route through it. But `/identify-pest` itself is an
 * honest, deterministic keyword matcher — it declares
 * `model_source: "symptom-keyword-rules"`, `confidence_score: 0`,
 * `field_validated: false` — and is safe to call directly, exactly as the
 * orchestrator's `pest_control` specialist does.
 *
 * This endpoint is the one the Pest Control screen uses. It returns a pest
 * candidate labelled `rule-based` / `isRealData: false` and never a product,
 * active ingredient, dose or pre-harvest interval. When the service is down or
 * the symptoms match no rule it fails closed rather than inventing a diagnosis.
 */
router.post("/identify-from-symptoms", async (req, res) => {
  const body = req.body ?? {};
  const explicit = sanitiseSymptoms(body.symptoms);
  const question = typeof body.question === "string" ? body.question : "";
  // Explicit symptoms win; otherwise select the user's own symptom-like clauses.
  // Never invented — derived only from the text they wrote.
  const symptoms = explicit.length ? explicit : deriveSymptomsFromQuestion(question);
  if (symptoms.length === 0) {
    res.status(400).json({
      success: false,
      data: null,
      code: "SYMPTOMS_REQUIRED",
      error: "symptoms required",
      message: "Provide at least one described symptom; the service matches keywords and never guesses.",
    });
    return;
  }

  const cropType = typeof body.crop_type === "string" && body.crop_type.trim()
    ? body.crop_type.trim().slice(0, 80)
    : "unknown";

  const outcome = await identifyPestFromSymptoms(symptoms, cropType, { timeoutMs: 12_000 });
  if (outcome.ok === false) {
    const status = outcome.reason === "not_configured" ? 503 : 502;
    res.status(status).json({
      success: false,
      data: null,
      code:
        outcome.reason === "not_configured"
          ? "PEST_SERVICE_NOT_CONFIGURED"
          : outcome.reason === "invalid_response"
            ? "PEST_SERVICE_INVALID_RESPONSE"
            : "PEST_SERVICE_UNAVAILABLE",
      error: "pest-control unavailable",
      message:
        outcome.reason === "not_configured"
          ? "No pest-control service is configured; no identification is guessed."
          : "The pest-control service could not be reached; no identification is guessed.",
      status,
    });
    return;
  }

  const result = outcome.outcome;
  res.json({
    success: true,
    data: {
      pest_identification: {
        identified_pest: result.pest ?? null,
        pest_name_ar: result.pestNameAr ?? null,
        category: result.category ?? null,
        identification_method: result.method ?? "symptom_based",
        // The service's keyword matcher is not calibrated; it reports 0 and we
        // never present a fabricated probability as a confidence score.
        confidence_score: 0,
      },
      symptoms_used: symptoms,
    },
    dataSource: "rule-based",
    isRealData: false,
    modelSource: "symptom-keyword-rules",
    modelKind: "rule-based",
    message: result.serviceMessage ?? "تمت مطابقة الأعراض مع قواعد الكلمات المفتاحية.",
  });
});

// Pest / disease reference database
router.get("/database", async (_req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: "/pest-database",
      capability: CAPABILITY,
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب قاعدة البيانات بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Preventive measures for a crop
router.get("/prevention/:crop_type", async (req, res) => {
  try {
    const crop = encodeURIComponent(req.params.crop_type);
    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: `/prevention-measures/${crop}`,
      capability: CAPABILITY,
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب التدابير الوقائية بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Treatment recommendation for a known pest
router.post("/recommend-treatment", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: "/recommend-treatment",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم إنشاء توصيات العلاج بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Severity assessment. The microservice takes query parameters here, so the
// JSON body a client sends is translated to a query string.
router.post("/assess-severity", async (req, res) => {
  try {
    const {
      pest_name = "aphids",
      affected_area_percentage = 20.0,
      plant_health_score = 0.7,
      temperature = 25.0,
      humidity = 60.0,
    } = req.body ?? {};

    const params = new URLSearchParams({
      pest_name: String(pest_name),
      affected_area_percentage: String(affected_area_percentage),
      plant_health_score: String(plant_health_score),
      temperature: String(temperature),
      humidity: String(humidity),
    });

    const result = await callMicroservice({
      baseUrl: PEST_SERVICE(),
      path: `/assess-severity?${params.toString()}`,
      capability: CAPABILITY,
      body: {},
    });
    sendLegacy(res, result, "تم تقييم شدة الإصابة بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

export { router as pestControlRouter };

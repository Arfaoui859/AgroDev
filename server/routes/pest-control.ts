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

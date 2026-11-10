/**
 * Irrigation optimization API.
 *
 * This router used to return hardcoded mock schedules ("In a real
 * implementation, this would call the Python AI service") while the real
 * `irrigation_optimization` microservice was running on port 8008 unused.
 * Requests are now forwarded to that service and the response is tagged with
 * the provenance the service declares, so its synthetic-trained model is not
 * presented as field-validated inference.
 *
 * The legacy `{ success, data, message }` envelope is preserved.
 */

import { Router } from "express";
import {
  callMicroservice,
  respondServiceError,
  serviceBaseUrl,
} from "../services/providers/microserviceProxy";

const router = Router();

const IRRIGATION_SERVICE = () =>
  serviceBaseUrl(process.env.IRRIGATION_OPTIMIZATION_URL, "http://localhost:8008");

const CAPABILITY = "irrigation-optimizer";

function sendLegacy(
  res: Parameters<typeof respondServiceError>[0],
  result: { data: unknown; modelSource: string | null; heuristic: boolean },
  message: string,
) {
  res.json({
    success: true,
    data: result.data,
    message,
    dataSource: result.heuristic ? "heuristic" : "microservice",
    isRealData: !result.heuristic,
    modelSource: result.modelSource,
  });
}

// Optimize an irrigation schedule
router.post("/optimize", async (req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: IRRIGATION_SERVICE(),
      path: "/optimize-irrigation",
      capability: CAPABILITY,
      body: req.body ?? {},
    });
    sendLegacy(res, result, "تم تحسين جدولة الري بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Calculate crop water requirements
router.post("/water-requirements", async (req, res) => {
  try {
    const {
      crop_type,
      growth_stage,
      temperature,
      humidity,
      days_to_calculate = 30,
    } = req.body ?? {};

    if (
      typeof crop_type !== "string" || !crop_type.trim() ||
      typeof growth_stage !== "string" || !growth_stage.trim() ||
      !Number.isFinite(Number(temperature)) ||
      !Number.isFinite(Number(humidity)) ||
      Number(humidity) < 0 || Number(humidity) > 100
    ) {
      return res.status(400).json({
        success: false,
        code: "MISSING_MEASURED_INPUTS",
        error: "crop_type, growth_stage, measured temperature and humidity are required.",
      });
    }

    const result = await callMicroservice({
      baseUrl: IRRIGATION_SERVICE(),
      path: "/calculate-water-requirements",
      capability: CAPABILITY,
      body: { crop_type, growth_stage, temperature, humidity, days_to_calculate },
    });
    sendLegacy(res, result, "تم حساب الاحتياجات المائية بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Irrigation methods database
router.get("/methods", async (_req, res) => {
  try {
    const result = await callMicroservice({
      baseUrl: IRRIGATION_SERVICE(),
      path: "/irrigation-methods",
      capability: CAPABILITY,
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب معلومات طرق الري بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Analyze soil moisture. The microservice takes query parameters here.
router.post("/analyze-moisture", async (req, res) => {
  try {
    const {
      crop_type = "wheat",
      current_moisture = 50.0,
      field_capacity = 35.0,
      wilting_point = 15.0,
    } = req.body ?? {};

    const params = new URLSearchParams({
      crop_type: String(crop_type),
      current_moisture: String(current_moisture),
      field_capacity: String(field_capacity),
      wilting_point: String(wilting_point),
    });

    const result = await callMicroservice({
      baseUrl: IRRIGATION_SERVICE(),
      path: `/analyze-soil-moisture?${params.toString()}`,
      capability: CAPABILITY,
      body: {},
    });
    sendLegacy(res, result, "تم تحليل رطوبة التربة بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

// Water conservation tips for a crop
router.get("/conservation-tips/:crop_type", async (req, res) => {
  try {
    const crop = encodeURIComponent(req.params.crop_type);
    const result = await callMicroservice({
      baseUrl: IRRIGATION_SERVICE(),
      path: `/water-conservation-tips/${crop}`,
      capability: CAPABILITY,
      method: "GET",
    });
    sendLegacy(res, result, "تم جلب نصائح توفير المياه بنجاح");
  } catch (error) {
    respondServiceError(res, CAPABILITY, error);
  }
});

export { router as irrigationOptimizationRouter };

import express, { type Request, type Response } from "express";

const router = express.Router();

/**
 * Legacy soil-detector endpoints previously mixed rule heuristics with
 * fabricated fertilizer costs, demo history, generated alerts and regional
 * statistics. The evidence-based soil report lives under /api/soil-analysis.
 * Keep these legacy URLs for compatibility, but never invent a result.
 */
function unavailable(_req: Request, res: Response) {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  return res.status(503).json({
    success: false,
    code: "LEGACY_SOIL_DETECTOR_DISABLED",
    message: "هذا المسار القديم غير موصول ببيانات موثّقة. استعمل تقرير تحليل التربة المهني.",
    alternative: "/enhanced-analysis",
    data: null,
    provenance: { source: null, verified: false },
  });
}

router.post("/analyze", unavailable);
router.get("/ideal-profile", unavailable);
router.get("/history/:fieldId", unavailable);
router.get("/alerts", unavailable);
router.patch("/alerts/:alertId/resolve", unavailable);
router.get("/statistics", unavailable);

export default router;

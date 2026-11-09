import express from "express";
const router = express.Router();
router.use((_req, res) => res.status(503).json({
  success: false,
  code: "SIMULATED_DATA_DISABLED",
  message: "توصيات المحاصيل والجدوى الاقتصادية القديمة غير متصلة بمصادر زراعية وسوقية موثّقة.",
  dataAvailable: false,
  isRealData: false,
  provenance: { source: null, verified: false, model_source: null },
}));
export default router;

import express from "express";

/**
 * No verified trained forecasting model registry or prediction history is
 * connected. This router intentionally fails closed rather than returning
 * illustrative accuracy, prediction values or fake training jobs.
 */
const router = express.Router();
router.use((_req, res) => {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  res.status(503).json({
    success: false,
    code: "PREDICTIVE_MODELS_NOT_VALIDATED",
    message: "No verified production prediction models are registered.",
    data: null,
    provenance: { source: null, verified: false },
  });
});
export default router;

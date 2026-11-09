import express from "express";

/**
 * Weather/irrigation analytics previously mixed estimated water-use figures
 * with unverified crop coefficients. Disable until a verified crop-water
 * database, water-quality source and farm-specific irrigation history exist.
 */
const router = express.Router();
router.use((_req, res) => {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  res.status(503).json({
    success: false,
    code: "IRRIGATION_ANALYTICS_NOT_VERIFIED",
    message: "Irrigation analytics are unavailable until crop-water coefficients and farm data are verified.",
    data: null,
    dataAvailable: false,
    isRealData: false,
    provenance: { source: null, verified: false },
  });
});
export default router;

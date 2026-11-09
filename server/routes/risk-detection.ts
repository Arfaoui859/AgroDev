import express from "express";

/**
 * The former risk feed mixed synthetic disease, market, sensor and weather
 * alerts. It is disabled until each feed has a verified source, timestamp and
 * farm-level provenance. Real weather alerts must be rebuilt from live provider
 * observations, not mixed with demo records.
 */
const router = express.Router();
router.use((_req, res) => {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  res.status(503).json({
    success: false,
    code: "RISK_FEEDS_NOT_VERIFIED",
    message: "Risk feeds are not available until their sources and farm ownership are verified.",
    data: null,
    provenance: { source: null, verified: false },
  });
});
export default router;

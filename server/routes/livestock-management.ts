/**
 * Livestock endpoints are intentionally unavailable until real, tenant-scoped
 * animal, veterinary, breeding, production and feed records are persisted.
 *
 * The previous router generated a synthetic herd, invented animal identities,
 * vaccinations, weights, prices, feed stock, production histories and health
 * alerts. That entire runtime demo implementation has been removed.
 */
import express from "express";

const router = express.Router();

router.use((_req, res) => {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code: "LIVESTOCK_DATA_STORE_NOT_CONNECTED",
    message: "Livestock records are unavailable until persistent, user-scoped records are connected.",
    data: [],
    dataAvailable: false,
    isRealData: false,
    productionReady: false,
  });
});

export default router;

/**
 * Public analytics API disabled until verified, timestamped source datasets
 * and persistent API-key / usage storage are connected.
 *
 * The previous implementation generated seeded demo prices, production,
 * exports and weather, and issued API keys that only existed in process memory.
 * Those implementations have been removed rather than hidden behind a banner.
 */
import type { RequestHandler } from "express";

const unavailable: RequestHandler = (_req, res) => {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code: "PUBLIC_DATA_SOURCE_NOT_CONNECTED",
    message: "This endpoint requires a verified public data source and persistent API-key storage.",
    dataAvailable: false,
    isRealData: false,
    productionReady: false,
  });
};

export const getMarketPrices = unavailable;
export const getProductionData = unavailable;
export const getExportData = unavailable;
export const getWeatherData = unavailable;
export const getAPIKeyInfo = unavailable;
export const getPublicStats = unavailable;
export const createAPIKey = unavailable;

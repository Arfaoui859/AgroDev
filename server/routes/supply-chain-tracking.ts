import type { RequestHandler } from "express";

/** Supply-chain traceability requires persistent batches, events and verified quality checks. */
const unavailable: RequestHandler = (_req,res) => {
  res.set("X-Data-Provenance","unavailable");
  res.set("X-Is-Real-Data","false");
  return res.status(503).json({
    success:false,
    code:"SUPPLY_CHAIN_STORE_NOT_CONNECTED",
    message:"تتبع سلسلة التوريد غير متاح حتى ربط دفعات وسجلات نقل وفحوص جودة محفوظة وموثّقة.",
    data:null,
    dataAvailable:false,
    isRealData:false,
    productionReady:false
  });
};
export const getSupplyChainTracking=unavailable;
export const getSupplyChainMetrics=unavailable;
export const getTrackingByBatch=unavailable;
export const updateTrackingStep=unavailable;
export const addQualityCheck=unavailable;
export const resolveAlert=unavailable;
export const generateTrackingReport=unavailable;

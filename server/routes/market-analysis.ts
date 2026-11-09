import express from "express";

/**
 * Market analytics previously seeded Tunisian prices and forecasts from
 * representative constants. No licensed, timestamped market feed is connected.
 */
const router = express.Router();
router.use((_req,res)=>{
  res.setHeader("X-AgroGrowth-Data-Status","unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance","unverified");
  res.status(503).json({success:false,code:"MARKET_SOURCE_NOT_CONNECTED",message:"بيانات السوق غير متاحة حتى ربط مصدر أسعار وكميات موثّق ومرخّص.",data:null,provenance:{source:null,verified:false}});
});
export default router;

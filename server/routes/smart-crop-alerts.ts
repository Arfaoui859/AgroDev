import express from "express";

/** Crop alerts and treatment histories require real farm observations and persistent user-scoped records. */
const router = express.Router();
router.use((_req,res)=>{
  res.setHeader("X-AgroGrowth-Data-Status","unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance","unverified");
  res.status(503).json({success:false,code:"CROP_ALERTS_NOT_CONNECTED",message:"تنبيهات المحاصيل غير متاحة حتى ربط سجلات الحقول والملاحظات الميدانية ومصدر تنبؤ موثّق.",data:null,provenance:{source:null,verified:false}});
});
export default router;

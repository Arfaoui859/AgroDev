import express from "express";

/** Fertilizer doses require verified laboratory methods, nutrient units and locally validated crop response data. */
const router = express.Router();
router.use((_req,res)=>{
  res.setHeader("X-AgroGrowth-Data-Status","unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance","unverified");
  res.status(503).json({success:false,code:"FERTILIZER_REFERENCE_NOT_VERIFIED",message:"جرعات التسميد غير متاحة حتى توثيق وحدات التحليل والمراجع المحلية واستجابة المحاصيل.",data:null,provenance:{source:null,verified:false}});
});
export default router;

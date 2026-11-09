import express from "express";

/** XP, achievements and leaderboards require a persistent user-scoped event ledger. */
const router = express.Router();
router.use((_req,res)=>{
  res.setHeader("X-AgroGrowth-Data-Status","unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance","unverified");
  res.status(503).json({success:false,code:"GAMIFICATION_STORE_NOT_CONNECTED",message:"النقاط والإنجازات غير متاحة حتى ربط سجل دائم وآمن لكل مستخدم.",data:null,provenance:{source:null,verified:false}});
});
export default router;

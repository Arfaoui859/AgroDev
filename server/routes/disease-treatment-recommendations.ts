import express from "express";
const router = express.Router();
/**
 * Legacy treatment catalogue and in-memory treatment history are not a
 * verified veterinary/agronomic prescription system. Keep URLs stable but
 * refuse to suggest chemical products or claim treatment persistence.
 */
router.use((_req, res) => res.status(503).json({
  success: false,
  code: "TREATMENT_KNOWLEDGE_NOT_VALIDATED",
  message: "خدمة التوصيات العلاجية غير متاحة قبل مراجعة مختص وربط سجل علاجي موثّق.",
  data: null,
  provenance: { source: null, verified: false },
}));
export default router;

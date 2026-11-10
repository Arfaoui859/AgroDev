import { Router } from "express";

const router = Router();

/**
 * The legacy Smart Advisor previously exposed hard-coded Saudi market, weather,
 * soil and farm examples as if they belonged to the caller. The UI now routes
 * users to the central AI Assistant. Keep the old paths explicit and fail
 * closed so stale clients cannot consume or mutate demonstration records.
 */
router.use((_req, res) => {
  res.status(410).json({
    success: false,
    code: "LEGACY_SMART_ADVISOR_RETIRED",
    message:
      "تم إيقاف واجهة المستشار القديمة لأنها كانت تعتمد على بيانات تجريبية. استعمل المساعد الزراعي المركزي للحصول على إجابة مع مصدرها وحدودها.",
    replacement: "/ai-assistant",
    provenance: {
      source: "retired-legacy-endpoint",
      persisted: false,
      simulated: false,
    },
  });
});

export default router;

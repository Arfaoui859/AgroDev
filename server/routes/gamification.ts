import type { RequestHandler } from "express";

/**
 * XP, achievements and leaderboards require a persistent user-scoped event
 * ledger. The former in-memory profile and static achievement catalogue have
 * been removed. Keep the route-handler exports for API compatibility.
 */
const unavailable: RequestHandler = (_req, res) => {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code: "GAMIFICATION_STORE_NOT_CONNECTED",
    message: "النقاط والإنجازات غير متاحة حتى ربط سجل دائم وآمن لكل مستخدم.",
    data: null,
    dataAvailable: false,
    isRealData: false,
    productionReady: false,
  });
};

export const getUserProfile = unavailable;
export const awardXP = unavailable;
export const getLeaderboard = unavailable;
export const getAvailableAchievements = unavailable;
export const getUserActivity = unavailable;
export const getGamificationStats = unavailable;

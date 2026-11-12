/**
 * Advanced livestock handlers (legacy route registrations in server/index.ts).
 *
 * Delegates to the real, tenant-scoped implementations in ./livestock. These
 * exports previously returned synthetic demo data, then failed closed; they now
 * serve the caller's own persisted records.
 */
import type { Request, Response } from "express";
import { listAnimals, getHealthAlerts, getLivestockDashboard, listHealthEvents } from "./livestock";

export { listAnimals as getAnimals, getHealthAlerts, getLivestockDashboard };

/** Per-animal health summary from persisted events. */
export async function getAnimalHealth(req: Request, res: Response): Promise<void> {
  req.query.animalId = String(req.params.animalId ?? "");
  await listHealthEvents(req, res, () => {});
}

/** Breeding recommendations require validated genetics data; not computed yet. */
export async function getBreedingRecommendations(_req: Request, res: Response): Promise<void> {
  res.setHeader("X-Data-Provenance", "not-computed");
  res.setHeader("X-Is-Real-Data", "false");
  res.json({
    success: true,
    data: [],
    computed: false,
    isRealData: false,
    reason: "GENETIC_DATA_REQUIRED",
    message: "لا يمكن اقتراح تزويج دون سلالات موثّقة وتاريخ تناسلي كافٍ. لم تُختلق أي توصيات.",
  });
}

/** Feed recommendations require validated nutritional tables; not computed yet. */
export async function getFeedRecommendations(_req: Request, res: Response): Promise<void> {
  res.setHeader("X-Data-Provenance", "not-computed");
  res.setHeader("X-Is-Real-Data", "false");
  res.json({
    success: true,
    data: [],
    computed: false,
    isRealData: false,
    reason: "NUTRITIONAL_PROFILE_REQUIRED",
    message: "لا يمكن حساب حصة العلف دون جدول تحليلي موثّق لمكوّنات الأعلاف ومتطلبات كل نوع ووزن.",
  });
}

export { optimizeFeedBudget } from "./livestock";

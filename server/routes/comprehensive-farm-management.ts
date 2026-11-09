import type { RequestHandler } from "express";

/**
 * The previous comprehensive farm dashboard generated random alerts, crops,
 * weather, market prices, equipment, payroll and financial records.
 * These endpoints now fail closed until each domain is backed by authenticated,
 * tenant-scoped persistence and a verified external data source where needed.
 */
const unavailable: RequestHandler = (_req, res) => {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  return res.status(503).json({
    success: false,
    code: "FARM_MANAGEMENT_DATA_NOT_CONNECTED",
    message: "Farm management data is not connected to a verified source yet.",
    data: null,
    provenance: { source: null, verified: false },
  });
};

export const getComprehensiveFarmDashboard: RequestHandler = unavailable;
export const getFarmAlerts: RequestHandler = unavailable;
export const getFarmTasks: RequestHandler = unavailable;
export const getFarmCrops: RequestHandler = unavailable;
export const getFarmWeather: RequestHandler = unavailable;
export const getFarmMarket: RequestHandler = unavailable;
export const getFarmEquipment: RequestHandler = unavailable;
export const getFarmFinancial: RequestHandler = unavailable;
export const getFarmLabor: RequestHandler = unavailable;

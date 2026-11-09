import type { RequestHandler } from "express";

/** Logistics previously served sample vehicles, routes, orders and metrics. */
const unavailable: RequestHandler = (_req, res) => res.status(503).json({
  success: false,
  code: "SIMULATED_DATA_DISABLED",
  message: "بيانات النقل واللوجستيك غير متصلة بسجل مركبات وطلبات موثّق.",
  dataAvailable: false,
  isRealData: false,
  provenance: { source: null, verified: false },
});

export const getLogisticsVehicles: RequestHandler = unavailable;
export const getLogisticsOrders: RequestHandler = unavailable;
export const getLogisticsMetrics: RequestHandler = unavailable;
export const getRouteOptimizations: RequestHandler = unavailable;
export const createRouteOptimization: RequestHandler = unavailable;
export const updateVehicleLocation: RequestHandler = unavailable;
export const updateOrderStatus: RequestHandler = unavailable;
export const assignOrderToVehicle: RequestHandler = unavailable;
export const getVehiclePerformance: RequestHandler = unavailable;

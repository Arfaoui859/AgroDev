/**
 * Notification and telemetry endpoints are intentionally unavailable until
 * user-scoped persistence and a real notification/device provider are wired.
 * The previous implementation returned shared in-memory demo notifications,
 * fake sensors and fixed readings. No such records are shipped at runtime.
 */
import type { RequestHandler } from "express";

const unavailable: RequestHandler = (_req, res) => {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code: "NOTIFICATION_STORE_NOT_CONNECTED",
    message: "Notifications are unavailable until persistent user-scoped storage and delivery providers are configured.",
    dataAvailable: false,
    isRealData: false,
    productionReady: false,
  });
};

export const getNotifications = unavailable;
export const getNotificationById = unavailable;
export const createNotification = unavailable;
export const updateNotification = unavailable;
export const markAsRead = unavailable;
export const markAsUnread = unavailable;
export const toggleStar = unavailable;
export const archiveNotification = unavailable;
export const deleteNotification = unavailable;
export const bulkUpdateNotifications = unavailable;
export const getSensors = unavailable;
export const getRealTimeData = unavailable;
export const getNotificationRules = unavailable;
export const createNotificationRule = unavailable;
export const updateNotificationRule = unavailable;
export const deleteNotificationRule = unavailable;
export const getNotificationStats = unavailable;
export const sendManualNotification = unavailable;

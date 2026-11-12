import type { Request, Response } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";
import { safeErrorMessage } from "../lib/errors";

function callerDb(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

/**
 * Log the raw Postgres/Supabase error server-side and return a fixed, non-
 * disclosing message to the client. The raw error can name tables, columns and
 * constraints, so it must never reach the response body.
 */
function dbErr(error: unknown): string {
  console.error("[notifications] persistence error:", error);
  return safeErrorMessage(error, "Notification store is temporarily unavailable");
}

function unavailable(res: Response, code: string) {
  res.set("X-Data-Provenance", "unavailable");
  res.set("X-Is-Real-Data", "false");
  return res.status(503).json({
    success: false,
    code,
    message: "This notification capability is not connected to a verified persistence or delivery provider.",
    dataAvailable: false,
    isRealData: false,
  });
}

export async function getNotifications(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  let query = db.from("notifications")
    .select("id,user_id,type,title,message,priority,category,action_url,metadata,read_at,is_starred,archived_at,created_at")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (req.query.unread === "true") query = query.is("read_at", null);
  if (req.query.archived === "true") query = query.not("archived_at", "is", null);
  else if (req.query.archived !== "all") query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: dbErr(error) });
  res.set("X-Data-Provenance", "supabase.notifications");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data: data ?? [], count: data?.length ?? 0, source: "supabase.notifications", isRealData: true });
}

export async function getNotificationById(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data, error } = await db.from("notifications")
    .select("id,user_id,type,title,message,priority,category,action_url,metadata,read_at,is_starred,archived_at,created_at")
    .eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: dbErr(error) });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, data });
}

export async function createNotification(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { type, title, message, priority, category, action_url, metadata } = req.body ?? {};
  if (typeof type !== "string" || !type.trim() || typeof title !== "string" || !title.trim() ||
      typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, code: "INVALID_NOTIFICATION", message: "type, title and message are required." });
  }
  const { data, error } = await db.from("notifications").insert({
    user_id: req.userId,
    type: type.slice(0, 100),
    title: title.slice(0, 255),
    message: message.slice(0, 5000),
    priority: ["low", "normal", "high", "urgent"].includes(priority) ? priority : "normal",
    category: typeof category === "string" ? category.slice(0, 100) : "general",
    action_url: typeof action_url === "string" ? action_url.slice(0, 500) : null,
    metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {},
  }).select("*").single();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_CREATE_FAILED", message: dbErr(error) });
  return res.status(201).json({ success: true, data });
}

export async function updateNotification(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const updates: Record<string, unknown> = {};
  if (typeof req.body?.title === "string") updates.title = req.body.title.slice(0, 255);
  if (typeof req.body?.message === "string") updates.message = req.body.message.slice(0, 5000);
  if (["low", "normal", "high", "urgent"].includes(req.body?.priority)) updates.priority = req.body.priority;
  if (typeof req.body?.read === "boolean") updates.read_at = req.body.read ? new Date().toISOString() : null;
  if (typeof req.body?.is_starred === "boolean") updates.is_starred = req.body.is_starred;
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, code: "NO_VALID_NOTIFICATION_FIELDS" });
  const { data, error } = await db.from("notifications").update(updates)
    .eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_UPDATE_FAILED", message: dbErr(error) });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, data });
}

async function updateOwnedNotification(req: Request, res: Response, updates: Record<string, unknown>) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data, error } = await db.from("notifications").update(updates)
    .eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_UPDATE_FAILED", message: dbErr(error) });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, data });
}

export const markAsRead = (req: Request, res: Response) =>
  updateOwnedNotification(req, res, { read_at: new Date().toISOString() });
export const markAsUnread = (req: Request, res: Response) =>
  updateOwnedNotification(req, res, { read_at: null });
export const toggleStar = async (req: Request, res: Response) => {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data: current, error } = await db.from("notifications").select("is_starred")
    .eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: dbErr(error) });
  if (!current) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return updateOwnedNotification(req, res, { is_starred: !current.is_starred });
};
export const archiveNotification = (req: Request, res: Response) =>
  updateOwnedNotification(req, res, { archived_at: new Date().toISOString() });

export async function deleteNotification(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data, error } = await db.from("notifications").delete()
    .eq("id", req.params.id).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_DELETE_FAILED", message: dbErr(error) });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, deletedId: data.id });
}

export async function bulkUpdateNotifications(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === "string").slice(0, 100) : [];
  const action = req.body?.action;
  if (!ids.length || !["read", "unread", "archive", "delete"].includes(action)) {
    return res.status(400).json({ success: false, code: "INVALID_BULK_UPDATE" });
  }
  if (action === "delete") {
    const { data, error } = await db.from("notifications").delete()
      .eq("user_id", req.userId).in("id", ids).select("id");
    if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_BULK_DELETE_FAILED", message: dbErr(error) });
    return res.json({ success: true, deletedCount: data?.length ?? 0 });
  }
  const updates = action === "read" ? { read_at: new Date().toISOString() } :
    action === "unread" ? { read_at: null } : { archived_at: new Date().toISOString() };
  const { data, error } = await db.from("notifications").update(updates)
    .eq("user_id", req.userId).in("id", ids).select("id");
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_BULK_UPDATE_FAILED", message: dbErr(error) });
  return res.json({ success: true, updatedCount: data?.length ?? 0 });
}

export async function getNotificationStats(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const [all, unread, urgent] = await Promise.all([
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", req.userId).is("archived_at", null),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", req.userId).is("read_at", null).is("archived_at", null),
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", req.userId).in("priority", ["high", "urgent"]).is("archived_at", null),
  ]);
  const failure = all.error || unread.error || urgent.error;
  if (failure) return res.status(503).json({ success: false, code: "NOTIFICATION_STATS_FAILED", message: failure.message });
  return res.json({ success: true, data: { total: all.count ?? 0, unread: unread.count ?? 0, urgent: urgent.count ?? 0 } });
}

// Notification-rule persistence and external delivery stay explicitly
// unavailable until a rules table and a delivery provider are installed.
export const getNotificationRules = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");

/** Devices owned by the caller, each paired with its latest reading per metric. */
export const getSensors = async (req: Request, res: Response) => {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "SENSOR_REGISTRY_NOT_CONNECTED");

  const { data: devices, error: deviceError } = await db
    .from("sensor_devices")
    .select("id,farm_id,section_id,device_id,device_type,device_model,location,battery_level,signal_strength,status,installation_date,last_maintenance_date")
    .order("created_at", { ascending: true })
    .limit(200);
  if (deviceError) {
    return res.status(503).json({ success: false, code: "SENSOR_REGISTRY_READ_FAILED", message: dbErr(deviceError), data: [], isRealData: false });
  }
  const deviceRows = devices ?? [];
  if (deviceRows.length === 0) {
    res.set("X-Data-Provenance", "supabase.sensor_devices");
    res.set("X-Is-Real-Data", "true");
    return res.json({ success: true, data: [], count: 0, source: "supabase.sensor_devices", isRealData: true });
  }

  const { data: readings, error: readingError } = await db
    .from("sensor_readings")
    .select("id,device_id,reading_type,value,unit,quality_indicator,recorded_at")
    .in("device_id", deviceRows.map((d) => d.id))
    .order("recorded_at", { ascending: false })
    .limit(1000);
  if (readingError) {
    return res.status(503).json({ success: false, code: "SENSOR_READINGS_READ_FAILED", message: dbErr(readingError), data: [], isRealData: false });
  }

  // Latest reading per (device, reading_type). Readings arrive newest-first.
  const latest = new Map<string, { value: number; unit: string; quality: string | null; recordedAt: string }>();
  for (const r of readings ?? []) {
    const key = `${r.device_id}::${r.reading_type}`;
    if (latest.has(key)) continue;
    latest.set(key, {
      value: Number(r.value),
      unit: r.unit,
      quality: r.quality_indicator ?? null,
      recordedAt: r.recorded_at,
    });
  }

  type DeviceRow = (typeof deviceRows)[number];
  const byDevice = new Map<string, DeviceRow>();
  for (const d of deviceRows) byDevice.set(d.id, d);

  const data = [...latest.entries()].map(([key, reading]) => {
    const [deviceId, readingType] = key.split("::");
    const device = byDevice.get(deviceId);
    return {
      id: `${deviceId}:${readingType}`,
      deviceId,
      deviceName: device?.device_id ?? null,
      deviceType: device?.device_type ?? null,
      farmId: device?.farm_id ?? null,
      sectionId: device?.section_id ?? null,
      location: device?.location ?? null,
      status: device?.status ?? null,
      batteryLevel: device?.battery_level ?? null,
      signalStrength: device?.signal_strength ?? null,
      lastMaintenanceDate: device?.last_maintenance_date ?? null,
      type: readingType,
      lastReading: reading,
    };
  });

  res.set("X-Data-Provenance", "supabase.sensor_devices,sensor_readings");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data, count: data.length, source: "supabase.sensors", isRealData: true });
};

/**
 * Recent readings across the caller's own devices. `streamConnected` is true
 * only when at least one reading exists; an empty registry is reported as an
 * empty stream, never back-filled with synthetic values.
 */
export const getRealTimeData = async (req: Request, res: Response) => {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "SENSOR_STREAM_NOT_CONNECTED");

  const { data: devices, error: deviceError } = await db.from("sensor_devices").select("id").limit(200);
  if (deviceError) {
    return res.status(503).json({ success: false, code: "SENSOR_REGISTRY_READ_FAILED", message: dbErr(deviceError), data: [], isRealData: false });
  }
  const ids = (devices ?? []).map((d) => d.id);
  if (ids.length === 0) {
    res.set("X-Data-Provenance", "supabase.sensor_readings");
    res.set("X-Is-Real-Data", "true");
    return res.json({ success: true, data: [], count: 0, streamConnected: false, source: "supabase.sensor_readings", isRealData: true });
  }

  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  const { data, error } = await db
    .from("sensor_readings")
    .select("id,device_id,reading_type,value,unit,quality_indicator,metadata,recorded_at")
    .in("device_id", ids)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error) {
    return res.status(503).json({ success: false, code: "SENSOR_READINGS_READ_FAILED", message: dbErr(error), data: [], isRealData: false });
  }
  const rows = data ?? [];
  res.set("X-Data-Provenance", "supabase.sensor_readings");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data: rows, count: rows.length, streamConnected: rows.length > 0, source: "supabase.sensor_readings", isRealData: true });
};

export const createNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const updateNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const deleteNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const sendManualNotification = (_req: Request, res: Response) => unavailable(res, "EXTERNAL_NOTIFICATION_DELIVERY_NOT_CONFIGURED");

import type { Request, Response } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

function callerDb(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function unavailable(res: Response, code: string) {
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
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: error.message });
  return res.json({ success: true, data: data ?? [], count: data?.length ?? 0, source: "supabase.notifications" });
}

export async function getNotificationById(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data, error } = await db.from("notifications")
    .select("id,user_id,type,title,message,priority,category,action_url,metadata,read_at,is_starred,archived_at,created_at")
    .eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: error.message });
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
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_CREATE_FAILED", message: error.message });
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
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_UPDATE_FAILED", message: error.message });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, data });
}

async function updateOwnedNotification(req: Request, res: Response, updates: Record<string, unknown>) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const { data, error } = await db.from("notifications").update(updates)
    .eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_UPDATE_FAILED", message: error.message });
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
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_READ_FAILED", message: error.message });
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
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_DELETE_FAILED", message: error.message });
  if (!data) return res.status(404).json({ success: false, code: "NOTIFICATION_NOT_FOUND" });
  return res.json({ success: true, deletedId: data.id });
}

export async function bulkUpdateNotifications(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return unavailable(res, "NOTIFICATION_DATABASE_UNAVAILABLE");
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === "string").slice(0, 100) : [];
  const action = req.body?.action;
  if (!ids.length || !["read", "unread", "archive"].includes(action)) {
    return res.status(400).json({ success: false, code: "INVALID_BULK_UPDATE" });
  }
  const updates = action === "read" ? { read_at: new Date().toISOString() } :
    action === "unread" ? { read_at: null } : { archived_at: new Date().toISOString() };
  const { data, error } = await db.from("notifications").update(updates)
    .eq("user_id", req.userId).in("id", ids).select("id");
  if (error) return res.status(503).json({ success: false, code: "NOTIFICATION_BULK_UPDATE_FAILED", message: error.message });
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

// These capabilities stay explicitly unavailable until real sensor ingestion,
// notification-rule persistence, and external delivery providers are installed.
export const getSensors = (_req: Request, res: Response) => unavailable(res, "SENSOR_REGISTRY_NOT_CONNECTED");
export const getRealTimeData = (_req: Request, res: Response) => unavailable(res, "SENSOR_STREAM_NOT_CONNECTED");
export const getNotificationRules = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const createNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const updateNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const deleteNotificationRule = (_req: Request, res: Response) => unavailable(res, "NOTIFICATION_RULES_NOT_CONNECTED");
export const sendManualNotification = (_req: Request, res: Response) => unavailable(res, "EXTERNAL_NOTIFICATION_DELIVERY_NOT_CONFIGURED");

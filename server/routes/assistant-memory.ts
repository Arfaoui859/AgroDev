import type { Request, Response } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const CATEGORIES = ["profile", "preference", "farm_context", "work_context", "communication", "ongoing_task"] as const;
const SOURCES = ["explicit_user_statement", "user_correction", "user_confirmed"] as const;

function callerDb(req: Request) {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

export async function listAssistantMemory(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(401).json({ success: false, code: "VERIFIED_SESSION_REQUIRED" });
  const { data, error } = await db.from("assistant_user_memory")
    .select("id,memory_key,category,memory_value,confidence,source,last_confirmed_at,updated_at")
    .eq("user_id", req.userId).order("updated_at", { ascending: false }).limit(100);
  if (error) return res.status(503).json({ success: false, code: "ASSISTANT_MEMORY_READ_FAILED", message: "تعذّر تحميل الذاكرة الشخصية." });
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.assistant_user_memory", persisted: true } });
}

export async function rememberAssistantFact(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(401).json({ success: false, code: "VERIFIED_SESSION_REQUIRED" });
  const key = typeof req.body?.memory_key === "string" ? req.body.memory_key.trim().toLowerCase() : "";
  const value = typeof req.body?.memory_value === "string" ? req.body.memory_value.trim() : "";
  const category = req.body?.category;
  const source = req.body?.source ?? "explicit_user_statement";
  const confidence = Number(req.body?.confidence ?? 0.85);
  if (!/^[a-z0-9_.-]{2,100}$/.test(key) || !value || value.length > 1200 ||
      !CATEGORIES.includes(category) || !SOURCES.includes(source) ||
      !Number.isFinite(confidence) || confidence < 0.5 || confidence > 1) {
    return res.status(400).json({ success: false, code: "INVALID_ASSISTANT_MEMORY", message: "المعلومة غير صالحة للحفظ أو ثقتها ضعيفة." });
  }
  const { data, error } = await db.from("assistant_user_memory").upsert({
    user_id: req.userId, memory_key: key, memory_value: value, category,
    source, confidence, last_confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,memory_key" })
    .select("id,memory_key,category,memory_value,confidence,source,last_confirmed_at,updated_at").single();
  if (error) return res.status(503).json({ success: false, code: "ASSISTANT_MEMORY_SAVE_FAILED", message: "ما نجّمتش نحفظ المعلومة. ما نعتبرهاش محفوظة." });
  return res.status(200).json({ success: true, data, provenance: { source: "supabase.assistant_user_memory", persisted: true } });
}

export async function forgetAssistantFact(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(401).json({ success: false, code: "VERIFIED_SESSION_REQUIRED" });
  const key = typeof req.params.memoryKey === "string" ? req.params.memoryKey.trim().toLowerCase() : "";
  if (!/^[a-z0-9_.-]{2,100}$/.test(key)) return res.status(400).json({ success: false, code: "INVALID_MEMORY_KEY" });
  const { data, error } = await db.from("assistant_user_memory").delete()
    .eq("user_id", req.userId).eq("memory_key", key).select("memory_key").maybeSingle();
  if (error) return res.status(503).json({ success: false, code: "ASSISTANT_MEMORY_DELETE_FAILED" });
  if (!data) return res.status(404).json({ success: false, code: "MEMORY_NOT_FOUND" });
  return res.json({ success: true, deleted: data.memory_key });
}

import { Router, type Request, type Response } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const equipmentCategories = new Set(["tractor", "irrigation", "vehicle", "harvester", "sprayer", "sensor", "tool", "other"]);
const equipmentConditions = new Set(["new", "good", "fair", "poor", "out_of_service", "unknown"]);
const equipmentStatuses = new Set(["active", "maintenance", "inactive", "retired"]);
const taskTypes = new Set(["planting", "irrigation", "fertilization", "pest_control", "harvesting", "maintenance", "inspection", "general"]);
const taskPriorities = new Set(["low", "medium", "high", "urgent"]);
const taskStatuses = new Set(["pending", "in_progress", "completed", "cancelled"]);

function fail(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, code, message });
}
function dbFor(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
}
function optionalText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export function equipmentPayload(body: any) {
  const name = optionalText(body.name, 180);
  const category = body.category ?? "other";
  const condition = body.condition ?? "unknown";
  const status = body.status ?? "active";
  const cost = body.purchase_cost === "" || body.purchase_cost == null ? null : Number(body.purchase_cost);
  if (!name || !equipmentCategories.has(category) || !equipmentConditions.has(condition) ||
      !equipmentStatuses.has(status) || (cost !== null && (!Number.isFinite(cost) || cost < 0)) ||
      (body.purchase_date != null && body.purchase_date !== "" && !validDate(body.purchase_date))) return null;
  return {
    name, category, condition, status,
    brand: optionalText(body.brand, 120),
    model: optionalText(body.model, 120),
    serial_number: optionalText(body.serial_number, 120) || null,
    purchase_date: body.purchase_date || null,
    purchase_cost: cost,
    currency: "TND",
    notes: optionalText(body.notes, 3000),
  };
}
export function taskPayload(body: any, userId?: string) {
  const title = optionalText(body.title, 180);
  const task_type = body.task_type ?? "general";
  const priority = body.priority ?? "medium";
  const status = body.status ?? "pending";
  if (!title || !taskTypes.has(task_type) || !taskPriorities.has(priority) ||
      !taskStatuses.has(status) || (body.due_date != null && body.due_date !== "" && !validDate(body.due_date)) ||
      (body.assigned_to != null && body.assigned_to !== "" && (!UUID.test(body.assigned_to) || (userId && body.assigned_to !== userId)))) return null;
  return {
    title, task_type, priority, status,
    description: optionalText(body.description, 4000),
    due_date: body.due_date || null,
    assigned_to: body.assigned_to || null,
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };
}

router.get("/equipment", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  const farmId = req.query.farm_id;
  if (farmId !== undefined && (typeof farmId !== "string" || !UUID.test(farmId)))
    return fail(res, 400, "INVALID_FARM_ID", "معرّف المزرعة غير صالح.");
  let query = db.from("farm_equipment").select("*").order("created_at", { ascending: false });
  if (typeof farmId === "string") query = query.eq("farm_id", farmId);
  const { data, error } = await query;
  if (error) {
    console.error("Equipment read failed:", error.code);
    return fail(res, 503, "EQUIPMENT_READ_FAILED", "تعذّر استرجاع المعدات.");
  }
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_equipment", persisted: true } });
});

router.post("/equipment", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  const farmId = req.body?.farm_id;
  const payload = equipmentPayload(req.body ?? {});
  if (typeof farmId !== "string" || !UUID.test(farmId) || !payload)
    return fail(res, 400, "INVALID_EQUIPMENT_INPUT", "تحقق من المزرعة وبيانات المعدّة.");
  const { data, error } = await db.from("farm_equipment").insert({ ...payload, farm_id: farmId, created_by: (req as any).userId }).select("*").single();
  if (error) {
    console.error("Equipment create failed:", error.code);
    return fail(res, error.code === "42501" ? 403 : 503, error.code === "42501" ? "FARM_OWNERSHIP_REQUIRED" : "EQUIPMENT_CREATE_FAILED", "لم يتم حفظ المعدّة. تحقق من ملكية المزرعة وتطبيق migration.");
  }
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.farm_equipment", persisted: true } });
});

router.put("/equipment/:id", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  if (!UUID.test(req.params.id)) return fail(res, 400, "INVALID_EQUIPMENT_ID", "معرّف المعدّة غير صالح.");
  const payload = equipmentPayload(req.body ?? {});
  if (!payload) return fail(res, 400, "INVALID_EQUIPMENT_INPUT", "بيانات المعدّة غير صالحة.");
  const { data, error } = await db.from("farm_equipment").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", req.params.id).select("*").maybeSingle();
  if (error) return fail(res, 503, "EQUIPMENT_UPDATE_FAILED", "تعذّر تحديث المعدّة.");
  if (!data) return fail(res, 404, "EQUIPMENT_NOT_FOUND", "المعدّة غير موجودة أو لا تملك صلاحية الوصول إليها.");
  return res.json({ success: true, data, provenance: { source: "supabase.farm_equipment", persisted: true } });
});

router.delete("/equipment/:id", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  if (!UUID.test(req.params.id)) return fail(res, 400, "INVALID_EQUIPMENT_ID", "معرّف المعدّة غير صالح.");
  const { data, error } = await db.from("farm_equipment").delete().eq("id", req.params.id).select("id").maybeSingle();
  if (error) return fail(res, 503, "EQUIPMENT_DELETE_FAILED", "تعذّر حذف المعدّة.");
  if (!data) return fail(res, 404, "EQUIPMENT_NOT_FOUND", "المعدّة غير موجودة أو لا تملك صلاحية الوصول إليها.");
  return res.json({ success: true, deleted: true, id: data.id });
});

router.get("/tasks", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  const farmId = req.query.farm_id;
  if (farmId !== undefined && (typeof farmId !== "string" || !UUID.test(farmId)))
    return fail(res, 400, "INVALID_FARM_ID", "معرّف المزرعة غير صالح.");
  let query = db.from("farm_tasks").select("*").order("created_at", { ascending: false });
  if (typeof farmId === "string") query = query.eq("farm_id", farmId);
  const { data, error } = await query;
  if (error) return fail(res, 503, "TASK_READ_FAILED", "تعذّر استرجاع المهام.");
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_tasks", persisted: true } });
});

router.post("/tasks", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  const farmId = req.body?.farm_id;
  const payload = taskPayload(req.body ?? {}, (req as any).userId);
  if (typeof farmId !== "string" || !UUID.test(farmId) || !payload)
    return fail(res, 400, "INVALID_TASK_INPUT", "تحقق من المزرعة وبيانات المهمة.");
  const { data, error } = await db.from("farm_tasks").insert({ ...payload, farm_id: farmId, created_by: (req as any).userId }).select("*").single();
  if (error) return fail(res, error.code === "42501" ? 403 : 503, error.code === "42501" ? "FARM_OWNERSHIP_REQUIRED" : "TASK_CREATE_FAILED", "لم يتم حفظ المهمة. تحقق من ملكية المزرعة وتطبيق migration.");
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.farm_tasks", persisted: true } });
});

router.put("/tasks/:id", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  if (!UUID.test(req.params.id)) return fail(res, 400, "INVALID_TASK_ID", "معرّف المهمة غير صالح.");
  const payload = taskPayload(req.body ?? {});
  if (!payload) return fail(res, 400, "INVALID_TASK_INPUT", "بيانات المهمة غير صالحة.");
  const { data, error } = await db.from("farm_tasks").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", req.params.id).select("*").maybeSingle();
  if (error) return fail(res, 503, "TASK_UPDATE_FAILED", "تعذّر تحديث المهمة.");
  if (!data) return fail(res, 404, "TASK_NOT_FOUND", "المهمة غير موجودة أو لا تملك صلاحية الوصول إليها.");
  return res.json({ success: true, data, provenance: { source: "supabase.farm_tasks", persisted: true } });
});

router.delete("/tasks/:id", async (req, res) => {
  const db = dbFor(req);
  if (!db) return fail(res, 503, "DATABASE_UNAVAILABLE", "قاعدة البيانات غير متاحة.");
  if (!UUID.test(req.params.id)) return fail(res, 400, "INVALID_TASK_ID", "معرّف المهمة غير صالح.");
  const { data, error } = await db.from("farm_tasks").delete().eq("id", req.params.id).select("id").maybeSingle();
  if (error) return fail(res, 503, "TASK_DELETE_FAILED", "تعذّر حذف المهمة.");
  if (!data) return fail(res, 404, "TASK_NOT_FOUND", "المهمة غير موجودة أو لا تملك صلاحية الوصول إليها.");
  return res.json({ success: true, deleted: true, id: data.id });
});

export default router;

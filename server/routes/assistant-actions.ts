import type { RequestHandler } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

/**
 * Assistant actions are explicit, authenticated database operations.
 * The chat model may suggest an action, but it never writes to the database.
 * A farmer must review the fields and press the confirmation button.
 */
function callerDatabase(req: Parameters<RequestHandler>[0]) {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

export const listAssistantFarms: RequestHandler = async (req, res) => {
  const db = callerDatabase(req);
  if (!db) {
    return res.status(401).json({
      success: false,
      code: "VERIFIED_SESSION_REQUIRED",
      message: "سجّل الدخول من جديد قبل ربط المساعد ببيانات المزرعة.",
    });
  }

  const { data, error } = await db
    .from("farms")
    .select("id,name,size_hectares,location")
    .eq("owner_id", req.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Assistant farm lookup failed:", error.code);
    return res.status(503).json({
      success: false,
      code: "FARM_DATA_UNAVAILABLE",
      message: "تعذّر تحميل المزارع من قاعدة البيانات.",
    });
  }

  return res.json({ success: true, data: data ?? [] });
};

export const createAssistantCultivation: RequestHandler = async (req, res) => {
  const db = callerDatabase(req);
  if (!db) {
    return res.status(401).json({
      success: false,
      code: "VERIFIED_SESSION_REQUIRED",
      message: "يلزم تسجيل دخول موثّق لتنفيذ الإضافة.",
    });
  }

  const body = req.body ?? {};
  const farmId = typeof body.farm_id === "string" ? body.farm_id.trim() : "";
  const sectionId = typeof body.section_id === "string" && body.section_id.trim()
    ? body.section_id.trim()
    : null;
  const cropName = typeof body.crop_name === "string" ? body.crop_name.trim() : "";
  const plantingDate = typeof body.planting_date === "string" ? body.planting_date : "";
  const area = Number(body.area_hectares);

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const errors: string[] = [];
  if (!uuid.test(farmId)) errors.push("farm_id");
  if (sectionId && !uuid.test(sectionId)) errors.push("section_id");
  if (!cropName || cropName.length > 100) errors.push("crop_name");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plantingDate) || Number.isNaN(Date.parse(plantingDate))) errors.push("planting_date");
  if (!Number.isFinite(area) || area <= 0) errors.push("area_hectares");
  if (errors.length) {
    return res.status(400).json({
      success: false,
      code: "INVALID_CULTIVATION_INPUT",
      missing_or_invalid: errors,
      message: "راجع اسم المحصول والمساحة وتاريخ الزراعة والمزرعة.",
    });
  }

  const { data: farm, error: farmError } = await db
    .from("farms")
    .select("id,size_hectares")
    .eq("id", farmId)
    .eq("owner_id", req.userId)
    .maybeSingle();

  if (farmError) {
    console.error("Assistant farm ownership check failed:", farmError.code);
    return res.status(503).json({ success: false, code: "FARM_LOOKUP_FAILED" });
  }
  if (!farm) {
    return res.status(404).json({
      success: false,
      code: "FARM_NOT_FOUND_OR_NOT_OWNED",
      message: "المزرعة غير موجودة أو لا تملك صلاحية إدارتها.",
    });
  }

  let maxArea = Number(farm.size_hectares);
  if (sectionId) {
    const { data: section, error: sectionError } = await db
      .from("farm_sections")
      .select("id,area_hectares")
      .eq("id", sectionId)
      .eq("farm_id", farmId)
      .maybeSingle();
    if (sectionError) {
      console.error("Assistant section lookup failed:", sectionError.code);
      return res.status(503).json({ success: false, code: "SECTION_LOOKUP_FAILED" });
    }
    if (!section) {
      return res.status(404).json({
        success: false,
        code: "SECTION_NOT_FOUND",
        message: "الحقل المحدد لا يتبع هذه المزرعة.",
      });
    }
    maxArea = Number(section.area_hectares);
  }

  if (!Number.isFinite(maxArea) || area > maxArea) {
    return res.status(400).json({
      success: false,
      code: "CULTIVATION_AREA_EXCEEDS_AVAILABLE_AREA",
      available_area_hectares: Number.isFinite(maxArea) ? maxArea : null,
      message: "مساحة الزراعة أكبر من المساحة المسجلة للمزرعة أو الحقل.",
    });
  }

  const insert = {
    farm_id: farmId,
    section_id: sectionId,
    crop_name: cropName,
    crop_variety: typeof body.crop_variety === "string" ? body.crop_variety.trim() || null : null,
    planting_date: plantingDate,
    expected_harvest_date: typeof body.expected_harvest_date === "string" && body.expected_harvest_date
      ? body.expected_harvest_date
      : null,
    area_hectares: area,
    seed_quantity: null,
    seed_cost: null,
    irrigation_method: null,
    fertilizer_plan: null,
    pesticide_plan: null,
    current_growth_stage: "planned",
    estimated_yield: null,
    actual_yield: null,
    quality_grade: null,
    total_cost: null,
    revenue: null,
    profit: null,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : "تمت الإضافة بموافقة المستخدم عبر المساعد الذكي.",
    status: "active",
  };

  const { data, error } = await db
    .from("crop_cultivations")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    console.error("Assistant cultivation insert failed:", error.code);
    return res.status(503).json({
      success: false,
      code: "CULTIVATION_PERSISTENCE_FAILED",
      message: "لم يتم حفظ المحصول. لم نعرض العملية كأنها نجحت.",
    });
  }

  return res.status(201).json({
    success: true,
    data,
    provenance: { source: "supabase.crop_cultivations", persisted: true },
    message: "تم حفظ المحصول في سجل المزرعة.",
  });
};

import type { RequestHandler } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_JSON_BYTES = 100 * 1024;

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown): boolean {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (isJsonObject(value)) return Object.values(value).every(isJsonValue);
  return false;
}

function withinJsonLimit(value: unknown): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8") <= MAX_JSON_BYTES;
  } catch {
    return false;
  }
}

/**
 * Save a completed soil analysis against a farm/field owned by the signed-in
 * caller. Only columns verified in database/cloud-setup.sql are written.
 * Durable records require a verified JWT, never the development demo identity.
 */
export const saveSoilAnalysis: RequestHandler = async (req, res) => {
  if (req.identitySource !== "jwt" || !req.userId) {
    return res.status(401).json({
      success: false,
      error: "AUTHENTICATION_REQUIRED",
      message: "A verified sign-in is required to save soil analyses.",
    });
  }

  const body = req.body ?? {};
  const farmId = body.farm_id;
  const fieldId = body.field_id;

  if (typeof farmId !== "string" || !UUID_RE.test(farmId)) {
    return res.status(400).json({ success: false, error: "INVALID_FARM_ID" });
  }
  if (fieldId !== undefined && fieldId !== null && (typeof fieldId !== "string" || !UUID_RE.test(fieldId))) {
    return res.status(400).json({ success: false, error: "INVALID_FIELD_ID" });
  }

  const analysisType = body.analysis_type ?? "sensor";
  if (!["sensor", "lab", "image"].includes(analysisType)) {
    return res.status(400).json({ success: false, error: "INVALID_ANALYSIS_TYPE" });
  }
  if (!isJsonObject(body.sensor_data) || !isJsonValue(body.sensor_data)) {
    return res.status(400).json({ success: false, error: "INVALID_SENSOR_DATA" });
  }
  for (const key of ["analysis_result", "recommendations", "location", "weather_conditions"] as const) {
    if (body[key] !== undefined && body[key] !== null && !isJsonValue(body[key])) {
      return res.status(400).json({ success: false, error: `INVALID_${key.toUpperCase()}` });
    }
  }
  const numericColumns: Record<string, { min: number; max: number }> = {
    ph_level: { min: 0, max: 14 },
    nitrogen_level: { min: 0, max: 100000 },
    phosphorus_level: { min: 0, max: 100000 },
    potassium_level: { min: 0, max: 100000 },
    organic_matter_percent: { min: 0, max: 100 },
    moisture_percent: { min: 0, max: 100 },
    temperature_celsius: { min: -40, max: 65 },
  };
  for (const [key, range] of Object.entries(numericColumns)) {
    const value = body[key];
    if (value !== undefined && value !== null &&
        (typeof value !== "number" || !Number.isFinite(value) || value < range.min || value > range.max)) {
      return res.status(400).json({ success: false, error: `INVALID_${key.toUpperCase()}` });
    }
  }
  if (body.health_score !== undefined && body.health_score !== null &&
      (!Number.isInteger(body.health_score) || body.health_score < 0 || body.health_score > 100)) {
    return res.status(400).json({ success: false, error: "INVALID_HEALTH_SCORE" });
  }
  if (body.sample_depth_cm !== undefined && body.sample_depth_cm !== null &&
      (!Number.isInteger(body.sample_depth_cm) || body.sample_depth_cm < 1 || body.sample_depth_cm > 200)) {
    return res.status(400).json({ success: false, error: "INVALID_SAMPLE_DEPTH" });
  }

  const payloadForSize = {
    sensor_data: body.sensor_data,
    analysis_result: body.analysis_result ?? null,
    recommendations: body.recommendations ?? null,
    location: body.location ?? null,
    weather_conditions: body.weather_conditions ?? null,
  };
  if (!withinJsonLimit(payloadForSize)) {
    return res.status(413).json({ success: false, error: "ANALYSIS_PAYLOAD_TOO_LARGE" });
  }

  const db = scopedClientFromAuthHeader(req.header("authorization"));
  if (!db) {
    return res.status(503).json({
      success: false,
      error: "DATABASE_UNAVAILABLE",
      message: "Authenticated database access is not configured.",
    });
  }

  try {
    // RLS makes a foreign or nonexistent farm indistinguishable (404).
    const { data: farm, error: farmError } = await db
      .from("farms").select("id").eq("id", farmId).maybeSingle();
    if (farmError) throw farmError;
    if (!farm) return res.status(404).json({ success: false, error: "FARM_NOT_FOUND" });

    if (fieldId) {
      const { data: field, error: fieldError } = await db
        .from("farm_sections").select("id").eq("id", fieldId).eq("farm_id", farmId).maybeSingle();
      if (fieldError) throw fieldError;
      if (!field) return res.status(404).json({ success: false, error: "FIELD_NOT_FOUND" });
    }

    // Allow-list prevents callers overriding IDs, ownership, or timestamps.
    const insertRow: Record<string, unknown> = {
      farm_id: farmId,
      section_id: fieldId ?? null,
      analysis_type: analysisType,
      sensor_data: body.sensor_data,
      analyzed_at: typeof body.analyzed_at === "string" && !Number.isNaN(Date.parse(body.analyzed_at))
        ? new Date(body.analyzed_at).toISOString()
        : new Date().toISOString(),
    };

    for (const key of [
      "analysis_result", "recommendations", "ph_level", "nitrogen_level",
      "phosphorus_level", "potassium_level", "organic_matter_percent",
      "moisture_percent", "temperature_celsius", "health_score", "location",
      "sample_depth_cm", "weather_conditions",
    ]) {
      if (body[key] !== undefined) insertRow[key] = body[key];
    }

    const { data, error } = await db.from("soil_analyses")
      .insert(insertRow)
      .select("id, farm_id, section_id, analysis_type, analyzed_at, created_at")
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("[soil-analysis] Save failed:", error);
    return res.status(500).json({
      success: false,
      error: "SOIL_ANALYSIS_SAVE_FAILED",
      message: "The soil analysis could not be saved.",
    });
  }
};


/**
 * Read the signed-in caller's soil-analysis history for one farm, optionally
 * narrowed to a field. Supabase RLS remains the ownership boundary.
 */
export const getSoilAnalysisHistory: RequestHandler = async (req, res) => {
  if (req.identitySource !== "jwt" || !req.userId) {
    return res.status(401).json({ success: false, error: "AUTHENTICATION_REQUIRED" });
  }

  const farmId = req.query.farm_id;
  const fieldId = req.query.field_id;
  if (typeof farmId !== "string" || !UUID_RE.test(farmId)) {
    return res.status(400).json({ success: false, error: "INVALID_FARM_ID" });
  }
  if (fieldId !== undefined && (typeof fieldId !== "string" || !UUID_RE.test(fieldId))) {
    return res.status(400).json({ success: false, error: "INVALID_FIELD_ID" });
  }

  const rawLimit = req.query.limit;
  const limit = rawLimit === undefined ? 20 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, error: "INVALID_LIMIT" });
  }

  const db = scopedClientFromAuthHeader(req.header("authorization"));
  if (!db) {
    return res.status(503).json({ success: false, error: "DATABASE_UNAVAILABLE" });
  }

  try {
    const { data: farm, error: farmError } = await db
      .from("farms").select("id").eq("id", farmId).maybeSingle();
    if (farmError) throw farmError;
    if (!farm) return res.status(404).json({ success: false, error: "FARM_NOT_FOUND" });

    if (fieldId) {
      const { data: field, error: fieldError } = await db
        .from("farm_sections").select("id").eq("id", fieldId).eq("farm_id", farmId).maybeSingle();
      if (fieldError) throw fieldError;
      if (!field) return res.status(404).json({ success: false, error: "FIELD_NOT_FOUND" });
    }

    let query = db.from("soil_analyses")
      .select("id, farm_id, section_id, analysis_type, sensor_data, analysis_result, recommendations, ph_level, nitrogen_level, phosphorus_level, potassium_level, organic_matter_percent, moisture_percent, temperature_celsius, health_score, fertility_level, location, sample_depth_cm, weather_conditions, analyzed_at, created_at")
      .eq("farm_id", farmId);
    if (fieldId) query = query.eq("section_id", fieldId);
    const { data, error } = await query
      .order("analyzed_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return res.json({
      success: true,
      data: data ?? [],
      meta: { farm_id: farmId, field_id: fieldId ?? null, limit, count: data?.length ?? 0 },
    });
  } catch (error) {
    console.error("[soil-analysis] History read failed:", error);
    return res.status(500).json({
      success: false,
      error: "SOIL_ANALYSIS_HISTORY_FAILED",
      message: "The soil-analysis history could not be loaded.",
    });
  }
};

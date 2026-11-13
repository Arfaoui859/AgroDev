/**
 * Livestock intelligence — real, tenant-scoped persistence.
 *
 * The endpoints here were previously served by a router that generated herds,
 * animals, weights, vaccinations and feed from hard-coded demo arrays, and were
 * then disabled (503) to stop presenting that demo data as real. This module
 * replaces both: every read/write goes through the caller's JWT-scoped Supabase
 * client, so PostgREST evaluates RLS as that user and only their own rows are
 * visible. Nothing is fabricated — an empty herd is an empty list, a missing
 * weight is `null`, and derived values (health alerts, dashboard totals,
 * breeding history) are computed only from the caller's persisted records.
 *
 * Migration: database/livestock-persistence.sql.
 */

import { Router, type Request, type RequestHandler, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SPECIES = new Set([
  "cattle", "dairy_cattle", "beef_cattle", "sheep", "goat", "poultry", "camel", "other",
]);
const SEX = new Set(["male", "female"]);
const HEALTH = new Set(["excellent", "good", "fair", "poor", "sick"]);
const REPRO = new Set(["active", "pregnant", "nursing", "inactive", "unknown"]);
const LIFECYCLE = new Set(["active", "sold", "deceased", "transferred", "quarantine"]);
const PURPOSE = new Set(["dairy", "beef", "wool", "meat", "eggs", "breeding", "mixed", "other"]);
const HEALTH_EVENT_TYPES = new Set(["checkup", "vaccination", "treatment", "illness", "injury", "deworming", "other"]);
const SEVERITY = new Set(["low", "medium", "high", "critical"]);
const REPRO_EVENT_TYPES = new Set(["heat", "insemination", "pregnancy_check", "birth", "abortion", "weaning", "other"]);
const FEED_TYPES = new Set(["hay", "silage", "concentrate", "grain", "mineral", "supplement", "pasture", "other"]);

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function dbFor(req: Request): SupabaseClient | null {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function badId(res: Response) {
  return res.status(400).json({ success: false, code: "INVALID_ID", message: "معرّف غير صالح." });
}

function unavailable(res: Response, error?: { code?: string; message?: string }) {
  const code = error?.code;
  const missingTable = code === "PGRST205" || /Could not find the table/i.test(error?.message ?? "");
  const denied = code === "42501";
  return res.status(denied ? 403 : 503).json({
    success: false,
    code: missingTable
      ? "LIVESTOCK_MIGRATION_REQUIRED"
      : denied
        ? "LIVESTOCK_RLS_DENIED"
        : "LIVESTOCK_DATABASE_UNAVAILABLE",
    databaseCode: code,
    message: missingTable
      ? "جداول الثروة الحيوانية غير موجودة. طبّق database/livestock-persistence.sql في Supabase."
      : denied
        ? "رفضت قاعدة البيانات العملية بسبب صلاحيات RLS أو الملكية."
        : "تعذّر الاتصال بقاعدة بيانات الثروة الحيوانية. لم يتم حفظ العملية.",
  });
}

function num(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function str(value: unknown, max = 4000): string {
  return String(value ?? "").slice(0, max);
}

function optionalUuid(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return null;
  const text = String(value);
  return UUID_PATTERN.test(text) ? text : null;
}

// ---------------------------------------------------------------------------
// Payload validation — the client can never set user_id.
// ---------------------------------------------------------------------------
export function animalPayload(body: any, userId: string) {
  const earTag = str(body.earTag ?? body.ear_tag, 80).trim();
  const species = str(body.species, 40);
  const sex = str(body.gender ?? body.sex, 10);
  const herdId = optionalUuid(body.herdId ?? body.herd_id);
  const farmId = optionalUuid(body.farmId ?? body.farm_id);
  const health = str(body.healthStatus ?? body.health_status ?? "good", 20);
  const repro = str(body.breedingStatus ?? body.reproductive_status ?? "inactive", 20);
  const lifecycle = str(body.lifecycleStatus ?? body.lifecycle_status ?? "active", 20);
  const purpose = str(body.purpose ?? "other", 20);
  const birthDate = body.birthDate ?? body.birth_date;
  const purchaseDate = body.purchaseDate ?? body.purchase_date;
  const initialWeight = num(body.initialWeightKg ?? body.initial_weight_kg);
  const currentWeight = num(body.weight ?? body.currentWeightKg ?? body.current_weight_kg);
  const purchasePrice = num(body.purchasePrice ?? body.purchase_price);

  if (!earTag) return { error: "EAR_TAG_REQUIRED" as const };
  if (!SPECIES.has(species)) return { error: "INVALID_SPECIES" as const };
  if (!SEX.has(sex)) return { error: "INVALID_SEX" as const };
  if (!HEALTH.has(health)) return { error: "INVALID_HEALTH_STATUS" as const };
  if (!REPRO.has(repro)) return { error: "INVALID_REPRODUCTIVE_STATUS" as const };
  if (!LIFECYCLE.has(lifecycle)) return { error: "INVALID_LIFECYCLE_STATUS" as const };
  if (!PURPOSE.has(purpose)) return { error: "INVALID_PURPOSE" as const };
  if (birthDate != null && birthDate !== "" && !isValidISODate(String(birthDate))) return { error: "INVALID_BIRTH_DATE" as const };
  if (purchaseDate != null && purchaseDate !== "" && !isValidISODate(String(purchaseDate))) return { error: "INVALID_PURCHASE_DATE" as const };
  if (Number.isNaN(initialWeight as number) || Number.isNaN(currentWeight as number) || Number.isNaN(purchasePrice as number)) {
    return { error: "INVALID_NUMERIC_VALUE" as const };
  }
  if ((initialWeight as number) !== null && (initialWeight as number) <= 0) return { error: "INVALID_WEIGHT" as const };
  if ((currentWeight as number) !== null && (currentWeight as number) <= 0) return { error: "INVALID_WEIGHT" as const };
  if ((purchasePrice as number) !== null && (purchasePrice as number) < 0) return { error: "INVALID_PURCHASE_PRICE" as const };

  return {
    payload: {
      user_id: userId,
      farm_id: farmId,
      herd_id: herdId,
      ear_tag: earTag,
      rfid: body.rfid ? str(body.rfid, 120) : null,
      species,
      breed: str(body.breed, 120),
      sex,
      birth_date: birthDate ? String(birthDate) : null,
      origin: str(body.origin, 200),
      purchase_date: purchaseDate ? String(purchaseDate) : null,
      purchase_price: purchasePrice as number | null,
      currency: "TND",
      initial_weight_kg: initialWeight as number | null,
      current_weight_kg: currentWeight as number | null,
      purpose,
      health_status: health,
      reproductive_status: repro,
      sire_id: optionalUuid(body.sireId ?? body.sire_id),
      dam_id: optionalUuid(body.damId ?? body.dam_id),
      photo_url: body.photoUrl ? str(body.photoUrl, 800) : null,
      lifecycle_status: lifecycle,
      notes: str(body.notes),
    },
  };
}

// ---------------------------------------------------------------------------
// Row -> API shape. Matches the existing frontend `Animal` interface.
// ---------------------------------------------------------------------------
function animalRecord(row: any, derived: { lastHealthCheck?: string | null; vaccinations?: any[]; breedingHistory?: any[] } = {}) {
  return {
    id: row.id,
    earTag: row.ear_tag,
    rfid: row.rfid ?? null,
    species: row.species,
    breed: row.breed ?? "",
    gender: row.sex,
    birthDate: row.birth_date ?? null,
    age: row.birth_date ? Math.max(0, Math.floor((Date.now() - Date.parse(row.birth_date)) / 31_556_952_000)) : null,
    weight: row.current_weight_kg != null ? Number(row.current_weight_kg) : null,
    initialWeightKg: row.initial_weight_kg != null ? Number(row.initial_weight_kg) : null,
    healthStatus: row.health_status,
    breedingStatus: row.reproductive_status,
    purpose: row.purpose,
    lifecycleStatus: row.lifecycle_status,
    farmId: row.farm_id ?? null,
    herdId: row.herd_id ?? null,
    location: row.farm_id ?? "",
    currentValue: row.purchase_price != null ? Number(row.purchase_price) : null,
    currency: row.currency ?? "TND",
    sireId: row.sire_id ?? null,
    damId: row.dam_id ?? null,
    lastHealthCheck: derived.lastHealthCheck ?? null,
    vaccinationStatus: derived.vaccinations ?? [],
    breedingHistory: derived.breedingHistory ?? [],
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

async function decorateAnimals(db: SupabaseClient, userId: string, rows: any[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: health }, { data: repro }] = await Promise.all([
    db.from("livestock_health_events").select("animal_id,event_type,event_date,diagnosis,veterinarian,severity,resolved").eq("user_id", userId).in("animal_id", ids),
    db.from("livestock_reproduction_events").select("animal_id,event_type,event_date,outcome").eq("user_id", userId).in("animal_id", ids),
  ]);
  const byAnimal = new Map<string, any[]>();
  const lastCheck = new Map<string, string>();
  for (const event of health ?? []) {
    const list = byAnimal.get(event.animal_id) ?? [];
    list.push(event);
    byAnimal.set(event.animal_id, list);
    const current = lastCheck.get(event.animal_id);
    if (!current || event.event_date > current) lastCheck.set(event.animal_id, event.event_date);
  }
  const reproByAnimal = new Map<string, any[]>();
  for (const event of repro ?? []) {
    const list = reproByAnimal.get(event.animal_id) ?? [];
    list.push(event);
    reproByAnimal.set(event.animal_id, list);
  }
  return rows.map((row) => {
    const events = byAnimal.get(row.id) ?? [];
    const vaccinations = events
      .filter((e) => e.event_type === "vaccination")
      .map((e) => ({
        vaccineType: e.diagnosis || "vaccination",
        dateAdministered: e.event_date,
        veterinarian: e.veterinarian ?? null,
        batchNumber: null,
      }));
    const breedingHistory = (reproByAnimal.get(row.id) ?? [])
      .filter((e) => e.event_type === "insemination" || e.event_type === "pregnancy_check" || e.event_type === "birth")
      .map((e) => ({
        matingDate: e.event_date,
        success: e.outcome === "pregnant" || e.outcome === "success" || e.event_type === "birth",
      }));
    return animalRecord(row, { lastHealthCheck: lastCheck.get(row.id) ?? null, vaccinations, breedingHistory });
  });
}

async function requireOwnedAnimal(db: SupabaseClient, userId: string, animalId: string) {
  const { data, error } = await db.from("livestock_animals").select("id").eq("id", animalId).eq("user_id", userId).maybeSingle();
  if (error) return { error };
  return { owned: Boolean(data) };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
export const listAnimals: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db.from("livestock_animals").select("*").eq("user_id", req.userId).order("created_at", { ascending: false });
  if (req.query.species) query = query.eq("species", String(req.query.species));
  if (req.query.healthStatus) query = query.eq("health_status", String(req.query.healthStatus));
  if (req.query.herdId && UUID_PATTERN.test(String(req.query.herdId))) query = query.eq("herd_id", String(req.query.herdId));
  if (req.query.farmId && UUID_PATTERN.test(String(req.query.farmId))) query = query.eq("farm_id", String(req.query.farmId));
  const { data, error } = await query;
  if (error) {
    console.error("List animals failed:", error.code);
    return unavailable(res, error);
  }
  const animals = await decorateAnimals(db, req.userId!, data ?? []);
  const summary = {
    totalAnimals: animals.length,
    healthyAnimals: animals.filter((a) => a.healthStatus === "excellent" || a.healthStatus === "good").length,
    breedingAnimals: animals.filter((a) => a.breedingStatus === "active" || a.breedingStatus === "pregnant").length,
    totalValue: animals.reduce((sum, a) => sum + (a.currentValue ?? 0), 0),
  };
  res.set("X-Data-Provenance", "supabase.livestock_animals");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data: animals, summary, isRealData: true, provenance: { source: "supabase.livestock_animals", persisted: true } });
};

export const createAnimal: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const parsed = animalPayload(req.body ?? {}, req.userId!);
  if ("error" in parsed) return res.status(400).json({ success: false, code: parsed.error, message: "تحقق من بيانات الحيوان." });
  const { data, error } = await db.from("livestock_animals").insert(parsed.payload).select("*").single();
  if (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, code: "EAR_TAG_ALREADY_EXISTS", message: "رقم العلامة مستعمل مسبقاً." });
    console.error("Create animal failed:", error.code);
    return unavailable(res, error);
  }
  return res.status(201).json({ success: true, data: animalRecord(data), provenance: { source: "supabase.livestock_animals", persisted: true } });
};

export const getAnimal: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const { data, error } = await db.from("livestock_animals").select("*").eq("id", req.params.id).eq("user_id", req.userId).maybeSingle();
  if (error) return unavailable(res, error);
  if (!data) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  const [animal] = await decorateAnimals(db, req.userId!, [data]);
  return res.json({ success: true, data: animal, provenance: { source: "supabase.livestock_animals", persisted: true } });
};

export const updateAnimal: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const parsed = animalPayload(req.body ?? {}, req.userId!);
  if ("error" in parsed) return res.status(400).json({ success: false, code: parsed.error, message: "تحقق من بيانات الحيوان." });
  const { user_id: _ignored, ...updates } = parsed.payload;
  const { data, error } = await db
    .from("livestock_animals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select("*")
    .maybeSingle();
  if (error) return unavailable(res, error);
  if (!data) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  return res.json({ success: true, data: animalRecord(data), provenance: { source: "supabase.livestock_animals", persisted: true } });
};

export const deleteAnimal: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const { data, error } = await db.from("livestock_animals").delete().eq("id", req.params.id).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) return unavailable(res, error);
  if (!data) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.livestock_animals", persisted: true } });
};

// --- Weight records -------------------------------------------------------
export const listWeights: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const { data, error } = await db
    .from("livestock_weight_records")
    .select("*")
    .eq("user_id", req.userId)
    .eq("animal_id", req.params.id)
    .order("measured_at", { ascending: false });
  if (error) return unavailable(res, error);
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.livestock_weight_records", persisted: true } });
};

export const createWeight: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const weight = num(req.body?.weightKg ?? req.body?.weight);
  if (weight === null || Number.isNaN(weight as number) || (weight as number) <= 0) {
    return res.status(400).json({ success: false, code: "INVALID_WEIGHT", message: "الوزن يجب أن يكون رقماً موجباً." });
  }
  const owned = await requireOwnedAnimal(db, req.userId!, req.params.id);
  if (owned.error) return unavailable(res, owned.error);
  if (!owned.owned) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  const measuredAt = req.body?.measuredAt ? String(req.body.measuredAt) : new Date().toISOString().slice(0, 10);
  if (!isValidISODate(measuredAt)) return res.status(400).json({ success: false, code: "INVALID_DATE" });
  const { data, error } = await db
    .from("livestock_weight_records")
    .insert({ user_id: req.userId, animal_id: req.params.id, weight_kg: weight as number, measured_at: measuredAt, method: str(req.body?.method ?? "scale", 20), notes: str(req.body?.notes) })
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  // Keep the animal's current weight in step with the latest measurement.
  await db.from("livestock_animals").update({ current_weight_kg: weight as number, updated_at: new Date().toISOString() }).eq("id", req.params.id).eq("user_id", req.userId);
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.livestock_weight_records", persisted: true } });
};

// --- Production records ---------------------------------------------------
const PRODUCTION_TYPES = new Set(["milk", "eggs", "wool", "meat", "weight_gain", "other"]);
const PRODUCTION_UNITS = new Set(["liters", "kg", "pieces", "grams"]);
const PRODUCTION_QUALITY = new Set(["A", "B", "C", "Premium", "rejected"]);

/** Build the persisted row for a production record, validating every field. */
export function productionRecordPayload(body: any, userId: string) {
  const animalId = optionalUuid(body.animalId ?? body.animal_id);
  if (!animalId) return { error: "ANIMAL_ID_REQUIRED" as const };
  const productionType = str(body.productionType ?? body.production_type ?? body.type, 20);
  if (!PRODUCTION_TYPES.has(productionType)) return { error: "INVALID_PRODUCTION_TYPE" as const };
  const quantity = num(body.quantity);
  if (quantity === null || Number.isNaN(quantity as number) || (quantity as number) <= 0) {
    return { error: "INVALID_QUANTITY" as const };
  }
  const unit = str(body.unit, 20);
  if (!PRODUCTION_UNITS.has(unit)) return { error: "INVALID_UNIT" as const };
  const quality = str(body.quality ?? "A", 20);
  if (!PRODUCTION_QUALITY.has(quality)) return { error: "INVALID_QUALITY" as const };
  const recordedAt = body.recordedAt ?? body.recorded_at ?? body.date ?? new Date().toISOString().slice(0, 10);
  if (!isValidISODate(String(recordedAt))) return { error: "INVALID_DATE" as const };
  const price = num(body.pricePerUnit ?? body.price_per_unit ?? body.price);
  if (price !== null && (Number.isNaN(price) || price < 0)) return { error: "INVALID_PRICE" as const };
  const fat = num(body.fatContent ?? body.fat_content);
  const protein = num(body.proteinContent ?? body.protein_content);
  const temperature = num(body.temperature ?? body.temperature_c);
  return {
    payload: {
      user_id: userId,
      animal_id: animalId,
      production_type: productionType,
      quantity: quantity as number,
      unit,
      quality,
      recorded_at: String(recordedAt),
      price_per_unit: price === null || Number.isNaN(price) ? null : price,
      fat_content: fat === null || Number.isNaN(fat) ? null : fat,
      protein_content: protein === null || Number.isNaN(protein) ? null : protein,
      temperature_c: temperature === null || Number.isNaN(temperature) ? null : temperature,
      notes: str(body.notes),
    },
  };
}

export const listProductionRecords: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db
    .from("livestock_production_records")
    .select("*")
    .eq("user_id", req.userId)
    .order("recorded_at", { ascending: false });
  if (req.query.animalId && UUID_PATTERN.test(String(req.query.animalId))) {
    query = query.eq("animal_id", String(req.query.animalId));
  }
  if (req.query.productionType) query = query.eq("production_type", String(req.query.productionType));
  const { data, error } = await query;
  if (error) return unavailable(res, error);
  return res.json({
    success: true,
    data: data ?? [],
    provenance: { source: "supabase.livestock_production_records", persisted: true },
  });
};

export const createProductionRecord: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const parsed = productionRecordPayload(req.body, req.userId!);
  if ("error" in parsed) {
    return res.status(400).json({ success: false, code: parsed.error, message: "بيانات سجل الإنتاج غير صالحة." });
  }
  const owned = await requireOwnedAnimal(db, req.userId!, parsed.payload.animal_id);
  if (owned.error) return unavailable(res, owned.error);
  if (!owned.owned) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  const { data, error } = await db
    .from("livestock_production_records")
    .insert(parsed.payload)
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  return res.status(201).json({
    success: true,
    data,
    provenance: { source: "supabase.livestock_production_records", persisted: true },
  });
};

export const deleteProductionRecord: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const { data, error } = await db
    .from("livestock_production_records")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select("id")
    .maybeSingle();
  if (error) return unavailable(res, error);
  if (!data) return res.status(404).json({ success: false, code: "PRODUCTION_RECORD_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.livestock_production_records", persisted: true } });
};

// --- Health events --------------------------------------------------------
export const listHealthEvents: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db.from("livestock_health_events").select("*").eq("user_id", req.userId).order("event_date", { ascending: false });
  if (req.query.animalId && UUID_PATTERN.test(String(req.query.animalId))) query = query.eq("animal_id", String(req.query.animalId));
  const { data, error } = await query;
  if (error) return unavailable(res, error);
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.livestock_health_events", persisted: true } });
};

export const createHealthEvent: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const animalId = optionalUuid(req.body?.animalId ?? req.body?.animal_id);
  const eventType = str(req.body?.eventType ?? req.body?.event_type, 30);
  const severity = str(req.body?.severity ?? "low", 20);
  const eventDate = req.body?.eventDate ?? req.body?.event_date ?? new Date().toISOString().slice(0, 10);
  if (!animalId) return res.status(400).json({ success: false, code: "ANIMAL_ID_REQUIRED" });
  if (!HEALTH_EVENT_TYPES.has(eventType)) return res.status(400).json({ success: false, code: "INVALID_EVENT_TYPE" });
  if (!SEVERITY.has(severity)) return res.status(400).json({ success: false, code: "INVALID_SEVERITY" });
  if (!isValidISODate(String(eventDate))) return res.status(400).json({ success: false, code: "INVALID_DATE" });
  const owned = await requireOwnedAnimal(db, req.userId!, animalId);
  if (owned.error) return unavailable(res, owned.error);
  if (!owned.owned) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  const { data, error } = await db
    .from("livestock_health_events")
    .insert({
      user_id: req.userId,
      animal_id: animalId,
      event_type: eventType,
      severity,
      diagnosis: str(req.body?.diagnosis, 500),
      treatment: str(req.body?.treatment, 1000),
      veterinarian: req.body?.veterinarian ? str(req.body.veterinarian, 200) : null,
      event_date: String(eventDate),
      resolved: req.body?.resolved === true,
      notes: str(req.body?.notes),
    })
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  // An illness/injury at high severity is reflected in the animal's status.
  if ((eventType === "illness" || eventType === "injury") && (severity === "high" || severity === "critical")) {
    await db.from("livestock_animals").update({ health_status: "sick", updated_at: new Date().toISOString() }).eq("id", animalId).eq("user_id", req.userId);
  }
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.livestock_health_events", persisted: true } });
};

export const resolveHealthEvent: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) return badId(res);
  const { data, error } = await db
    .from("livestock_health_events")
    .update({ resolved: true, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("user_id", req.userId)
    .select("*")
    .maybeSingle();
  if (error) return unavailable(res, error);
  if (!data) return res.status(404).json({ success: false, code: "HEALTH_EVENT_NOT_FOUND" });
  return res.json({ success: true, data, provenance: { source: "supabase.livestock_health_events", persisted: true } });
};

export const getHealthAlerts: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const [{ data: animals, error: animalsError }, { data: events, error: eventsError }] = await Promise.all([
    db.from("livestock_animals").select("id,ear_tag,health_status").eq("user_id", req.userId),
    db.from("livestock_health_events").select("id,animal_id,event_type,severity,diagnosis,event_date,resolved").eq("user_id", req.userId).eq("resolved", false),
  ]);
  if (animalsError) return unavailable(res, animalsError);
  if (eventsError) return unavailable(res, eventsError);
  const tagById = new Map((animals ?? []).map((a: any) => [a.id, a.ear_tag]));
  const alerts: any[] = [];
  for (const animal of animals ?? []) {
    if (animal.health_status === "sick" || animal.health_status === "poor") {
      alerts.push({
        id: `status_${animal.id}`,
        animalId: animal.id,
        earTag: animal.ear_tag,
        alertType: "health_status",
        severity: animal.health_status === "sick" ? "high" : "medium",
        message: animal.health_status === "sick" ? "الحيوان مصنّف كمريض ويحتاج متابعة بيطرية." : "حالة الحيوان ضعيفة.",
        dateCreated: new Date().toISOString(),
        resolved: false,
      });
    }
  }
  for (const event of events ?? []) {
    if (event.severity === "high" || event.severity === "critical") {
      alerts.push({
        id: event.id,
        animalId: event.animal_id,
        earTag: tagById.get(event.animal_id) ?? null,
        alertType: event.event_type,
        severity: event.severity,
        message: event.diagnosis || `حدث صحي غير معالج (${event.event_type}).`,
        dateCreated: event.event_date,
        resolved: event.resolved,
      });
    }
  }
  res.set("X-Data-Provenance", "supabase.livestock_animals+livestock_health_events");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data: alerts, isRealData: true, provenance: { source: "derived from persisted records", persisted: true } });
};

// --- Reproduction events --------------------------------------------------
export const listReproductionEvents: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db.from("livestock_reproduction_events").select("*").eq("user_id", req.userId).order("event_date", { ascending: false });
  if (req.query.animalId && UUID_PATTERN.test(String(req.query.animalId))) query = query.eq("animal_id", String(req.query.animalId));
  const { data, error } = await query;
  if (error) return unavailable(res, error);
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.livestock_reproduction_events", persisted: true } });
};

export const createReproductionEvent: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const animalId = optionalUuid(req.body?.animalId ?? req.body?.animal_id);
  const eventType = str(req.body?.eventType ?? req.body?.event_type, 30);
  const eventDate = req.body?.eventDate ?? req.body?.event_date ?? new Date().toISOString().slice(0, 10);
  if (!animalId) return res.status(400).json({ success: false, code: "ANIMAL_ID_REQUIRED" });
  if (!REPRO_EVENT_TYPES.has(eventType)) return res.status(400).json({ success: false, code: "INVALID_EVENT_TYPE" });
  if (!isValidISODate(String(eventDate))) return res.status(400).json({ success: false, code: "INVALID_DATE" });
  const owned = await requireOwnedAnimal(db, req.userId!, animalId);
  if (owned.error) return unavailable(res, owned.error);
  if (!owned.owned) return res.status(404).json({ success: false, code: "ANIMAL_NOT_FOUND" });
  const { data, error } = await db
    .from("livestock_reproduction_events")
    .insert({
      user_id: req.userId,
      animal_id: animalId,
      event_type: eventType,
      method: req.body?.method ? str(req.body.method, 30) : null,
      event_date: String(eventDate),
      sire_tag: req.body?.sireTag ? str(req.body.sireTag, 80) : null,
      outcome: req.body?.outcome ? str(req.body.outcome, 60) : null,
      expected_due_date: req.body?.expectedDueDate && isValidISODate(String(req.body.expectedDueDate)) ? String(req.body.expectedDueDate) : null,
      notes: str(req.body?.notes),
    })
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  if (eventType === "pregnancy_check" && req.body?.outcome === "pregnant") {
    await db.from("livestock_animals").update({ reproductive_status: "pregnant", updated_at: new Date().toISOString() }).eq("id", animalId).eq("user_id", req.userId);
  }
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.livestock_reproduction_events", persisted: true } });
};

// --- Herds ----------------------------------------------------------------
export const listHerds: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const { data, error } = await db.from("livestock_herds").select("*").eq("user_id", req.userId).order("created_at", { ascending: false });
  if (error) return unavailable(res, error);
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.livestock_herds", persisted: true } });
};

export const createHerd: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const name = str(req.body?.name, 160).trim();
  const species = str(req.body?.species, 40);
  const purpose = str(req.body?.purpose ?? "other", 20);
  const farmId = optionalUuid(req.body?.farmId ?? req.body?.farm_id);
  if (!name) return res.status(400).json({ success: false, code: "NAME_REQUIRED" });
  if (!SPECIES.has(species)) return res.status(400).json({ success: false, code: "INVALID_SPECIES" });
  if (!PURPOSE.has(purpose)) return res.status(400).json({ success: false, code: "INVALID_PURPOSE" });
  const { data, error } = await db
    .from("livestock_herds")
    .insert({ user_id: req.userId, farm_id: farmId, name, species, purpose, description: str(req.body?.description) })
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.livestock_herds", persisted: true } });
};

// --- Feed inventory -------------------------------------------------------
export const listFeedInventory: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const { data, error } = await db.from("livestock_feed_inventory").select("*").eq("user_id", req.userId).order("feed_name");
  if (error) return unavailable(res, error);
  const inventory = (data ?? []).map((row: any) => ({
    id: row.id,
    feedName: row.feed_name,
    feedType: row.feed_type,
    quantity: Number(row.quantity_kg),
    reorderLevelKg: Number(row.reorder_level_kg),
    unitCost: row.unit_cost != null ? Number(row.unit_cost) : null,
    currency: row.currency ?? "TND",
    supplier: row.supplier ?? null,
    lowStock: Number(row.quantity_kg) <= Number(row.reorder_level_kg),
    notes: row.notes ?? "",
  }));
  res.set("X-Data-Provenance", "supabase.livestock_feed_inventory");
  res.set("X-Is-Real-Data", "true");
  return res.json({ success: true, data: inventory, isRealData: true, provenance: { source: "supabase.livestock_feed_inventory", persisted: true } });
};

export const createFeedItem: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const feedName = str(req.body?.feedName ?? req.body?.feed_name, 160).trim();
  const feedType = str(req.body?.feedType ?? req.body?.feed_type ?? "other", 30);
  const quantity = num(req.body?.quantityKg ?? req.body?.quantity ?? 0);
  const reorder = num(req.body?.reorderLevelKg ?? req.body?.reorder_level_kg ?? 0);
  const unitCost = num(req.body?.unitCost ?? req.body?.unit_cost);
  if (!feedName) return res.status(400).json({ success: false, code: "FEED_NAME_REQUIRED" });
  if (!FEED_TYPES.has(feedType)) return res.status(400).json({ success: false, code: "INVALID_FEED_TYPE" });
  if (Number.isNaN(quantity as number) || (quantity as number) < 0 || Number.isNaN(reorder as number) || (reorder as number) < 0 || Number.isNaN(unitCost as number)) {
    return res.status(400).json({ success: false, code: "INVALID_QUANTITY" });
  }
  const { data, error } = await db
    .from("livestock_feed_inventory")
    .insert({
      user_id: req.userId,
      farm_id: optionalUuid(req.body?.farmId ?? req.body?.farm_id),
      feed_name: feedName,
      feed_type: feedType,
      quantity_kg: quantity as number,
      reorder_level_kg: reorder as number,
      unit_cost: unitCost as number | null,
      supplier: req.body?.supplier ? str(req.body.supplier, 160) : null,
      notes: str(req.body?.notes),
    })
    .select("*")
    .single();
  if (error) return unavailable(res, error);
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.livestock_feed_inventory", persisted: true } });
};

// --- Dashboard ------------------------------------------------------------
export const getLivestockDashboard: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const [{ data: animals, error: animalsError }, { data: feed, error: feedError }] = await Promise.all([
    db.from("livestock_animals").select("*").eq("user_id", req.userId),
    db.from("livestock_feed_inventory").select("quantity_kg,reorder_level_kg,unit_cost").eq("user_id", req.userId),
  ]);
  if (animalsError) return unavailable(res, animalsError);
  if (feedError) return unavailable(res, feedError);
  const rows = animals ?? [];
  const bySpecies: Record<string, number> = {};
  const byHealth: Record<string, number> = {};
  let totalValue = 0;
  for (const row of rows) {
    bySpecies[row.species] = (bySpecies[row.species] ?? 0) + 1;
    byHealth[row.health_status] = (byHealth[row.health_status] ?? 0) + 1;
    totalValue += row.purchase_price != null ? Number(row.purchase_price) : 0;
  }
  const lowStock = (feed ?? []).filter((f: any) => Number(f.quantity_kg) <= Number(f.reorder_level_kg)).length;
  res.set("X-Data-Provenance", "supabase.livestock_*");
  res.set("X-Is-Real-Data", "true");
  return res.json({
    success: true,
    data: {
      totalAnimals: rows.length,
      bySpecies,
      byHealthStatus: byHealth,
      totalValue,
      currency: "TND",
      feedItemsLowStock: lowStock,
    },
    isRealData: true,
    provenance: { source: "supabase.livestock_animals+livestock_feed_inventory", persisted: true },
  });
};

/**
 * Feed ration optimization requires each feed's nutritional composition and
 * validated requirement tables. AgroGrowth stores neither yet, so this endpoint
 * returns an honest "not computed" state instead of inventing a ration. The
 * caller still receives their real inventory so the UI can show what exists.
 */
export const optimizeFeedBudget: RequestHandler = async (_req, res) => {
  res.set("X-Data-Provenance", "not-computed");
  res.set("X-Is-Real-Data", "false");
  return res.json({
    success: true,
    data: [],
    computed: false,
    isRealData: false,
    reason: "NUTRITIONAL_PROFILE_REQUIRED",
    message: "لا يمكن حساب تركيبة العلف دون جدول تحليلي موثّق لمكوّنات الأعلاف ومتطلبات كل نوع ووزن. لم تُختلق أي أرقام.",
    provenance: { source: null, verified: false },
  });
};

// ---------------------------------------------------------------------------
// Router mounted at /api/livestock-management
// ---------------------------------------------------------------------------
const router = Router();

router.get("/animals", listAnimals);
router.post("/animals", createAnimal);
router.get("/animals/:id", getAnimal);
router.patch("/animals/:id", updateAnimal);
router.delete("/animals/:id", deleteAnimal);

router.get("/animals/:id/weights", listWeights);
router.post("/animals/:id/weights", createWeight);

router.get("/production-records", listProductionRecords);
router.post("/production-records", createProductionRecord);
router.delete("/production-records/:id", deleteProductionRecord);

router.get("/health-events", listHealthEvents);
router.post("/health-events", createHealthEvent);
router.patch("/health-events/:id/resolve", resolveHealthEvent);
router.get("/health-alerts", getHealthAlerts);

router.get("/reproduction-events", listReproductionEvents);
router.post("/reproduction-events", createReproductionEvent);

router.get("/herds", listHerds);
router.post("/herds", createHerd);

router.get("/feed-inventory", listFeedInventory);
router.post("/feed-inventory", createFeedItem);
router.post("/feed-optimization", optimizeFeedBudget);

export default router;

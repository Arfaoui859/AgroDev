import type { Request, RequestHandler, Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { scopedClientFromAuthHeader } from "../lib/supabase";
import { markReal } from "../lib/provenance";

/**
 * Comprehensive farm-management dashboard.
 *
 * The previous implementation generated random alerts, crops, weather, market
 * prices, equipment and payroll figures. Every figure here now comes from the
 * caller's own persisted rows, read through a caller-scoped Supabase client so
 * RLS evaluates `auth.uid()` as that user. Nothing is invented: a domain with
 * no connected source (a live weather feed, a labour register) reports `null`
 * or an empty collection rather than a plausible-looking number.
 */

type Row = Record<string, any>;

function dbFor(req: Request): SupabaseClient | null {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

/** The caller's farm ids, used to scope every child-table query. */
async function ownedFarmIds(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from("farms").select("id");
  if (error) throw error;
  return (data ?? []).map((f: Row) => f.id);
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function severityOf(priority: unknown): "critical" | "high" | "medium" | "low" {
  switch (String(priority)) {
    case "urgent":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

const TASK_CATEGORY_AR: Record<string, string> = {
  planting: "زراعة",
  irrigation: "ري",
  fertilization: "تسميد",
  pest_control: "مكافحة الآفات",
  harvesting: "حصاد",
  maintenance: "صيانة",
  inspection: "فحص",
  general: "عام",
};

const TASK_STATUS_AR: Record<string, string> = {
  pending: "قيد الانتظار",
  in_progress: "قيد التنفيذ",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

/**
 * Build the overview from the caller's persisted rows. Pure function so the
 * mapping can be unit-tested without a database.
 */
export function buildFarmOverview(input: {
  farms: Row[];
  sections: Row[];
  cultivations: Row[];
  tasks: Row[];
  equipment: Row[];
  revenues: Row[];
  expenses: Row[];
  notifications: Row[];
  marketPrices: Row[];
  weather: Row | null;
}) {
  const {
    farms,
    sections,
    cultivations,
    tasks,
    equipment,
    revenues,
    expenses,
    notifications,
    marketPrices,
    weather,
  } = input;

  const activeCultivations = cultivations.filter((c) => c.status === "active");
  const openTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress",
  );
  const operationalEquipment = equipment.filter((e) => e.status === "active").length;
  const unreadAlerts = notifications.filter((n) => !n.read_at);

  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = revenues
    .filter((r) => String(r.revenue_date || "").slice(0, 10) === today)
    .reduce((sum, r) => sum + num(r.amount), 0);

  const totalArea = farms.reduce((sum, f) => sum + num(f.size_hectares), 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + num(r.amount), 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + num(r.amount), 0);

  const alerts = unreadAlerts.slice(0, 20).map((n) => ({
    id: n.id,
    type: n.type || "notification",
    typeArabic: TASK_CATEGORY_AR[n.category] || n.category || "تنبيه",
    severity: severityOf(n.priority),
    title: n.title || "",
    titleArabic: n.title || "",
    message: n.message || "",
    messageArabic: n.message || "",
    location: n.metadata?.location || "",
    locationArabic: n.metadata?.location || "",
    cropAffected: n.metadata?.crop || "",
    cropAffectedArabic: n.metadata?.crop || "",
    resolved: Boolean(n.read_at),
    timestamp: n.created_at,
  }));

  const taskList = openTasks.slice(0, 50).map((t) => ({
    id: t.id,
    title: t.title || "",
    titleArabic: t.title || "",
    description: t.description || "",
    descriptionArabic: t.description || "",
    category: t.task_type || "general",
    categoryArabic: TASK_CATEGORY_AR[t.task_type] || "عام",
    priority: t.priority || "medium",
    status: t.status || "pending",
    statusArabic: TASK_STATUS_AR[t.status] || t.status || "",
    dueDate: t.due_date,
    location: "",
    locationArabic: "",
    assignedTo: t.assigned_to || "",
    assignedToArabic: t.assigned_to || "",
    estimatedDuration: "",
    cost: 0,
  }));

  const cropList = activeCultivations.slice(0, 50).map((c) => ({
    id: c.id,
    name: c.crop_name || "",
    nameArabic: c.crop_name || "",
    variety: c.crop_variety || "",
    area: num(c.area_hectares),
    stage: c.current_growth_stage || "",
    plantedDate: c.planting_date,
    expectedHarvest: c.expected_harvest_date,
    // No persisted soil-moisture telemetry is wired, so report null rather
    // than a fabricated percentage.
    soilMoisture: null,
    healthScore: null,
    healthStatus: null,
  }));

  // Market quotes are public reference rows. Report the latest quote per crop.
  const latestByCrop = new Map<string, Row>();
  for (const price of marketPrices) {
    const key = price.crop_name;
    if (!latestByCrop.has(key)) latestByCrop.set(key, price);
  }
  const market = Array.from(latestByCrop.values()).map((p) => ({
    id: p.id,
    cropName: p.crop_name,
    cropNameArabic: p.crop_name,
    currentPrice: num(p.price_per_kg),
    priceChange: null,
    currency: p.currency || "TND",
    market: p.market_location,
    date: p.price_date,
    source: p.source || null,
  }));

  const weatherBlock = weather
    ? {
        current: {
          temperature: num(weather.temperature_celsius),
          humidity: num(weather.humidity_percent),
          windSpeed: num(weather.wind_speed_kmh),
          pressure: num(weather.pressure_hpa),
          uvIndex: num(weather.uv_index),
          condition: weather.weather_conditions || "",
          conditionArabic: weather.weather_conditions || "",
        },
        forecast: [],
        alerts: [],
        source: weather.source || null,
        recordedAt: weather.record_date,
      }
    : null;

  return {
    summary: {
      totalFarms: farms.length,
      totalArea,
      totalFields: sections.length,
      activeCrops: activeCultivations.length,
      pendingTasks: openTasks.length,
      criticalAlerts: unreadAlerts.filter(
        (n) => severityOf(n.priority) === "critical",
      ).length,
      operationalEquipment,
      // No labour/shift register is persisted, so attendance is not reported.
      workersPresent: null,
      todayRevenue,
      currency: "TND",
    },
    farms: farms.map((f) => ({
      id: f.id,
      name: f.name,
      nameArabic: f.name_ar || f.name,
      sizeHectares: num(f.size_hectares),
      soilType: f.soil_type || null,
      location: f.location || null,
    })),
    alerts,
    tasks: taskList,
    crops: cropList,
    market,
    weather: weatherBlock,
    equipment: equipment.map((e) => ({
      id: e.id,
      name: e.name || "",
      nameArabic: e.name || "",
      type: e.category || "other",
      typeArabic: e.category || "أخرى",
      status: e.status || "unknown",
      // Usage / fuel / next-maintenance telemetry is not persisted.
      usage: null,
      fuel: null,
      nextMaintenance: null,
    })),
    financial: {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      // Profit margin is only meaningful with revenue; report null otherwise
      // rather than a divide-by-zero artefact.
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : null,
      currency: "TND",
    },
    // Domains with no persisted source yet: reported as absent, never filled
    // with synthetic records.
    unavailable: {
      workersPresent: "No labour/shift register is connected.",
      weatherForecast: weather ? null : "No stored weather record for this farm.",
      marketPriceChange: "Live price movement is not available from stored quotes.",
    },
  };
}

async function loadOverview(db: SupabaseClient) {
  const farmIds = await ownedFarmIds(db);

  if (farmIds.length === 0) {
    // Still surface public market quotes; the caller simply owns no farm yet.
    const market = await db
      .from("market_prices")
      .select("*")
      .order("price_date", { ascending: false })
      .limit(50);
    if (market.error) throw market.error;
    return buildFarmOverview({
      farms: [],
      sections: [],
      cultivations: [],
      tasks: [],
      equipment: [],
      revenues: [],
      expenses: [],
      notifications: [],
      marketPrices: market.data ?? [],
      weather: null,
    });
  }

  const [farms, sections, cultivations, tasks, equipment, revenues, expenses, notifications, market, weather] =
    await Promise.all([
      db.from("farms").select("*").order("created_at", { ascending: false }),
      db.from("farm_sections").select("*").in("farm_id", farmIds),
      db.from("crop_cultivations").select("*").in("farm_id", farmIds),
      db.from("farm_tasks").select("*").in("farm_id", farmIds).order("due_date", { ascending: true, nullsFirst: false }),
      db.from("farm_equipment").select("*").in("farm_id", farmIds),
      db.from("farm_revenues").select("*").order("revenue_date", { ascending: false }).limit(200),
      db.from("farm_expenses").select("*").order("expense_date", { ascending: false }).limit(200),
      db.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      db.from("market_prices").select("*").order("price_date", { ascending: false }).limit(50),
      db.from("weather_records").select("*").in("farm_id", farmIds).order("record_date", { ascending: false }).limit(1),
    ]);

  for (const result of [farms, sections, cultivations, tasks, equipment, revenues, expenses, notifications, market, weather]) {
    if (result.error) throw result.error;
  }

  return buildFarmOverview({
    farms: farms.data ?? [],
    sections: sections.data ?? [],
    cultivations: cultivations.data ?? [],
    tasks: tasks.data ?? [],
    equipment: equipment.data ?? [],
    revenues: revenues.data ?? [],
    expenses: expenses.data ?? [],
    notifications: notifications.data ?? [],
    marketPrices: market.data ?? [],
    weather: (weather.data ?? [])[0] ?? null,
  });
}

function unavailable(res: Response, code: string, message: string) {
  res.setHeader("X-AgroGrowth-Data-Status", "unavailable");
  res.setHeader("X-AgroGrowth-Data-Provenance", "unverified");
  return res.status(503).json({
    success: false,
    code,
    message,
    data: null,
    provenance: { source: null, verified: false },
  });
}

export const getComprehensiveFarmDashboard: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) {
    return unavailable(
      res,
      "FARM_MANAGEMENT_DATABASE_UNAVAILABLE",
      "Farm management data requires a signed-in database session.",
    );
  }
  try {
    const data = await loadOverview(db);
    markReal(res, "supabase");
    res.setHeader("X-AgroGrowth-Data-Status", "verified");
    res.setHeader("X-AgroGrowth-Data-Provenance", "supabase");
    res.json({
      success: true,
      data,
      provenance: {
        source: "supabase",
        verified: true,
        limitations: [
          "Figures are read from your own persisted records and public market quotes.",
          "No live weather feed or labour register is connected; those fields are null, not estimated.",
        ],
      },
    });
  } catch (error) {
    console.error("Farm-management overview failed:", (error as Error)?.message);
    unavailable(
      res,
      "FARM_MANAGEMENT_READ_FAILED",
      "تعذّر تحميل بيانات إدارة المزرعة. حاول مجدداً لاحقاً.",
    );
  }
};

export const getFarmAlerts: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    markReal(res, "supabase");
    res.json({ success: true, data: data ?? [], provenance: { source: "supabase.notifications", persisted: true } });
  } catch (error) {
    console.error("Farm alerts read failed:", (error as Error)?.message);
    unavailable(res, "FARM_ALERTS_READ_FAILED", "تعذّر استرجاع التنبيهات.");
  }
};

export const getFarmTasks: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const farmIds = await ownedFarmIds(db);
    if (farmIds.length === 0) {
      markReal(res, "supabase");
      return res.json({ success: true, data: [], provenance: { source: "supabase.farm_tasks", persisted: true } });
    }
    const { data, error } = await db
      .from("farm_tasks")
      .select("*")
      .in("farm_id", farmIds)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    markReal(res, "supabase");
    res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_tasks", persisted: true } });
  } catch (error) {
    console.error("Farm tasks read failed:", (error as Error)?.message);
    unavailable(res, "FARM_TASKS_READ_FAILED", "تعذّر استرجاع المهام.");
  }
};

export const getFarmCrops: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const farmIds = await ownedFarmIds(db);
    if (farmIds.length === 0) {
      markReal(res, "supabase");
      return res.json({ success: true, data: [], provenance: { source: "supabase.crop_cultivations", persisted: true } });
    }
    const { data, error } = await db
      .from("crop_cultivations")
      .select("*")
      .in("farm_id", farmIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    markReal(res, "supabase");
    res.json({ success: true, data: data ?? [], provenance: { source: "supabase.crop_cultivations", persisted: true } });
  } catch (error) {
    console.error("Farm crops read failed:", (error as Error)?.message);
    unavailable(res, "FARM_CROPS_READ_FAILED", "تعذّر استرجاع المحاصيل.");
  }
};

export const getFarmWeather: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const farmIds = await ownedFarmIds(db);
    if (farmIds.length === 0) {
      return res.json({ success: true, data: null, provenance: { source: null, verified: false }, note: "No farm to read weather for." });
    }
    const { data, error } = await db
      .from("weather_records")
      .select("*")
      .in("farm_id", farmIds)
      .order("record_date", { ascending: false })
      .limit(1);
    if (error) throw error;
    const record = (data ?? [])[0] ?? null;
    if (record) markReal(res, "supabase");
    res.json({
      success: true,
      data: record,
      provenance: { source: record ? "supabase.weather_records" : null, persisted: Boolean(record) },
      note: record ? undefined : "No stored weather record for this farm.",
    });
  } catch (error) {
    console.error("Farm weather read failed:", (error as Error)?.message);
    unavailable(res, "FARM_WEATHER_READ_FAILED", "تعذّر استرجاع الطقس.");
  }
};

export const getFarmMarket: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const { data, error } = await db
      .from("market_prices")
      .select("*")
      .order("price_date", { ascending: false })
      .limit(100);
    if (error) throw error;
    markReal(res, "supabase");
    res.json({ success: true, data: data ?? [], provenance: { source: "supabase.market_prices", persisted: true } });
  } catch (error) {
    console.error("Farm market read failed:", (error as Error)?.message);
    unavailable(res, "FARM_MARKET_READ_FAILED", "تعذّر استرجاع بيانات السوق.");
  }
};

export const getFarmEquipment: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const farmIds = await ownedFarmIds(db);
    if (farmIds.length === 0) {
      markReal(res, "supabase");
      return res.json({ success: true, data: [], provenance: { source: "supabase.farm_equipment", persisted: true } });
    }
    const { data, error } = await db
      .from("farm_equipment")
      .select("*")
      .in("farm_id", farmIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    markReal(res, "supabase");
    res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_equipment", persisted: true } });
  } catch (error) {
    console.error("Farm equipment read failed:", (error as Error)?.message);
    unavailable(res, "FARM_EQUIPMENT_READ_FAILED", "تعذّر استرجاع المعدات.");
  }
};

export const getFarmFinancial: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res, "FARM_MANAGEMENT_DATABASE_UNAVAILABLE", "A signed-in database session is required.");
  try {
    const [expenses, revenues] = await Promise.all([
      db.from("farm_expenses").select("*").order("expense_date", { ascending: false }).limit(200),
      db.from("farm_revenues").select("*").order("revenue_date", { ascending: false }).limit(200),
    ]);
    if (expenses.error) throw expenses.error;
    if (revenues.error) throw revenues.error;
    const totalExpenses = (expenses.data ?? []).reduce((s, r) => s + num(r.amount), 0);
    const totalRevenue = (revenues.data ?? []).reduce((s, r) => s + num(r.amount), 0);
    markReal(res, "supabase");
    res.json({
      success: true,
      data: {
        expenses: expenses.data ?? [],
        revenues: revenues.data ?? [],
        summary: {
          totalExpenses,
          totalRevenue,
          profit: totalRevenue - totalExpenses,
          currency: "TND",
        },
      },
      provenance: { source: "supabase.farm_expenses+farm_revenues", persisted: true },
    });
  } catch (error) {
    console.error("Farm financial read failed:", (error as Error)?.message);
    unavailable(res, "FARM_FINANCIAL_READ_FAILED", "تعذّر استرجاع البيانات المالية.");
  }
};

export const getFarmLabor: RequestHandler = async (_req, res) => {
  // No labour/worker register is persisted, so there is nothing truthful to
  // return. Fail closed rather than invent attendance or payroll figures.
  unavailable(
    res,
    "FARM_LABOR_NOT_CONNECTED",
    "No labour/worker register is connected, so no attendance or payroll figure is reported.",
  );
};

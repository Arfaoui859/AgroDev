import type { RequestHandler } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function dbFor(req: Parameters<RequestHandler>[0]) {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function unavailable(res: Parameters<RequestHandler>[1], error?: { code?: string; message?: string }) {
  const databaseCode = error?.code;
  const missingTable = databaseCode === "PGRST205" || /Could not find the table/i.test(error?.message ?? "");
  const denied = databaseCode === "42501";
  return res.status(denied ? 403 : 503).json({
    success: false,
    code: missingTable ? "FARM_FINANCE_MIGRATION_REQUIRED" : denied ? "FARM_FINANCE_RLS_DENIED" : "FARM_FINANCE_DATABASE_UNAVAILABLE",
    databaseCode,
    message: missingTable
      ? "جداول الإدارة المالية غير موجودة. طبّق database/farm-finance-persistence.sql في Supabase."
      : denied
        ? "قاعدة البيانات رفضت العملية بسبب صلاحيات RLS أو ملكية المزرعة."
        : "تعذّر الاتصال بقاعدة البيانات المالية. لم يتم حفظ العملية.",
  });
}

export function expensePayload(body: any, userId: string) {
  const amount = Number(body.amount);
  const date = String(body.date ?? "");
  const category = String(body.category ?? "");
  const currency = String(body.currency ?? "TND").toUpperCase();
  const farmId = body.farm_id == null || body.farm_id === "" ? null : String(body.farm_id);
  const allowed = new Set(["seeds", "fertilizers", "pesticides", "labor", "equipment", "fuel", "maintenance", "utilities", "insurance", "other"]);
  if (!allowed.has(category) || currency !== "TND" || !Number.isFinite(amount) || amount <= 0 ||
      !isValidISODate(date) || (farmId !== null && !UUID_PATTERN.test(farmId))) {
    return null;
  }
  return {
    user_id: userId,
    farm_id: farmId,
    category,
    subcategory: String(body.subcategory ?? "").slice(0, 120),
    amount,
    currency: "TND",
    expense_date: date,
    description: String(body.description ?? "").slice(0, 2000),
    crop_related: body.cropRelated ? String(body.cropRelated).slice(0, 100) : null,
    is_recurring: body.isRecurring === true,
    recurring_period: body.isRecurring === true ? String(body.recurringPeriod ?? "monthly") : null,
    payment_method: String(body.paymentMethod ?? "cash").slice(0, 40),
    supplier: body.supplier ? String(body.supplier).slice(0, 160) : null,
    tags: Array.isArray(body.tags) ? body.tags.filter((x: unknown) => typeof x === "string").slice(0, 30) : [],
  };
}

function expenseRecord(row: any) {
  return {
    id: row.id,
    farmerId: row.user_id,
    farmId: row.farm_id,
    category: row.category,
    subcategory: row.subcategory,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.expense_date,
    description: row.description,
    cropRelated: row.crop_related ?? undefined,
    isRecurring: row.is_recurring,
    recurringPeriod: row.recurring_period ?? undefined,
    paymentMethod: row.payment_method,
    supplier: row.supplier ?? undefined,
    tags: row.tags ?? [],
  };
}

export const createExpense: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const payload = expensePayload(req.body ?? {}, req.userId!);
  if (!payload) return res.status(400).json({ success: false, code: "INVALID_EXPENSE", message: "تحقق من الصنف والمبلغ والتاريخ." });

  const { data, error } = await db.from("farm_expenses").insert(payload).select("*").single();
  if (error) {
    console.error("Create expense failed:", error.code);
    return unavailable(res, error);
  }
  return res.status(201).json({ success: true, data: expenseRecord(data), provenance: { source: "supabase.farm_expenses", persisted: true } });
};

export const getExpenses: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db.from("farm_expenses").select("*").eq("user_id", req.userId).order("expense_date", { ascending: false });
  if (req.query.category) query = query.eq("category", String(req.query.category));
  if (req.query.cropType) query = query.eq("crop_related", String(req.query.cropType));
  if (req.query.startDate) query = query.gte("expense_date", String(req.query.startDate));
  if (req.query.endDate) query = query.lte("expense_date", String(req.query.endDate));
  const { data, error } = await query;
  if (error) {
    console.error("List expenses failed:", error.code);
    return unavailable(res, error);
  }
  const expenses = (data ?? []).map(expenseRecord);
  const categoryTotals = expenses.reduce((totals: Record<string, number>, item) => {
    totals[item.category] = (totals[item.category] ?? 0) + item.amount;
    return totals;
  }, {});
  return res.json({
    success: true,
    data: { expenses, categoryTotals, totalExpenses: expenses.reduce((sum, item) => sum + item.amount, 0), count: expenses.length },
    provenance: { source: "supabase.farm_expenses", persisted: true },
  });
};

export const updateExpense: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const payload = expensePayload(req.body ?? {}, req.userId!);
  if (!payload) return res.status(400).json({ success: false, code: "INVALID_EXPENSE", message: "تحقق من الصنف والمبلغ والتاريخ." });
  const { data, error } = await db.from("farm_expenses").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) {
    console.error("Update expense failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "EXPENSE_NOT_FOUND" });
  return res.json({ success: true, data: expenseRecord(data), provenance: { source: "supabase.farm_expenses", persisted: true } });
};

export const deleteExpense: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const { data, error } = await db.from("farm_expenses").delete().eq("id", req.params.id).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) {
    console.error("Delete expense failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "EXPENSE_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.farm_expenses", persisted: true } });
};

export const createRevenue: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const body = req.body ?? {};
  const amount = Number(body.amount ?? body.totalRevenue);
  const date = String(body.date ?? body.revenue_date ?? body.saleDate ?? "");
  const quantity = body.quantity === "" || body.quantity === undefined || body.quantity === null ? null : Number(body.quantity);
  const unitPrice = body.unitPrice === "" || body.unitPrice === undefined || body.unitPrice === null ? null : Number(body.unitPrice);
  const transportationCost = Number(body.transportationCost ?? 0);
  const marketingCost = Number(body.marketingCost ?? 0);
  const currency = String(body.currency ?? "TND").toUpperCase();
  const farmId = body.farm_id == null || body.farm_id === "" ? null : String(body.farm_id);
  const harvestDate = body.harvestDate == null || body.harvestDate === "" ? null : String(body.harvestDate);
  const storageDays = body.storageDays == null || body.storageDays === "" ? 0 : Number(body.storageDays);
  if (currency !== "TND" || !Number.isFinite(amount) || amount <= 0 || !isValidISODate(date) ||
      (farmId !== null && !UUID_PATTERN.test(farmId)) ||
      (harvestDate !== null && !isValidISODate(harvestDate)) ||
      !Number.isInteger(storageDays) || storageDays < 0 ||
      (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) ||
      (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice <= 0)) ||
      !Number.isFinite(transportationCost) || transportationCost < 0 ||
      !Number.isFinite(marketingCost) || marketingCost < 0) {
    return res.status(400).json({ success: false, code: "INVALID_REVENUE", message: "تحقق من المبلغ والكمية والسعر والتاريخ والمصاريف." });
  }
  const payload = {
    user_id: req.userId,
    farm_id: farmId,
    crop_related: body.cropRelated ? String(body.cropRelated).slice(0, 100) : null,
    amount,
    currency: "TND",
    revenue_date: date,
    description: String(body.description ?? "").slice(0, 2000),
    quantity,
    unit: body.unit ? String(body.unit).slice(0, 40) : null,
    buyer: body.buyer ? String(body.buyer).slice(0, 160) : null,
    market_location: body.marketLocation ? String(body.marketLocation).slice(0, 160) : null,
    payment_status: String(body.paymentStatus ?? "received").slice(0, 40),
    variety_name: String(body.varietyName ?? "").slice(0, 120),
    unit_price: unitPrice,
    quality_grade: body.qualityGrade ? String(body.qualityGrade).slice(0, 30) : null,
    harvest_date: harvestDate,
    storage_days: storageDays,
    transportation_cost: transportationCost,
    marketing_cost: marketingCost,
  };
  const { data, error } = await db.from("farm_revenues").insert(payload).select("*").single();
  if (error) {
    console.error("Create revenue failed:", error.code);
    return unavailable(res, error);
  }
  return res.status(201).json({ success: true, data, provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const getRevenues: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  let query = db.from("farm_revenues").select("*").eq("user_id", req.userId).order("revenue_date", { ascending: false });
  if (req.query.startDate) query = query.gte("revenue_date", String(req.query.startDate));
  if (req.query.endDate) query = query.lte("revenue_date", String(req.query.endDate));
  const { data, error } = await query;
  if (error) {
    console.error("List revenues failed:", error.code);
    return unavailable(res, error);
  }
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const updateRevenue: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const body = req.body ?? {};
  const amount = Number(body.amount ?? body.totalRevenue);
  const date = String(body.date ?? body.revenue_date ?? body.saleDate ?? "");
  const transportationCost = Number(body.transportationCost ?? 0);
  const marketingCost = Number(body.marketingCost ?? 0);
  const currency = String(body.currency ?? "TND").toUpperCase();
  const quantity = body.quantity === "" || body.quantity === undefined || body.quantity === null ? null : Number(body.quantity);
  const unitPrice = body.unitPrice === "" || body.unitPrice === undefined || body.unitPrice === null ? null : Number(body.unitPrice);
  const harvestDate = body.harvestDate == null || body.harvestDate === "" ? null : String(body.harvestDate);
  const storageDays = body.storageDays == null || body.storageDays === "" ? 0 : Number(body.storageDays);
  if (currency !== "TND" || !Number.isFinite(amount) || amount <= 0 || !isValidISODate(date) ||
      (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) ||
      (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice <= 0)) ||
      (harvestDate !== null && !isValidISODate(harvestDate)) ||
      !Number.isInteger(storageDays) || storageDays < 0 ||
      !Number.isFinite(transportationCost) || transportationCost < 0 ||
      !Number.isFinite(marketingCost) || marketingCost < 0) {
    return res.status(400).json({ success: false, code: "INVALID_REVENUE" });
  }
  const { data, error } = await db.from("farm_revenues").update({
    amount, revenue_date: date, description: String(body.description ?? "").slice(0, 2000),
    crop_related: body.cropRelated ? String(body.cropRelated).slice(0, 100) : null,
    quantity,
    unit: body.unit ? String(body.unit).slice(0, 40) : null,
    buyer: body.buyer ? String(body.buyer).slice(0, 160) : null,
    market_location: body.marketLocation ? String(body.marketLocation).slice(0, 160) : null,
    variety_name: String(body.varietyName ?? "").slice(0, 120),
    unit_price: unitPrice,
    quality_grade: body.qualityGrade ? String(body.qualityGrade).slice(0, 30) : null,
    harvest_date: harvestDate,
    storage_days: storageDays,
    transportation_cost: transportationCost,
    marketing_cost: marketingCost,
    currency: "TND",
    updated_at: new Date().toISOString(),
  }).eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) {
    console.error("Update revenue failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "REVENUE_NOT_FOUND" });
  return res.json({ success: true, data, provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const deleteRevenue: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const { data, error } = await db.from("farm_revenues").delete().eq("id", req.params.id).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) {
    console.error("Delete revenue failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "REVENUE_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const getFinancialSummary: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const [expensesResult, revenuesResult] = await Promise.all([
    db.from("farm_expenses").select("amount,category").eq("user_id", req.userId),
    db.from("farm_revenues").select("amount,transportation_cost,marketing_cost").eq("user_id", req.userId),
  ]);
  if (expensesResult.error || revenuesResult.error) return unavailable(res, expensesResult.error || revenuesResult.error || undefined);
  const expenses = expensesResult.data ?? [];
  const revenues = revenuesResult.data ?? [];
  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const grossRevenue = revenues.reduce((sum, row) => sum + Number(row.amount), 0);
  const salesCosts = revenues.reduce((sum, row) => sum + Number(row.transportation_cost ?? 0) + Number(row.marketing_cost ?? 0), 0);
  const totalRevenue = grossRevenue - salesCosts;
  const categoryBreakdown = expenses.reduce((totals: Record<string, number>, row) => {
    totals[row.category] = (totals[row.category] ?? 0) + Number(row.amount);
    return totals;
  }, {});
  return res.json({
    success: true,
    data: { totalExpenses, grossRevenue, salesCosts, totalRevenue, netProfit: totalRevenue - totalExpenses, categoryBreakdown, expenseCount: expenses.length, revenueCount: revenues.length },
    provenance: { source: "supabase.farm_expenses+farm_revenues", persisted: true },
  });
};

export const getProfitabilityAnalysis: RequestHandler = getFinancialSummary;

// ---------------------------------------------------------------------------
// Budget planning (persisted in public.farm_budget_plans).
//
// A plan stores the farmer's own planned expense lines and an optional
// projected revenue. `actualAmount` per category and any revenue projection
// fall back to the caller's *own* expense/revenue ledger and are labelled with
// their source ("user" vs "derived:user-history"). Nothing is invented; the
// recommendation strings are deterministic arithmetic notes, not model output.
// ---------------------------------------------------------------------------

const BUDGET_STATUSES = new Set(["draft", "approved", "active", "completed"]);

export function budgetPlanPayload(body: any, userId: string) {
  const cropType = String(body.cropType ?? body.crop_type ?? "").trim();
  const plannedArea = Number(body.plannedArea ?? body.planned_area_hectares);
  const seasonYear = Number(body.seasonYear ?? body.season_year);
  const rawLines = body.customExpenses ?? body.planned_expenses;
  const notes = String(body.notes ?? "").slice(0, 2000);
  const farmId = body.farm_id == null || body.farm_id === "" ? null : String(body.farm_id);
  const projectedRaw = body.projectedRevenue ?? body.projected_revenue;
  const projectedRevenue =
    projectedRaw === undefined || projectedRaw === null || projectedRaw === "" ? null : Number(projectedRaw);

  if (!cropType || cropType.length > 120) return { error: "INVALID_CROP_TYPE" as const };
  if (!Number.isFinite(plannedArea) || plannedArea <= 0) return { error: "INVALID_PLANNED_AREA" as const };
  if (!Number.isInteger(seasonYear) || seasonYear < 2000 || seasonYear > 2100) return { error: "INVALID_SEASON_YEAR" as const };
  if (projectedRevenue !== null && (!Number.isFinite(projectedRevenue) || projectedRevenue < 0)) {
    return { error: "INVALID_PROJECTED_REVENUE" as const };
  }
  if (farmId !== null && !UUID_PATTERN.test(farmId)) return { error: "INVALID_FARM_ID" as const };

  const lines = (Array.isArray(rawLines) ? rawLines : [])
    .map((line: any) => ({
      category: String(line?.category ?? "").trim().slice(0, 120),
      plannedAmount: Number(line?.plannedAmount ?? line?.planned_amount),
    }))
    .filter((line: any) => line.category && Number.isFinite(line.plannedAmount) && line.plannedAmount >= 0)
    .slice(0, 50);

  return {
    payload: {
      user_id: userId,
      farm_id: farmId,
      crop_type: cropType,
      season_year: seasonYear,
      planned_area_hectares: plannedArea,
      currency: "TND",
      status: "draft",
      planned_expenses: lines,
      projected_revenue: projectedRevenue,
      notes,
    },
  };
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
const cropMatches = (value: unknown, crop: string) =>
  typeof value === "string" && value.trim() !== "" && value.toLowerCase().includes(crop.toLowerCase());

async function buildBudgetPlanRecord(
  db: NonNullable<ReturnType<typeof dbFor>>,
  userId: string,
  row: any,
) {
  const [expensesResult, revenuesResult] = await Promise.all([
    db.from("farm_expenses").select("category,amount,crop_related,expense_date").eq("user_id", userId),
    db.from("farm_revenues").select("amount,transportation_cost,marketing_cost,crop_related,revenue_date").eq("user_id", userId),
  ]);
  const expenses = expensesResult.data ?? [];
  const revenues = revenuesResult.data ?? [];
  const crop = String(row.crop_type);
  const seasonYear = String(row.season_year);

  const cropExpenses = expenses.filter((e) => cropMatches(e.crop_related, crop));
  const cropRevenues = revenues.filter((r) => cropMatches(r.crop_related, crop));

  // Per-category seasonal average from the caller's own history.
  const expenseYears = new Set(cropExpenses.map((e) => String(e.expense_date).slice(0, 4)));
  const seasons = Math.max(1, expenseYears.size);
  const historyByCategory: Record<string, number> = {};
  for (const e of cropExpenses) {
    historyByCategory[e.category] = (historyByCategory[e.category] ?? 0) + Number(e.amount);
  }
  for (const key of Object.keys(historyByCategory)) historyByCategory[key] = historyByCategory[key] / seasons;

  // Actuals recorded against the plan's own season.
  const actualByCategory: Record<string, number> = {};
  for (const e of cropExpenses) {
    if (String(e.expense_date).slice(0, 4) !== seasonYear) continue;
    actualByCategory[e.category] = (actualByCategory[e.category] ?? 0) + Number(e.amount);
  }

  const plannedByCategory: Record<string, number> = {};
  for (const line of Array.isArray(row.planned_expenses) ? row.planned_expenses : []) {
    plannedByCategory[String(line.category)] = Number(line.plannedAmount) || 0;
  }

  const categories = new Set([
    ...Object.keys(plannedByCategory),
    ...Object.keys(historyByCategory),
    ...Object.keys(actualByCategory),
  ]);
  const estimatedExpenses = [...categories].map((category) => {
    const fromUser = plannedByCategory[category] !== undefined;
    const plannedAmount = fromUser ? plannedByCategory[category] : round3(historyByCategory[category] ?? 0);
    const actualAmount = actualByCategory[category] ?? null;
    const variance = actualAmount !== null && plannedAmount > 0
      ? round3(((actualAmount - plannedAmount) / plannedAmount) * 100)
      : null;
    return {
      category,
      plannedAmount,
      actualAmount,
      variance,
      plannedSource: fromUser
        ? "user"
        : historyByCategory[category] !== undefined
          ? "derived:user-history"
          : "none",
    };
  });

  const plannedTotal = estimatedExpenses.reduce((sum, line) => sum + line.plannedAmount, 0);

  let projectedRevenue = row.projected_revenue !== null && row.projected_revenue !== undefined
    ? Number(row.projected_revenue)
    : null;
  let revenueSource = projectedRevenue !== null ? "user" : "none";
  if (projectedRevenue === null && cropRevenues.length > 0) {
    const revenueYears = new Set(cropRevenues.map((r) => String(r.revenue_date).slice(0, 4)));
    const net = cropRevenues.reduce(
      (sum, r) => sum + Number(r.amount) - Number(r.transportation_cost ?? 0) - Number(r.marketing_cost ?? 0),
      0,
    );
    projectedRevenue = round3(net / Math.max(1, revenueYears.size));
    revenueSource = "derived:user-history";
  }
  const estimatedProfit = projectedRevenue !== null ? round3(projectedRevenue - plannedTotal) : null;

  const riskFactors: string[] = [];
  if (cropExpenses.length === 0) {
    riskFactors.push("لا توجد مصاريف مسجّلة لهذا المحصول: البنود المخططة مبنية على مدخلاتك فقط، دون مرجع تاريخي.");
  }
  if (projectedRevenue === null) {
    riskFactors.push("لا يوجد إيراد متوقّع: لم تُدخل قيمة، ولا يوجد سجل إيرادات سابق لهذا المحصول.");
  } else if (projectedRevenue < plannedTotal) {
    riskFactors.push("الإيراد المتوقّع أقل من مجموع المصاريف المخططة.");
  }

  const aiRecommendations: string[] = [];
  if (cropExpenses.length === 0) {
    aiRecommendations.push("سجّل مصاريفك الفعلية لهذا المحصول ليستند التخطيط إلى بياناتك الحقيقية.");
  }
  if (projectedRevenue === null) {
    aiRecommendations.push("أدخل الإيراد المتوقّع أو سجّل مبيعات سابقة لتقدير الربحية.");
  } else if (estimatedProfit !== null && estimatedProfit < 0) {
    aiRecommendations.push(`الميزانية المخططة تتجاوز الإيراد المتوقّع بمقدار ${round3(Math.abs(estimatedProfit))} دينار.`);
  } else if (estimatedProfit !== null && projectedRevenue > 0) {
    aiRecommendations.push(`هامش الربح المتوقّع ${round3((estimatedProfit / projectedRevenue) * 100)}% بناءً على مدخلاتك.`);
  }

  return {
    id: row.id,
    farmerId: row.user_id,
    farmId: row.farm_id ?? null,
    seasonYear: row.season_year,
    cropType: row.crop_type,
    plannedArea: Number(row.planned_area_hectares),
    currency: row.currency ?? "TND",
    estimatedExpenses,
    projectedRevenue,
    estimatedProfit,
    riskFactors,
    aiRecommendations,
    status: row.status,
    notes: row.notes ?? "",
    createdDate: row.created_at,
    lastUpdated: row.updated_at,
  };
}

const budgetPlanProvenance = (recommendationSource: "rule-based" = "rule-based") => ({
  source: "supabase.farm_budget_plans+farm_expenses+farm_revenues",
  persisted: true,
  recommendationSource,
  isRealModel: false,
});

export const createBudgetPlan: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const parsed = budgetPlanPayload(req.body ?? {}, req.userId as string);
  if ("error" in parsed) {
    return res.status(400).json({ success: false, code: parsed.error, message: "تحقق من المحصول والمساحة والموسم والبنود." });
  }
  const { data, error } = await db.from("farm_budget_plans").insert(parsed.payload).select("*").single();
  if (error) {
    console.error("Create budget plan failed:", error.code);
    return unavailable(res, error);
  }
  const record = await buildBudgetPlanRecord(db, req.userId as string, data);
  return res.status(201).json({ success: true, data: record, provenance: budgetPlanProvenance() });
};

export const getBudgetPlans: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const status = String(req.query.status ?? "").trim();
  let query = db.from("farm_budget_plans").select("*").eq("user_id", req.userId).order("created_at", { ascending: false }).limit(200);
  if (status && BUDGET_STATUSES.has(status)) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) {
    console.error("List budget plans failed:", error.code);
    return unavailable(res, error);
  }
  const records = await Promise.all((data ?? []).map((row) => buildBudgetPlanRecord(db, req.userId as string, row)));
  return res.json({ success: true, data: records, count: records.length, provenance: budgetPlanProvenance() });
};

export const updateBudgetPlan: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) {
    return res.status(400).json({ success: false, code: "INVALID_ID" });
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (req.body?.status !== undefined) {
    const status = String(req.body.status);
    if (!BUDGET_STATUSES.has(status)) return res.status(400).json({ success: false, code: "INVALID_STATUS" });
    updates.status = status;
  }
  if (req.body?.notes !== undefined) updates.notes = String(req.body.notes).slice(0, 2000);
  if (req.body?.projectedRevenue !== undefined || req.body?.projected_revenue !== undefined) {
    const raw = req.body.projectedRevenue ?? req.body.projected_revenue;
    if (raw === null || raw === "") updates.projected_revenue = null;
    else {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ success: false, code: "INVALID_PROJECTED_REVENUE" });
      updates.projected_revenue = value;
    }
  }
  if (req.body?.customExpenses !== undefined || req.body?.planned_expenses !== undefined) {
    const raw = req.body.customExpenses ?? req.body.planned_expenses;
    updates.planned_expenses = (Array.isArray(raw) ? raw : [])
      .map((line: any) => ({
        category: String(line?.category ?? "").trim().slice(0, 120),
        plannedAmount: Number(line?.plannedAmount ?? line?.planned_amount),
      }))
      .filter((line: any) => line.category && Number.isFinite(line.plannedAmount) && line.plannedAmount >= 0)
      .slice(0, 50);
  }
  const { data, error } = await db.from("farm_budget_plans").update(updates).eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) {
    console.error("Update budget plan failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "BUDGET_PLAN_NOT_FOUND" });
  const record = await buildBudgetPlanRecord(db, req.userId as string, data);
  return res.json({ success: true, data: record, provenance: budgetPlanProvenance() });
};

export const deleteBudgetPlan: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  if (!UUID_PATTERN.test(String(req.params.id))) {
    return res.status(400).json({ success: false, code: "INVALID_ID" });
  }
  const { data, error } = await db.from("farm_budget_plans").delete().eq("id", req.params.id).eq("user_id", req.userId).select("id").maybeSingle();
  if (error) {
    console.error("Delete budget plan failed:", error.code);
    return unavailable(res, error);
  }
  if (!data) return res.status(404).json({ success: false, code: "BUDGET_PLAN_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.farm_budget_plans", persisted: true } });
};

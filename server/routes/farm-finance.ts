import type { RequestHandler } from "express";
import { scopedClientFromAuthHeader } from "../lib/supabase";

function dbFor(req: Parameters<RequestHandler>[0]) {
  if (req.identitySource !== "jwt" || !req.userId) return null;
  return scopedClientFromAuthHeader(req.header("authorization"));
}

function unavailable(res: Parameters<RequestHandler>[1]) {
  return res.status(503).json({
    success: false,
    code: "FARM_FINANCE_DATABASE_UNAVAILABLE",
    message: "يلزم تسجيل دخول موثّق وتطبيق ترحيل قاعدة البيانات لحفظ المعاملات المالية.",
  });
}

function expensePayload(body: any, userId: string) {
  const amount = Number(body.amount);
  const date = String(body.date ?? "");
  const category = String(body.category ?? "");
  const allowed = new Set(["seeds", "fertilizers", "pesticides", "labor", "equipment", "fuel", "maintenance", "utilities", "insurance", "other"]);
  if (!allowed.has(category) || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  return {
    user_id: userId,
    farm_id: typeof body.farm_id === "string" && body.farm_id ? body.farm_id : null,
    category,
    subcategory: String(body.subcategory ?? "").slice(0, 120),
    amount,
    currency: String(body.currency ?? "TND").slice(0, 3),
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
    return unavailable(res);
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
    return unavailable(res);
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
    return unavailable(res);
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
    return unavailable(res);
  }
  if (!data) return res.status(404).json({ success: false, code: "EXPENSE_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.farm_expenses", persisted: true } });
};

export const createRevenue: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const body = req.body ?? {};
  const amount = Number(body.amount ?? body.netRevenue);
  const date = String(body.date ?? body.revenue_date ?? "");
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, code: "INVALID_REVENUE", message: "تحقق من المبلغ والتاريخ." });
  }
  const payload = {
    user_id: req.userId,
    farm_id: typeof body.farm_id === "string" && body.farm_id ? body.farm_id : null,
    crop_related: body.cropRelated ? String(body.cropRelated).slice(0, 100) : null,
    amount,
    currency: String(body.currency ?? "TND").slice(0, 3),
    revenue_date: date,
    description: String(body.description ?? "").slice(0, 2000),
    quantity: Number.isFinite(Number(body.quantity)) && body.quantity !== "" ? Number(body.quantity) : null,
    unit: body.unit ? String(body.unit).slice(0, 40) : null,
    buyer: body.buyer ? String(body.buyer).slice(0, 160) : null,
    market_location: body.marketLocation ? String(body.marketLocation).slice(0, 160) : null,
    payment_status: String(body.paymentStatus ?? "received").slice(0, 40),
  };
  const { data, error } = await db.from("farm_revenues").insert(payload).select("*").single();
  if (error) {
    console.error("Create revenue failed:", error.code);
    return unavailable(res);
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
    return unavailable(res);
  }
  return res.json({ success: true, data: data ?? [], provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const updateRevenue: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const body = req.body ?? {};
  const amount = Number(body.amount ?? body.netRevenue);
  const date = String(body.date ?? body.revenue_date ?? "");
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, code: "INVALID_REVENUE" });
  }
  const { data, error } = await db.from("farm_revenues").update({
    amount, revenue_date: date, description: String(body.description ?? "").slice(0, 2000),
    crop_related: body.cropRelated ? String(body.cropRelated).slice(0, 100) : null,
    updated_at: new Date().toISOString(),
  }).eq("id", req.params.id).eq("user_id", req.userId).select("*").maybeSingle();
  if (error) {
    console.error("Update revenue failed:", error.code);
    return unavailable(res);
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
    return unavailable(res);
  }
  if (!data) return res.status(404).json({ success: false, code: "REVENUE_NOT_FOUND" });
  return res.json({ success: true, data: { id: data.id }, provenance: { source: "supabase.farm_revenues", persisted: true } });
};

export const getFinancialSummary: RequestHandler = async (req, res) => {
  const db = dbFor(req);
  if (!db) return unavailable(res);
  const [expensesResult, revenuesResult] = await Promise.all([
    db.from("farm_expenses").select("amount,category").eq("user_id", req.userId),
    db.from("farm_revenues").select("amount").eq("user_id", req.userId),
  ]);
  if (expensesResult.error || revenuesResult.error) return unavailable(res);
  const expenses = expensesResult.data ?? [];
  const revenues = revenuesResult.data ?? [];
  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount), 0);
  const totalRevenue = revenues.reduce((sum, row) => sum + Number(row.amount), 0);
  const categoryBreakdown = expenses.reduce((totals: Record<string, number>, row) => {
    totals[row.category] = (totals[row.category] ?? 0) + Number(row.amount);
    return totals;
  }, {});
  return res.json({
    success: true,
    data: { totalExpenses, totalRevenue, netProfit: totalRevenue - totalExpenses, categoryBreakdown, expenseCount: expenses.length, revenueCount: revenues.length },
    provenance: { source: "supabase.farm_expenses+farm_revenues", persisted: true },
  });
};

export const getProfitabilityAnalysis: RequestHandler = getFinancialSummary;

export const createBudgetPlan: RequestHandler = (_req, res) => res.status(501).json({ success: false, code: "BUDGET_PLAN_NOT_IMPLEMENTED", message: "خطط الميزانية غير مفعّلة قبل بناء جدول حفظ موثّق." });
export const getBudgetPlans: RequestHandler = (_req, res) => res.status(501).json({ success: false, code: "BUDGET_PLAN_NOT_IMPLEMENTED" });
export const updateBudgetPlan: RequestHandler = (_req, res) => res.status(501).json({ success: false, code: "BUDGET_PLAN_NOT_IMPLEMENTED" });
export const deleteBudgetPlan: RequestHandler = (_req, res) => res.status(501).json({ success: false, code: "BUDGET_PLAN_NOT_IMPLEMENTED" });

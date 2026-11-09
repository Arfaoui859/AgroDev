/**
 * Backwards-compatible exports for older imports.
 * All finance persistence now lives in farm-finance.ts and requires a verified
 * Supabase session; the former in-memory sample expense/revenue store is gone.
 */
export {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  updateRevenue,
  deleteRevenue,
  createRevenue,
  getRevenues,
  deleteBudgetPlan,
  getProfitabilityAnalysis,
  getFinancialSummary,
  createBudgetPlan,
  getBudgetPlans,
  updateBudgetPlan,
} from "./farm-finance";

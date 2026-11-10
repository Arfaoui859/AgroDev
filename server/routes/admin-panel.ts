import type { RequestHandler } from "express";
import os from "node:os";
import { supabaseAdmin, scopedClientFromAuthHeader } from "../lib/supabase";

type DbUser = Record<string, any>;

const unavailable = (res: Parameters<RequestHandler>[1], message: string) =>
  res.status(503).json({
    success: false,
    code: "ADMIN_DATA_SOURCE_UNAVAILABLE",
    error: message,
    data: null,
  });

function getAdminClient(req: Parameters<RequestHandler>[0]) {
  return supabaseAdmin || scopedClientFromAuthHeader(req.header("authorization"));
}

function requireDatabase(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): boolean {
  if (getAdminClient(req)) return true;
  unavailable(
    res,
    "Admin database access is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
  );
  return false;
}

function displayName(user: DbUser): string {
  return String(user.full_name || user.full_name_ar || user.email || "—");
}

function toAdminUser(user: DbUser) {
  const fullName = displayName(user);
  const parts = fullName.trim().split(/\s+/);
  const isActive = user.is_active ?? user.active ?? (user.status ? user.status === "active" : true);
  const status = user.status || (isActive ? "active" : "inactive");
  return {
    id: user.id,
    email: user.email || "",
    full_name: fullName,
    full_name_ar: user.full_name_ar || "",
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
    firstNameArabic: user.full_name_ar || fullName,
    lastNameArabic: "",
    phone: user.phone || "",
    role: String(user.role || "farmer").toLowerCase(),
    roleArabic: String(user.role || "farmer"),
    status,
    is_active: Boolean(isActive),
    emailVerified: Boolean(user.email_verified ?? user.verified ?? user.email_confirmed_at),
    phoneVerified: Boolean(user.phone_verified),
    twoFactorEnabled: Boolean(user.two_factor_enabled),
    lastLogin: user.last_sign_in_at || user.last_login_at || null,
    loginCount: Number.isFinite(Number(user.login_count)) ? Number(user.login_count) : null,
    createdAt: user.created_at || null,
    updatedAt: user.updated_at || null,
    location: user.location || "",
    specialization: user.specialization || "",
    experience_years: user.experience_years ?? null,
    profile: null,
    dataSource: "supabase.public.users",
  };
}

async function fetchUsers(client: any, limit = 100, from = 0) {
  if (!client) throw new Error("ADMIN_DATABASE_NOT_CONFIGURED");
  const { data, error, count } = await client
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return { users: (data || []).map(toAdminUser), total: count ?? (data || []).length };
}

function dbError(res: Parameters<RequestHandler>[1], error: unknown, action: string) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[admin-panel] ${action} failed:`, detail);
  return res.status(503).json({
    success: false,
    code: "ADMIN_DATA_QUERY_FAILED",
    error: `Unable to load verified ${action} from Supabase.`,
    detail: process.env.NODE_ENV === "production" ? undefined : detail,
    data: null,
  });
}

export const getAdminDashboard: RequestHandler = async (req, res) => {
  if (!requireDatabase(req, res)) return;
  const client = getAdminClient(req)!;
  try {
    const [{ users, total }, farmsResult] = await Promise.all([
      fetchUsers(client, 5, 0),
      client.from("farms").select("id", { count: "exact", head: true }),
    ]);
    const activeUsers = users.filter((u) => u.status === "active").length;
    // Dashboard summary counts are queried independently so pagination does not
    // distort totals. If the optional farms table is unavailable, disclose it.
    const { count: allActive, error: activeError } = await client
      .from("users")
      .select("id", { count: "exact", head: true })
      .or("is_active.eq.true,status.eq.active");
    const summary = {
      totalUsers: total,
      activeUsers: activeError ? null : (allActive ?? activeUsers),
      newUsers: users.filter((u) => {
        if (!u.createdAt) return false;
        return Date.now() - new Date(u.createdAt).getTime() <= 30 * 86400000;
      }).length,
      totalFarms: farmsResult.error ? null : (farmsResult.count ?? 0),
      totalRevenue: null,
      monthlyRecurring: null,
      supportTickets: null,
      systemUptime: Math.floor(process.uptime()),
      securityAlerts: null,
    };
    return res.json({
      success: true,
      data: {
        summary,
        recentUsers: users,
        recentActivity: [],
        securityAlerts: [],
        systemHealth: {
          status: "server-observed",
          cpuUsage: null,
          memoryUsage: Math.round((process.memoryUsage().rss / os.totalmem()) * 100),
          diskUsage: null,
          responseTime: null,
        },
        lastUpdated: new Date().toISOString(),
        provenance: {
          source: "Supabase public.users + live Node.js process metrics",
          simulated: false,
          unavailable: [
            ...(farmsResult.error ? ["farms"] : []),
            "revenue",
            "support tickets",
            "security event history",
            "activity history",
          ],
        },
      },
    });
  } catch (error) {
    return dbError(res, error, "admin dashboard");
  }
};

export const getAdminUsers: RequestHandler = async (req, res) => {
  if (!requireDatabase(req, res)) return;
  const client = getAdminClient(req)!;
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || "50"), 10) || 50));
    const { users, total } = await fetchUsers(client, limit, (page - 1) * limit);
    return res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      provenance: { source: "Supabase public.users", simulated: false },
    });
  } catch (error) {
    return dbError(res, error, "user records");
  }
};

export const getAdminSystemMetrics: RequestHandler = async (req, res) => {
  if (!requireDatabase(req, res)) return;
  const client = getAdminClient(req)!;
  try {
    const { count: users, error } = await client
      .from("users").select("id", { count: "exact", head: true });
    if (error) throw error;
    return res.json({
      success: true,
      data: {
        server: {
          uptime: Math.floor(process.uptime()),
          cpuUsage: null,
          memoryUsage: process.memoryUsage().rss,
          memoryTotal: os.totalmem(),
          diskUsage: null,
          responseTime: null,
          requestCount: null,
          errorRate: null,
        },
        database: {
          connectionCount: null, queryCount: null, avgQueryTime: null,
          slowQueries: null, cacheHitRate: null, storageUsed: null,
          backupStatus: "unknown", lastBackup: null,
        },
        application: {
          totalUsers: users ?? 0,
          activeUsers: null,
          newRegistrations: null,
          dailyActiveUsers: null,
          weeklyActiveUsers: null,
          monthlyActiveUsers: null,
        },
        provenance: { source: "Node.js process + Supabase users count", simulated: false },
      },
    });
  } catch (error) {
    return dbError(res, error, "system metrics");
  }
};

export const getAdminUsageAnalytics: RequestHandler = async (req, res) => {
  if (!requireDatabase(req, res)) return;
  const client = getAdminClient(req)!;
  try {
    const { data, error, count } = await client
      .from("users").select("id,role,created_at", { count: "exact" })
      .order("created_at", { ascending: false }).limit(1000);
    if (error) throw error;
    const byRole = (data || []).reduce((acc: Record<string, number>, row: any) => {
      const role = String(row.role || "unknown");
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const byMonth = (data || []).reduce((acc: Record<string, number>, row: any) => {
      if (!row.created_at) return acc;
      const month = String(row.created_at).slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    return res.json({
      success: true,
      data: {
        overview: { totalUsers: count ?? (data || []).length, activeUsers: null, newUsers: null },
        usersByRole: byRole,
        registrationsByMonth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, users]) => ({ month, users })),
        subscriptions: null,
        support: null,
        provenance: { source: "Supabase public.users (latest 1000 records for breakdown)", simulated: false },
      },
    });
  } catch (error) {
    return dbError(res, error, "usage analytics");
  }
};

async function readOptionalTable(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], table: string) {
  if (!requireDatabase(req, res)) return null;
  const { data, error } = await getAdminClient(req)!
    .from(table).select("*").limit(100);
  if (error) {
    console.warn(`[admin-panel] ${table} is not available:`, error.message);
    return res.json({
      success: true, data: [],
      availability: { available: false, reason: `The ${table} table is not available or has no read permission.` },
      provenance: { source: "Supabase", simulated: false },
    });
  }
  return res.json({
    success: true, data: data || [],
    availability: { available: true },
    provenance: { source: `Supabase public.${table}`, simulated: false },
  });
}

export const getAdminSecurityEvents: RequestHandler = async (req, res) =>
  readOptionalTable(req, res, "security_events");
export const getAdminActivityLogs: RequestHandler = async (req, res) =>
  readOptionalTable(req, res, "activity_logs");
export const getAdminSubscriptions: RequestHandler = async (req, res) =>
  readOptionalTable(req, res, "subscriptions");

export const updateAdminUser: RequestHandler = async (req, res) => {
  const client = getAdminClient(req);
  if (!client) return unavailable(res, "Admin database access is not configured.");
  const userId = String(req.params.userId || "");
  const { status, role } = req.body || {};
  if (!userId) return res.status(400).json({ success: false, error: "User id is required." });
  if (role !== undefined && !["farmer", "agronomist", "trader", "veterinarian", "inspector", "admin", "government", "investor"].includes(role)) {
    return res.status(400).json({ success: false, error: "Unsupported user role." });
  }
  if (status !== undefined && !["active", "inactive", "suspended"].includes(status)) {
    return res.status(400).json({ success: false, error: "Unsupported user status." });
  }
  if (status === undefined && role === undefined) {
    return res.status(400).json({ success: false, error: "Provide a role or status to update." });
  }
  if (req.userId === userId && (role !== undefined && role !== "admin" || status !== undefined && status !== "active")) {
    return res.status(409).json({ success: false, error: "You cannot remove your own administrator access or deactivate your own account." });
  }
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role !== undefined) patch.role = role;
    if (status !== undefined) patch.is_active = status === "active";
    const { data, error } = await client.from("users").update(patch).eq("id", userId).select("*").maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: "User record not found." });
    return res.json({ success: true, data: toAdminUser(data), provenance: { source: "Supabase public.users", simulated: false } });
  } catch (error) {
    return dbError(res, error, "user update");
  }
};

export const deleteAdminUser: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) return unavailable(res, "SUPABASE_SERVICE_ROLE_KEY is required for deleting Supabase Auth accounts.");
  const userId = String(req.params.userId || "");
  if (!userId) return res.status(400).json({ success: false, error: "User id is required." });
  if (req.userId === userId) return res.status(409).json({ success: false, error: "You cannot delete your own administrator account." });
  try {
    const { data: target, error: lookupError } = await supabaseAdmin.from("users").select("id,role").eq("id", userId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!target) return res.status(404).json({ success: false, error: "User record not found." });
    if (String(target.role).toLowerCase() === "admin") {
      const { count, error: countError } = await supabaseAdmin.from("users").select("id", { count: "exact", head: true }).eq("role", "admin");
      if (countError) throw countError;
      if ((count ?? 0) <= 1) return res.status(409).json({ success: false, error: "The last administrator cannot be deleted." });
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return res.json({ success: true, deletedUserId: userId });
  } catch (error) {
    return dbError(res, error, "user deletion");
  }
};

export const createAdminManagedUser: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) return unavailable(res, "SUPABASE_SERVICE_ROLE_KEY is required for creating Supabase Auth accounts.");
  const { email, password, full_name, role } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || typeof password !== "string" || password.length < 12) {
    return res.status(400).json({ success: false, error: "A valid email and password of at least 12 characters are required." });
  }
  const allowedRoles = ["farmer", "agronomist", "trader", "veterinarian", "inspector", "admin", "government", "investor"];
  const normalizedRole = typeof role === "string" && allowedRoles.includes(role) ? role : "farmer";
  try {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: { full_name: typeof full_name === "string" ? full_name.trim() : "" },
    });
    if (createError) throw createError;
    const authUser = created.user;
    if (!authUser) throw new Error("Supabase Auth did not return a created user.");
    const { data, error } = await supabaseAdmin.from("users").upsert({
      id: authUser.id,
      email: normalizedEmail,
      full_name: typeof full_name === "string" ? full_name.trim() : null,
      role: normalizedRole,
      verified: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" }).select("*").single();
    if (error) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(() => undefined);
      throw error;
    }
    return res.status(201).json({ success: true, data: toAdminUser(data), provenance: { source: "Supabase Auth + public.users", simulated: false } });
  } catch (error) {
    return dbError(res, error, "user creation");
  }
};

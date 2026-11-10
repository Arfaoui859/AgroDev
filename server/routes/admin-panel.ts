import type { Request, Response } from 'express';
import { isSupabaseConfigured, supabaseAdmin } from '../lib/supabase';

function unavailable(res: Response, code = 'DASHBOARD_DATA_SOURCE_NOT_CONNECTED'): void {
  res.setHeader('X-AgroGrowth-Data-Status', 'unavailable');
  res.setHeader('X-AgroGrowth-Data-Provenance', 'unverified');
  res.status(503).json({
    success: false,
    code,
    message: 'Verified records are not available until the persistent data source is connected.',
    data: null,
    provenance: { source: null, verified: false, model_source: null },
  });
}

function databaseReady(res: Response): boolean {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    unavailable(res);
    return false;
  }
  return true;
}

function roleArabic(role: string): string {
  const labels: Record<string, string> = {
    admin: 'مدير النظام', administrator: 'مدير النظام', farmer: 'فلاح',
    agronomist: 'خبير زراعي', trader: 'تاجر', veterinarian: 'طبيب بيطري',
    inspector: 'مراقب', government: 'مؤسسة حكومية', investor: 'مستثمر',
  };
  return labels[role.toLowerCase()] || role;
}

export async function getAdminDashboard(_req: Request, res: Response): Promise<void> {
  if (!databaseReady(res)) return;
  try {
    const [users, activeUsers, farms, newUsers, activity] = await Promise.all([
      supabaseAdmin!.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin!.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin!.from('farms').select('id', { count: 'exact', head: true }),
      supabaseAdmin!.from('users').select('id', { count: 'exact', head: true }).gte(
        'created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      supabaseAdmin!.from('user_analytics')
        .select('id,user_id,event_type,event_data,created_at')
        .order('created_at', { ascending: false }).limit(8),
    ]);

    const coreErrors = [users.error, activeUsers.error, newUsers.error].filter(Boolean);
    if (coreErrors.length) {
      console.error('Admin overview query failed:', coreErrors.map((e) => e?.message));
      unavailable(res, 'ADMIN_OVERVIEW_QUERY_FAILED');
      return;
    }

    // Optional tables may not yet exist in every deployment. Do not block
    // the verified user counts because a secondary analytics module is absent.
    const activityRows = activity.error ? [] : (activity.data || []);
    if (farms.error) console.warn('Admin farm count unavailable:', farms.error.message);
    if (activity.error) console.warn('Admin activity feed unavailable:', activity.error.message);
    const recentActivity = activityRows.map((row: any) => ({
      id: row.id,
      action: String(row.event_type || 'Platform event'),
      actionArabic: String(row.event_type || 'نشاط المنصة'),
      userName: row.user_id || 'Unknown user',
      userNameArabic: row.user_id || 'مستخدم',
      timestamp: row.created_at,
      status: 'success',
    }));

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase');
    res.json({
      success: true,
      data: {
        summary: {
          totalUsers: users.count ?? 0,
          activeUsers: activeUsers.count ?? 0,
          newUsers: newUsers.count ?? 0,
          totalFarms: farms.error ? null : (farms.count ?? 0),
          // Revenue, subscriptions, uptime and support-ticket totals are not
          // inferred from unrelated tables. They remain explicitly unavailable.
          totalRevenue: null,
          monthlyRecurring: null,
          supportTickets: null,
          systemUptime: null,
          securityAlerts: null,
        },
        recentActivity,
        securityAlerts: [],
      },
      provenance: {
        source: 'supabase.public.users, public.farms, public.user_analytics',
        verified: true,
        model_source: null,
        limitations: [
          'Revenue, subscription, uptime and support-ticket metrics are not connected.',
          ...(farms.error ? ['Farm count table is unavailable.'] : []),
          ...(activity.error ? ['User analytics activity feed is unavailable.'] : []),
        ],
      },
    });
  } catch (error) {
    console.error('Admin overview failed:', error);
    unavailable(res, 'ADMIN_OVERVIEW_QUERY_FAILED');
  }
}

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  if (!databaseReady(res)) return;
  const page = Math.max(1, Math.min(10000, Number.parseInt(String(req.query.page || '1'), 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(String(req.query.limit || '50'), 10) || 50));
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
  const role = typeof req.query.role === 'string' ? req.query.role.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';

  try {
    let query = supabaseAdmin!.from('users')
      .select('id,email,full_name,role,is_active,email_verified,created_at,last_login', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      const safeSearch = search.replace(/[^\\p{L}\\p{N}@._+\\- ]/gu, '');
      if (safeSearch) query = query.or(`email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
    }
    if (role && role !== 'all') query = query.eq('role', role);
    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'inactive' || status === 'suspended') query = query.eq('is_active', false);

    const { data, error, count } = await query;
    if (error) {
      console.error('Admin user listing failed:', error.message);
      unavailable(res, 'ADMIN_USERS_QUERY_FAILED');
      return;
    }

    const users = (data || []).map((row: any) => {
      const fullName = String(row.full_name || row.email || 'User');
      const parts = fullName.trim().split(/\s+/);
      const normalizedRole = String(row.role || 'farmer');
      return {
        id: row.id,
        email: row.email,
        fullName,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
        firstNameArabic: parts[0] || '',
        lastNameArabic: parts.slice(1).join(' '),
        role: normalizedRole,
        roleArabic: roleArabic(normalizedRole),
        status: row.is_active ? 'active' : 'inactive',
        emailVerified: Boolean(row.email_verified),
        createdAt: row.created_at,
        lastLogin: row.last_login,
      };
    });

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase');
    res.json({
      success: true,
      data: users,
      pagination: { page, pageSize, total: count ?? users.length, totalPages: Math.ceil((count ?? users.length) / pageSize) },
      provenance: { source: 'supabase.public.users', verified: true, model_source: null },
    });
  } catch (error) {
    console.error('Admin user listing failed:', error);
    unavailable(res, 'ADMIN_USERS_QUERY_FAILED');
  }
}

export async function getAdminSystemMetrics(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_SYSTEM_METRICS_NOT_CONNECTED');
}
export async function getAdminUsageAnalytics(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_USAGE_ANALYTICS_NOT_CONNECTED');
}
export async function getAdminSecurityEvents(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_SECURITY_EVENTS_NOT_CONNECTED');
}
export async function getAdminActivityLogs(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_ACTIVITY_LOGS_NOT_CONNECTED');
}
export async function getAdminSubscriptions(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_SUBSCRIPTIONS_NOT_CONNECTED');
}

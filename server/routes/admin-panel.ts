import type { Request, Response } from 'express';
import { isSupabaseAdminConfigured, supabaseAdmin } from '../lib/supabase';

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
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
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

export async function updateAdminUserProfile(req: Request, res: Response): Promise<void> {
  if (req.identitySource !== 'jwt' || !req.userId) {
    res.status(403).json({ success: false, code: 'VERIFIED_ADMIN_SESSION_REQUIRED', message: 'A signed-in administrator session is required.' });
    return;
  }
  if (!databaseReady(res)) return;

  const targetUserId = typeof req.params.userId === 'string' ? req.params.userId : '';
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim().slice(0, 120) : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
    res.status(400).json({ success: false, code: 'INVALID_USER_ID', message: 'A valid user ID is required.' });
    return;
  }
  if (!fullName || fullName.length < 2) {
    res.status(400).json({ success: false, code: 'INVALID_FULL_NAME', message: 'Full name must contain at least 2 characters.' });
    return;
  }

  try {
    const { data: profile, error: profileReadError } = await supabaseAdmin!
      .from('users').select('id,full_name,email').eq('id', targetUserId).maybeSingle();
    if (profileReadError) {
      unavailable(res, 'ADMIN_USER_PROFILE_LOOKUP_FAILED');
      return;
    }
    if (!profile) {
      res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'The target user does not exist.' });
      return;
    }
    const { data: authResult, error: authReadError } = await supabaseAdmin!.auth.admin.getUserById(targetUserId);
    if (authReadError || !authResult.user) {
      unavailable(res, 'ADMIN_AUTH_USER_LOOKUP_FAILED');
      return;
    }

    const previousName = String(profile.full_name || '');
    const previousMetadata = authResult.user.user_metadata || {};
    const { error: authUpdateError } = await supabaseAdmin!.auth.admin.updateUserById(targetUserId, {
      user_metadata: { ...previousMetadata, full_name: fullName },
    });
    if (authUpdateError) {
      unavailable(res, 'ADMIN_AUTH_PROFILE_UPDATE_FAILED');
      return;
    }

    const { error: profileUpdateError } = await supabaseAdmin!
      .from('users').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', targetUserId);
    if (profileUpdateError) {
      const { error: rollbackError } = await supabaseAdmin!.auth.admin.updateUserById(targetUserId, {
        user_metadata: previousMetadata,
      });
      if (rollbackError) console.error('CRITICAL: Auth metadata rollback failed:', rollbackError.message);
      unavailable(res, rollbackError ? 'ADMIN_PROFILE_PARTIAL_FAILURE' : 'ADMIN_USER_PROFILE_UPDATE_FAILED');
      return;
    }

    const { error: auditError } = await supabaseAdmin!.from('admin_audit_logs').insert({
      actor_user_id: req.userId,
      action: 'user.profile.updated',
      target_user_id: targetUserId,
      before_data: { full_name: previousName },
      after_data: { full_name: fullName },
    });
    if (auditError) {
      const { error: profileRollbackError } = await supabaseAdmin!
        .from('users').update({ full_name: previousName, updated_at: new Date().toISOString() }).eq('id', targetUserId);
      const { error: authRollbackError } = await supabaseAdmin!.auth.admin.updateUserById(targetUserId, {
        user_metadata: previousMetadata,
      });
      if (profileRollbackError || authRollbackError) {
        console.error('CRITICAL: profile update rollback incomplete:', profileRollbackError?.message, authRollbackError?.message);
      }
      unavailable(res, 'ADMIN_USER_PROFILE_AUDIT_FAILED');
      return;
    }

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase.auth.admin + public.users + public.admin_audit_logs');
    res.json({
      success: true,
      data: { id: targetUserId, email: profile.email, fullName },
      provenance: { source: 'supabase.auth.admin + public.users + public.admin_audit_logs', verified: true },
    });
  } catch (error) {
    console.error('Admin user profile update failed:', error);
    unavailable(res, 'ADMIN_USER_PROFILE_UPDATE_FAILED');
  }
}

export async function createAdminManagedUser(req: Request, res: Response): Promise<void> {
  if (req.identitySource !== 'jwt' || !req.userId) {
    res.status(403).json({ success: false, code: 'VERIFIED_ADMIN_SESSION_REQUIRED', message: 'A signed-in administrator session is required.' });
    return;
  }
  if (!databaseReady(res)) return;

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim().slice(0, 120) : '';
  const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : 'farmer';
  const allowedRoles = new Set(['farmer', 'agronomist', 'trader', 'veterinarian', 'inspector', 'government', 'investor']);
  if (!/^[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+$/.test(email) || !fullName || !allowedRoles.has(role)) {
    res.status(400).json({ success: false, code: 'INVALID_USER_DETAILS', message: 'A valid email, full name, and supported non-admin role are required.' });
    return;
  }

  try {
    const { data: existing, error: existingError } = await supabaseAdmin!
      .from('users').select('id').eq('email', email).maybeSingle();
    if (existingError) {
      unavailable(res, 'ADMIN_USER_DUPLICATE_CHECK_FAILED');
      return;
    }
    if (existing) {
      res.status(409).json({ success: false, code: 'USER_ALREADY_EXISTS', message: 'A platform profile already exists for this email.' });
      return;
    }

    const { data: invited, error: inviteError } = await supabaseAdmin!.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });
    if (inviteError || !invited.user?.id) {
      const message = inviteError?.message || 'Invitation could not be created.';
      const conflict = /already|registered|exists/i.test(message);
      res.status(conflict ? 409 : 503).json({
        success: false,
        code: conflict ? 'AUTH_USER_ALREADY_EXISTS' : 'USER_INVITATION_FAILED',
        message: conflict ? 'An authentication account already exists for this email.' : 'Supabase could not send the account invitation. Check the Auth email provider configuration.',
      });
      return;
    }

    const userId = invited.user.id;
    const { error: profileError } = await supabaseAdmin!.from('users').insert({
      id: userId, email, full_name: fullName, role,
      email_verified: false, is_active: true, updated_at: new Date().toISOString(),
    });
    if (profileError) {
      const { error: cleanupError } = await supabaseAdmin!.auth.admin.deleteUser(userId);
      if (cleanupError) console.error('CRITICAL: failed to roll back invited Auth user:', cleanupError.message);
      console.error('Admin-created profile insert failed:', profileError.message);
      unavailable(res, cleanupError ? 'USER_CREATION_PARTIAL_FAILURE' : 'ADMIN_USER_PROFILE_CREATE_FAILED');
      return;
    }

    const { error: auditError } = await supabaseAdmin!.from('admin_audit_logs').insert({
      actor_user_id: req.userId,
      action: 'user.created',
      target_user_id: userId,
      before_data: {},
      after_data: { email, role, is_active: true, invitation_sent: true },
    });
    if (auditError) {
      const { error: profileCleanupError } = await supabaseAdmin!.from('users').delete().eq('id', userId);
      const { error: authCleanupError } = await supabaseAdmin!.auth.admin.deleteUser(userId);
      if (profileCleanupError || authCleanupError) {
        console.error('CRITICAL: user creation rollback incomplete:', profileCleanupError?.message, authCleanupError?.message);
      }
      unavailable(res, 'ADMIN_USER_AUDIT_WRITE_FAILED');
      return;
    }

    res.status(201).setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase.auth + public.users + public.admin_audit_logs');
    res.json({
      success: true,
      data: { id: userId, email, fullName, role, status: 'active', invitationSent: true },
      provenance: { source: 'supabase.auth.inviteUserByEmail + public.users + public.admin_audit_logs', verified: true },
    });
  } catch (error) {
    console.error('Admin-managed user creation failed:', error);
    unavailable(res, 'ADMIN_USER_CREATE_FAILED');
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
      const safeSearch = search.replace(/[^\p{L}\p{N}@._+ -]/gu, '');
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
export async function getAdminActivityLogs(req: Request, res: Response): Promise<void> {
  if (!databaseReady(res)) return;
  const page = Math.max(1, Math.min(10000, Number.parseInt(String(req.query.page || '1'), 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(String(req.query.limit || '25'), 10) || 25));
  const action = typeof req.query.action === 'string' ? req.query.action.trim().slice(0, 80) : '';

  try {
    let query = supabaseAdmin!
      .from('admin_audit_logs')
      .select('id,actor_user_id,action,target_user_id,before_data,after_data,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (action) query = query.eq('action', action);
    const { data, error, count } = await query;
    if (error) {
      console.error('Admin audit log query failed:', error.message);
      unavailable(res, 'ADMIN_AUDIT_LOGS_NOT_READY');
      return;
    }

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase');
    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count ?? (data || []).length,
        totalPages: Math.ceil((count ?? (data || []).length) / pageSize),
      },
      provenance: { source: 'supabase.public.admin_audit_logs', verified: true, model_source: null },
    });
  } catch (error) {
    console.error('Admin audit log query failed:', error);
    unavailable(res, 'ADMIN_AUDIT_LOGS_QUERY_FAILED');
  }
}
export async function getAdminSubscriptions(_req: Request, res: Response): Promise<void> {
  unavailable(res, 'ADMIN_SUBSCRIPTIONS_NOT_CONNECTED');
}


export async function setAdminUserActive(req: Request, res: Response): Promise<void> {
  if (req.identitySource !== 'jwt' || !req.userId) {
    res.status(403).json({
      success: false,
      code: 'VERIFIED_ADMIN_SESSION_REQUIRED',
      message: 'Sign in with a verified administrator account before changing account status.',
    });
    return;
  }
  if (!databaseReady(res)) return;

  const targetUserId = typeof req.params.userId === 'string' ? req.params.userId : '';
  const isActive = req.body?.isActive;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
    res.status(400).json({ success: false, code: 'INVALID_USER_ID', message: 'A valid user ID is required.' });
    return;
  }
  if (typeof isActive !== 'boolean') {
    res.status(400).json({ success: false, code: 'INVALID_ACCOUNT_STATUS', message: 'isActive must be a boolean.' });
    return;
  }
  if (!isActive && targetUserId === req.userId) {
    res.status(400).json({ success: false, code: 'SELF_SUSPENSION_BLOCKED', message: 'You cannot suspend your own administrator account.' });
    return;
  }

  try {
    const { data: target, error: targetError } = await supabaseAdmin!
      .from('users').select('is_active').eq('id', targetUserId).maybeSingle();
    if (targetError) {
      console.error('Admin target status lookup failed:', targetError.message);
      unavailable(res, 'ADMIN_USER_STATUS_LOOKUP_FAILED');
      return;
    }
    if (!target) {
      res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'The target user does not exist.' });
      return;
    }
    const previousActive = target.is_active !== false;
    if (previousActive === isActive) {
      res.json({ success: true, data: { target_user_id: targetUserId, is_active: isActive, changed: false } });
      return;
    }

    const { error: authError } = await supabaseAdmin!.auth.admin.updateUserById(targetUserId, {
      ban_duration: isActive ? 'none' : '876000h',
    });
    if (authError) {
      console.error('Supabase Auth account status update failed:', authError.message);
      res.status(503).json({
        success: false,
        code: 'AUTH_ACCOUNT_STATUS_UPDATE_FAILED',
        message: 'Supabase Auth could not update this account. No database status change was applied.',
      });
      return;
    }

    const { data, error } = await supabaseAdmin!.rpc('admin_set_user_active', {
      p_actor_user_id: req.userId,
      p_target_user_id: targetUserId,
      p_is_active: isActive,
    });
    if (error) {
      // Keep Auth and public.users aligned if the database guard rejects the change.
      const { error: rollbackError } = await supabaseAdmin!.auth.admin.updateUserById(targetUserId, {
        ban_duration: previousActive ? 'none' : '876000h',
      });
      if (rollbackError) {
        console.error('CRITICAL: Auth status rollback failed after database rejection:', rollbackError.message);
        unavailable(res, 'ACCOUNT_STATUS_PARTIAL_FAILURE');
        return;
      }
      if (error.code === 'P0002') {
        res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'The target user does not exist.' });
        return;
      }
      if (error.code === '42501') {
        res.status(403).json({ success: false, code: 'ADMIN_REQUIRED', message: 'Administrator privileges are required.' });
        return;
      }
      if (error.code === '23514') {
        res.status(409).json({ success: false, code: 'LAST_ADMIN_PROTECTED', message: 'The last active administrator cannot be suspended.' });
        return;
      }
      if (error.code === '22023') {
        res.status(400).json({ success: false, code: 'INVALID_ACCOUNT_STATUS_CHANGE', message: 'The account status change is not permitted.' });
        return;
      }
      console.error('Admin account status RPC failed:', error.message);
      unavailable(res, 'ADMIN_ACCOUNT_STATUS_CHANGE_FAILED');
      return;
    }

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase');
    res.json({
      success: true,
      data,
      provenance: { source: 'supabase.auth.admin + admin_set_user_active + admin_audit_logs', verified: true },
    });
  } catch (error) {
    console.error('Admin account status change failed:', error);
    unavailable(res, 'ADMIN_ACCOUNT_STATUS_CHANGE_FAILED');
  }
}

const ADMIN_MANAGED_ROLES = new Set([
  'admin', 'farmer', 'agronomist', 'trader',
  'veterinarian', 'inspector', 'government', 'investor',
]);

export async function updateAdminUserRole(req: Request, res: Response): Promise<void> {
  // Mutations must be attributable to a real signed-in administrator.
  // Operator tokens may bootstrap accounts, but are not accepted as a human actor.
  if (req.identitySource !== 'jwt' || !req.userId) {
    res.status(403).json({
      success: false,
      code: 'VERIFIED_ADMIN_SESSION_REQUIRED',
      message: 'Sign in with a verified administrator account before changing roles.',
    });
    return;
  }
  if (!databaseReady(res)) return;

  const targetUserId = typeof req.params.userId === 'string' ? req.params.userId : '';
  const newRole = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
    res.status(400).json({ success: false, code: 'INVALID_USER_ID', message: 'A valid user ID is required.' });
    return;
  }
  if (!ADMIN_MANAGED_ROLES.has(newRole)) {
    res.status(400).json({ success: false, code: 'INVALID_ROLE', message: 'The requested role is not supported.' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin!.rpc('admin_change_user_role', {
      p_actor_user_id: req.userId,
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    });
    if (error) {
      const message = error.message || '';
      if (error.code === 'P0002') {
        res.status(404).json({ success: false, code: 'USER_NOT_FOUND', message: 'The target user does not exist.' });
        return;
      }
      if (error.code === '42501') {
        res.status(403).json({ success: false, code: 'ADMIN_REQUIRED', message: 'Administrator privileges are required.' });
        return;
      }
      if (error.code === '23514') {
        res.status(409).json({ success: false, code: 'LAST_ADMIN_PROTECTED', message: 'The last active administrator cannot be demoted.' });
        return;
      }
      if (error.code === '22023') {
        res.status(400).json({ success: false, code: 'INVALID_ROLE_CHANGE', message: 'The role change request is invalid.' });
        return;
      }
      console.error('Admin role change RPC failed:', message);
      unavailable(res, 'ADMIN_ROLE_CHANGE_NOT_READY');
      return;
    }

    res.setHeader('X-AgroGrowth-Data-Status', 'verified');
    res.setHeader('X-AgroGrowth-Data-Provenance', 'supabase');
    res.json({
      success: true,
      data,
      provenance: { source: 'supabase.admin_change_user_role + admin_audit_logs', verified: true },
    });
  } catch (error) {
    console.error('Admin role change failed:', error);
    unavailable(res, 'ADMIN_ROLE_CHANGE_FAILED');
  }
}

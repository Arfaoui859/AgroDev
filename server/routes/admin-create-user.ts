import { RequestHandler } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { safeInsert as serverSafeInsert } from '../lib/supabaseHelpers';

export const adminCreateUser: RequestHandler = async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || adminToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Supabase admin client not configured' });
  }

  const { email, password, full_name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password in request body' });
  }

  try {
    // Create user in Supabase Auth (confirmed)
    const { data: authData, error: authError } = await (supabaseAdmin as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      // If user already exists, try to find it
      if (authError.message && authError.message.includes('already registered')) {
        // find existing user
        const { data: listData } = await (supabaseAdmin as any).auth.admin.listUsers();
        const existing = listData?.users?.find((u: any) => u.email === email);
        if (!existing) throw authError;
        // proceed with existing user id
        const userId = existing.id;
        // Insert into users table as admin
        const { error: insertErr } = await serverSafeInsert(supabaseAdmin as any, 'users', {
          id: userId,
          email,
          full_name: full_name || null,
          role: 'admin',
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (insertErr) {
          return res.status(500).json({ success: false, error: insertErr.message });
        }
        return res.json({ success: true, message: 'Existing user promoted to admin', userId });
      }

      return res.status(500).json({ success: false, error: authError.message });
    }

    const userId = authData?.user?.id;

    // Insert into custom users table
    const { error: userTableError } = await serverSafeInsert(supabaseAdmin as any, 'users', {
      id: userId,
      email,
      full_name: full_name || null,
      role: 'admin',
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userTableError) {
      return res.status(500).json({ success: false, error: userTableError.message });
    }

    return res.json({ success: true, message: 'Admin user created', userId });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

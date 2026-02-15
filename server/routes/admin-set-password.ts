import { RequestHandler } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';

export const adminSetPassword: RequestHandler = async (req, res) => {
  const adminToken = req.header('x-admin-token');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || adminToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Supabase admin client not configured' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password in request body' });
  }

  try {
    // Find user by email
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const users = listData.users || [];
    const user = users.find((u: any) => u.email === email);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Update password via admin API
    const adminApi: any = (supabaseAdmin as any).auth?.admin;
    let updateResult: any = null;
    if (adminApi && typeof adminApi.updateUser === 'function') {
      const { data, error } = await adminApi.updateUser(user.id, { password });
      if (error) throw error;
      updateResult = data;
    } else if (adminApi && typeof adminApi.updateUserById === 'function') {
      const { data, error } = await adminApi.updateUserById(user.id, { password });
      if (error) throw error;
      updateResult = data;
    } else {
      // Fallback to REST Admin API
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

      const resp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Admin REST update failed: ${resp.status} ${txt}`);
      }

      updateResult = await resp.json();
    }

    return res.json({ success: true, userId: user.id, email: user.email, result: updateResult });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

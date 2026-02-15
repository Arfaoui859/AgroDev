import { RequestHandler } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';

export const confirmUnconfirmedUsers: RequestHandler = async (req, res) => {
  // Protected by header x-admin-token matching service role key
  const adminToken = req.header('x-admin-token');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || adminToken !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(403).json({ success: false, error: 'Forbidden: invalid admin token' });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Supabase admin client not configured' });
  }

  try {
    // List users (paginate if necessary)
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const users = listData.users || [];

    const toConfirm = users.filter((u: any) => !u.email_confirmed_at && u.email);

    const results: any[] = [];

    for (const u of toConfirm) {
      try {
        // Try admin update to set email_confirmed_at
        // Use admin.updateUser if available
        let updateResult: any = null;
        const adminApi: any = (supabaseAdmin as any).auth?.admin;
        if (adminApi && typeof adminApi.updateUser === 'function') {
          const { data, error } = await adminApi.updateUser(u.id, { email_confirm: true });
          if (error) throw error;
          updateResult = data;
        } else if (adminApi && typeof adminApi.updateUserById === 'function') {
          const { data, error } = await adminApi.updateUserById(u.id, { email_confirm: true });
          if (error) throw error;
          updateResult = data;
        } else {
          // Fallback: attempt REST call to Supabase Admin endpoint
          const supabaseUrl = process.env.SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

          const resp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${u.id}`, {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email_confirm: true }),
          });

          if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Admin REST update failed: ${resp.status} ${txt}`);
          }

          updateResult = await resp.json();
        }

        results.push({ id: u.id, email: u.email, confirmed: true, result: updateResult });
      } catch (e: any) {
        results.push({ id: u.id, email: u.email, confirmed: false, error: e.message });
      }
    }

    return res.json({ success: true, attempted: toConfirm.length, results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

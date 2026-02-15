import { RequestHandler } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { safeInsert } from '../lib/supabaseHelpers';

export const setupAdminUser: RequestHandler = async (req, res) => {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Supabase admin client not configured',
    });
  }

  const { email = 'admin@agrogrowth.com', password = 'admin123' } = req.body || {};

  try {
    let userId: string;
    let created = false;

    // Try to create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'مدير النظام',
        full_name_ar: 'مدير النظام',
        role: 'admin',
      },
    });

    if (authError) {
      // If user already exists, find them
      if (authError.message?.includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === email);

        if (!existingUser) {
          return res.status(400).json({
            success: false,
            error: 'User already registered but cannot be found',
          });
        }

        userId = existingUser.id;
      } else {
        return res.status(400).json({
          success: false,
          error: authError.message || 'Failed to create auth user',
        });
      }
    } else {
      userId = authData.user?.id || '';
      created = true;
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Failed to get user ID',
      });
    }

    // Create or update user record in custom table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          id: userId,
          email,
          full_name: 'مدير النظام',
          full_name_ar: 'مدير النظام',
          role: 'admin',
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select();

    if (userError) {
      console.log('User record upsert note:', userError.message);
    }

    // Create user profile if it doesn't exist
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          preferences: {
            language: 'ar',
            notifications: true,
            weather_alerts: true,
            market_alerts: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select();

    if (profileError) {
      console.log('Profile upsert note:', profileError.message);
    }

    return res.json({
      success: true,
      message: `Admin user '${email}' has been set up successfully`,
      userId,
      email,
      role: 'admin',
      created,
    });
  } catch (error: any) {
    console.error('Setup admin user error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to set up admin user',
    });
  }
};

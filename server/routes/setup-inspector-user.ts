import { RequestHandler } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { safeInsert } from '../lib/supabaseHelpers';

interface UserSetupRequest {
  email: string;
  password: string;
  full_name?: string;
  full_name_ar?: string;
  role?: 'farmer' | 'agronomist' | 'trader' | 'veterinarian' | 'admin' | 'inspector';
}

export const setupInspectorUser: RequestHandler = async (req, res) => {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({ 
      success: false, 
      error: 'Supabase admin client not configured' 
    });
  }

  const body = req.body as UserSetupRequest;
  
  if (!body.email || !body.password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }

  const email = body.email;
  const password = body.password;
  const fullName = body.full_name || 'مستخدم';
  const fullNameAr = body.full_name_ar || fullName;
  const role = body.role || 'inspector';

  try {
    // Try to create user in Supabase Auth
    let userId: string;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        full_name_ar: fullNameAr,
        role,
      },
    });

    if (authError) {
      // If user already exists, try to get existing user
      if (authError.message?.includes('already registered')) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === email);
        
        if (!existingUser) {
          return res.status(400).json({ 
            success: false, 
            error: 'User already registered but cannot be found' 
          });
        }
        
        userId = existingUser.id;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: authError.message || 'Failed to create auth user' 
        });
      }
    } else {
      userId = authData.user?.id || '';
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to get user ID' 
      });
    }

    // Try to create/update user record in custom table
    const { error: userError } = await safeInsert(supabaseAdmin, 'users', {
      id: userId,
      email,
      full_name: fullName,
      full_name_ar: fullNameAr,
      role,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) {
      console.log('User record error (continuing):', userError.message);
    }

    // Try to create user profile
    const { error: profileError } = await safeInsert(supabaseAdmin, 'user_profiles', {
      user_id: userId,
      preferences: {
        language: 'ar',
        notifications: true,
        weather_alerts: true,
        market_alerts: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.log('Profile creation error (continuing):', profileError.message);
    }

    return res.json({ 
      success: true, 
      message: `User '${email}' (${role}) has been set up successfully`,
      userId,
      email,
      role,
    });
  } catch (error: any) {
    console.error('Setup inspector user error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to set up user' 
    });
  }
};

// Bulk setup function for multiple users
export const setupMultipleUsers: RequestHandler = async (req, res) => {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(500).json({ 
      success: false, 
      error: 'Supabase admin client not configured' 
    });
  }

  const users = req.body.users as UserSetupRequest[];
  
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Users array is required and must not be empty' 
    });
  }

  const results = {
    successful: [] as any[],
    failed: [] as any[],
    total: users.length,
  };

  for (const userConfig of users) {
    try {
      if (!userConfig.email || !userConfig.password) {
        results.failed.push({
          email: userConfig.email,
          reason: 'Email and password are required',
        });
        continue;
      }

      let userId: string;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true,
        user_metadata: {
          full_name: userConfig.full_name || 'مستخدم',
          full_name_ar: userConfig.full_name_ar || userConfig.full_name || 'مستخدم',
          role: userConfig.role || 'farmer',
        },
      });

      if (authError) {
        if (authError.message?.includes('already registered')) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData?.users?.find(u => u.email === userConfig.email);
          
          if (!existingUser) {
            results.failed.push({
              email: userConfig.email,
              reason: 'User already registered but cannot be found',
            });
            continue;
          }
          userId = existingUser.id;
        } else {
          results.failed.push({
            email: userConfig.email,
            reason: authError.message || 'Failed to create auth user',
          });
          continue;
        }
      } else {
        userId = authData.user?.id || '';
      }

      if (!userId) {
        results.failed.push({
          email: userConfig.email,
          reason: 'Failed to get user ID',
        });
        continue;
      }

      // Create user record
      const { error: userError } = await safeInsert(supabaseAdmin, 'users', {
        id: userId,
        email: userConfig.email,
        full_name: userConfig.full_name || 'مستخدم',
        full_name_ar: userConfig.full_name_ar || userConfig.full_name || 'مستخدم',
        role: userConfig.role || 'farmer',
        verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Create profile
      await safeInsert(supabaseAdmin, 'user_profiles', {
        user_id: userId,
        preferences: {
          language: 'ar',
          notifications: true,
          weather_alerts: true,
          market_alerts: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      results.successful.push({
        email: userConfig.email,
        role: userConfig.role || 'farmer',
        userId,
      });
    } catch (error: any) {
      results.failed.push({
        email: userConfig.email,
        reason: error.message || 'Unknown error',
      });
    }
  }

  return res.json(results);
};

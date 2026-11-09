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
    return res.status(503).json({
      success: false,
      error: "Supabase admin client is not configured",
    });
  }

  const body = req.body as UserSetupRequest;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.full_name === "string" && body.full_name.trim()
    ? body.full_name.trim()
    : "مراقب الحقول";

  if (!email || !password || password.length < 12) {
    return res.status(400).json({
      success: false,
      error: "A valid email and a password of at least 12 characters are required",
    });
  }

  try {
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    let userId = authData.user?.id;
    if (authError) {
      if (!authError.message.toLowerCase().includes("already registered")) {
        return res.status(400).json({
          success: false,
          error: authError.message,
        });
      }

      const { data: listed, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      userId = listed.users.find((user) => user.email?.toLowerCase() === email)?.id;
    }

    if (!userId) {
      return res.status(409).json({
        success: false,
        error: "Auth identity could not be resolved",
      });
    }

    const { data: persisted, error: userError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: "inspector",
        email_verified: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("id, email, role")
      .single();

    if (userError || persisted?.role !== "inspector") {
      console.error("Inspector user persistence failed:", userError);
      return res.status(500).json({
        success: false,
        error: "Inspector role was not persisted",
      });
    }

    const { data: profile, error: profileLookupError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileLookupError) {
      return res.status(500).json({
        success: false,
        error: "Unable to verify inspector profile",
      });
    }

    if (!profile) {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({ user_id: userId });
      if (profileError) {
        return res.status(500).json({
          success: false,
          error: "Inspector account was created but profile persistence failed",
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Inspector account '${email}' has been configured`,
      userId,
      email,
      role: "inspector",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set up inspector";
    console.error("Setup inspector user error:", message);
    return res.status(500).json({ success: false, error: message });
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
          const existingUser = (listData?.users as any[])?.find(u => u.email === userConfig.email);
          
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

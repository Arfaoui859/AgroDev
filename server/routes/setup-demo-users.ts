import { RequestHandler } from "express";
import { supabaseAdmin, isSupabaseConfigured, supabase } from "../lib/supabase";
import { safeInsert as serverSafeInsert } from "../lib/supabaseHelpers";

// Demo users to create
const demoUsers = [
  {
    email: "farmer@demo.com",
    password: "demo123",
    userData: {
      full_name: "أحمد المزارع",
      full_name_ar: "أ��مد المزارع",
      role: "farmer",
      location: "تونس",
      specialization: "الزراعة العامة",
      verified: true,
    },
  },
  {
    email: "agronomist@demo.com",
    password: "demo123",
    userData: {
      full_name: "دكتور سارة الخبيرة",
      full_name_ar: "دكتور سارة الخبيرة",
      role: "agronomist",
      location: "تونس",
      specialization: "علوم النبات",
      experience_years: 10,
      verified: true,
    },
  },
  {
    email: "admin@demo.com",
    password: "demo123",
    userData: {
      full_name: "مدير النظام",
      full_name_ar: "مدير النظام",
      role: "admin",
      location: "تونس",
      specialization: "إدارة النظام",
      verified: true,
    },
  },
  {
    email: "trader@demo.com",
    password: "demo123",
    userData: {
      full_name: "محمد التاجر",
      full_name_ar: "محمد التاجر",
      role: "trader",
      location: "تونس",
      specialization: "تجارة المنتجات الزراعية",
      verified: true,
    },
  },
  {
    email: "veterinarian@demo.com",
    password: "demo123",
    userData: {
      full_name: "دكتور فاطمة البيطارة",
      full_name_ar: "دكتور فاطمة البيطارة",
      role: "veterinarian",
      location: "تونس",
      specialization: "الطب البيطري",
      experience_years: 8,
      verified: true,
    },
  },
];

async function createDemoUser(userInfo: any) {
  const results = {
    email: userInfo.email,
    authCreated: false,
    userRecordCreated: false,
    profileCreated: false,
    errors: [] as string[],
  };

  try {
    // First, try to create the user with Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userInfo.email,
        password: userInfo.password,
        email_confirm: true, // Auto-confirm email for demo users
        user_metadata: userInfo.userData,
      });

    if (authError) {
      // If user already exists, that's ok
      if (authError.message.includes("already registered")) {
        results.authCreated = true;
        results.errors.push("User already exists in auth");
      } else {
        results.errors.push(`Auth error: ${authError.message}`);
        return results;
      }
    } else {
      results.authCreated = true;
    }

    // Get user ID from existing user if creation failed due to existing user
    let userId = authData?.user?.id;
    if (!userId) {
      // Try to get existing user
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.users.find((u) => u.email === userInfo.email);
      userId = existingUser?.id;
    }

    if (!userId) {
      results.errors.push("Could not get user ID");
      return results;
    }

    // Try to create user record in custom table (if it exists)
    try {
      const payload = {
        id: userId,
        email: userInfo.email,
        ...userInfo.userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: userTableError } = await serverSafeInsert(
        supabaseAdmin as any,
        "users",
        payload,
      );

      if (userTableError) {
        results.errors.push(`Custom table error: ${userTableError.message}`);
      } else {
        results.userRecordCreated = true;
      }
    } catch (tableError: any) {
      results.errors.push(
        `Custom table operation failed: ${tableError.message}`,
      );
    }

    // Try to create user profile (if table exists)
    try {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          user_id: userId,
          preferences: {
            language: "ar",
            notifications: true,
            weather_alerts: true,
            market_alerts: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        results.errors.push(`Profile table error: ${profileError.message}`);
      } else {
        results.profileCreated = true;
      }
    } catch (profileTableError: any) {
      results.errors.push(
        `Profile table operation failed: ${profileTableError.message}`,
      );
    }

    return results;
  } catch (error: any) {
    results.errors.push(`General error: ${error.message}`);
    return results;
  }
}

export const setupDemoUsers: RequestHandler = async (req, res) => {
  // Ensure Supabase admin credentials are present for admin operations
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!isSupabaseConfigured) {
    return res.status(500).json({
      success: false,
      error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    });
  }

  if (!hasServiceRoleKey) {
    return res.status(400).json({
      success: false,
      error:
        "Missing SUPABASE_SERVICE_ROLE_KEY. Admin operations require the service role key.",
      troubleshooting: [
        "Set SUPABASE_SERVICE_ROLE_KEY in your environment variables (service role key from Supabase project settings).",
        "Do NOT expose the service role key in client-side code.",
      ],
    });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error:
        "Supabase admin client is not available. Verify SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL.",
    });
  }
  try {
    console.log("🚀 Setting up demo users for AgroGrowth Platform...");

    // Test Supabase connection first
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
      }
      console.log(
        `✅ Supabase connection successful. Found ${data.users.length} existing users.`,
      );
    } catch (connectionError: any) {
      return res.status(500).json({
        success: false,
        error: `Connection test failed: ${connectionError.message}`,
        troubleshooting: [
          "Check that SUPABASE_URL is correct",
          "Ensure SUPABASE_SERVICE_ROLE_KEY is set (for admin operations)",
          "Verify the service role key has admin permissions",
        ],
      });
    }

    // Create each demo user
    const results = [];
    for (const userInfo of demoUsers) {
      console.log(`🔄 Creating demo user: ${userInfo.email}`);
      const result = await createDemoUser(userInfo);
      results.push(result);
    }

    const successCount = results.filter((r) => r.authCreated).length;

    console.log(
      `🎉 Demo user setup completed! Successfully processed ${successCount}/${demoUsers.length} users`,
    );

    res.json({
      success: true,
      message: `Demo user setup completed! Successfully processed ${successCount}/${demoUsers.length} users`,
      results,
      demoCredentials: demoUsers.map((u) => ({
        role: u.userData.role,
        email: u.email,
        password: u.password,
      })),
      notes: [
        "Demo accounts can now be used to log into the application.",
        "If custom table creation failed due to RLS policies, users can still authenticate with Supabase Auth.",
        "The app will use fallback user data for users without custom table records.",
      ],
    });
  } catch (error: any) {
    console.error("❌ Demo user setup failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to set up demo users",
    });
  }
};

export const getDemoUsers: RequestHandler = async (req, res) => {
  res.json({
    demoUsers: demoUsers.map((u) => ({
      email: u.email,
      password: u.password,
      role: u.userData.role,
      name: u.userData.full_name,
    })),
  });
};

export const deleteDemoUsers: RequestHandler = async (req, res) => {
  // Delete demo users and related records. Requires SUPABASE_SERVICE_ROLE_KEY.
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!isSupabaseConfigured) {
    return res.status(500).json({
      success: false,
      error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    });
  }

  if (!hasServiceRoleKey || !supabaseAdmin) {
    return res.status(400).json({
      success: false,
      error:
        "Missing SUPABASE_SERVICE_ROLE_KEY or admin client unavailable. Cannot perform deletion.",
      troubleshooting: [
        "Set SUPABASE_SERVICE_ROLE_KEY in your environment variables (service role key from Supabase project settings).",
      ],
    });
  }

  try {
    // Fetch all users and filter demo emails
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(listError.message);
    }

    const emailsToDelete = demoUsers.map((u) => u.email);
    const usersToDelete = listData.users.filter((u) => emailsToDelete.includes(u.email || ""));

    const results: any[] = [];

    for (const user of usersToDelete) {
      const r: any = { email: user.email, id: user.id };
      try {
        // Delete from Auth
        const { error: delAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (delAuthError) {
          r.authDeleted = false;
          r.authError = delAuthError.message;
        } else {
          r.authDeleted = true;
        }
      } catch (e: any) {
        r.authDeleted = false;
        r.authError = e.message;
      }

      try {
        // Delete from custom 'users' table
        const { error: delUserTableError } = await supabaseAdmin.from("users").delete().eq("id", user.id);
        if (delUserTableError) {
          r.userTableDeleted = false;
          r.userTableError = delUserTableError.message;
        } else {
          r.userTableDeleted = true;
        }
      } catch (e: any) {
        r.userTableDeleted = false;
        r.userTableError = e.message;
      }

      try {
        // Delete from 'user_profiles' table
        const { error: delProfileError } = await supabaseAdmin.from("user_profiles").delete().eq("user_id", user.id);
        if (delProfileError) {
          r.profileDeleted = false;
          r.profileError = delProfileError.message;
        } else {
          r.profileDeleted = true;
        }
      } catch (e: any) {
        r.profileDeleted = false;
        r.profileError = e.message;
      }

      results.push(r);
    }

    return res.json({ success: true, deleted: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

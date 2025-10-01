#!/usr/bin/env node

/**
 * Demo User Setup Script for AgroGrowth Platform
 * Creates demo users in Supabase for testing and development
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Supabase configuration
const supabaseUrl =
  process.env.SUPABASE_URL || "https://jymrhhlwdbclctobhbsi.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service key for admin operations, fallback to anon key for basic operations
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTM2NDYsImV4cCI6MjA3MDE4OTY0Nn0.l2VjAq1vZgkiAeL2EtAJp3iUWBHWbXPmQdNuNq197po",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Demo users to create
const demoUsers = [
  {
    email: "farmer@demo.com",
    password: "demo123",
    userData: {
      full_name: "أحمد المزارع",
      full_name_ar: "أحمد المزارع",
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

async function createDemoUser(userInfo) {
  console.log(`🔄 Creating demo user: ${userInfo.email}`);

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
        console.log(`⚠️  User ${userInfo.email} already exists, skipping...`);
        return true;
      }
      console.error(`❌ Auth error for ${userInfo.email}:`, authError.message);
      return false;
    }

    const user = authData.user;
    console.log(`✅ Auth user created: ${user.email}`);

    // Try to create user record in custom table (if it exists)
    try {
      const { error: userTableError } = await supabaseAdmin
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          ...userInfo.userData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userTableError) {
        console.log(
          `⚠️  Custom users table not available or RLS blocking: ${userTableError.message}`,
        );
      } else {
        console.log(`✅ Custom user record created for ${user.email}`);
      }
    } catch (tableError) {
      console.log(
        `⚠️  Custom users table operation failed: ${tableError.message}`,
      );
    }

    // Try to create user profile (if table exists)
    try {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({
          user_id: user.id,
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
        console.log(
          `⚠️  Custom profiles table not available or RLS blocking: ${profileError.message}`,
        );
      } else {
        console.log(`✅ User profile created for ${user.email}`);
      }
    } catch (profileTableError) {
      console.log(
        `⚠️  Custom profiles table operation failed: ${profileTableError.message}`,
      );
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to create user ${userInfo.email}:`, error.message);
    return false;
  }
}

async function setupDemoUsers() {
  console.log("🚀 Setting up demo users for AgroGrowth Platform...\n");

  // Test Supabase connection first
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
      console.log("\n💡 Troubleshooting tips:");
      console.log("1. Check that SUPABASE_URL is correct");
      console.log(
        "2. Ensure SUPABASE_SERVICE_ROLE_KEY is set (for admin operations)",
      );
      console.log("3. Verify the service role key has admin permissions");
      return;
    }
    console.log(
      `✅ Supabase connection successful. Found ${data.users.length} existing users.\n`,
    );
  } catch (connectionError) {
    console.error("❌ Connection test failed:", connectionError.message);
    return;
  }

  // Create each demo user
  let successCount = 0;
  for (const userInfo of demoUsers) {
    const success = await createDemoUser(userInfo);
    if (success) successCount++;
    console.log(""); // Add spacing between users
  }

  console.log(`\n🎉 Demo user setup completed!`);
  console.log(
    `✅ Successfully processed ${successCount}/${demoUsers.length} users`,
  );

  if (successCount > 0) {
    console.log("\n🔑 Demo account credentials:");
    demoUsers.forEach((user) => {
      console.log(`   ${user.userData.role}: ${user.email} / ${user.password}`);
    });

    console.log(
      "\n📝 These accounts can now be used to log into the application.",
    );
    console.log(
      "Note: If custom table creation failed due to RLS policies, users can still",
    );
    console.log(
      "authenticate with Supabase Auth and the app will use fallback user data.",
    );
  }
}

// Run the setup
setupDemoUsers().catch(console.error);

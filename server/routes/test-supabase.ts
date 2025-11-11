import { RequestHandler } from "express";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "../lib/supabase";

export const testSupabaseConnection: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Testing Supabase connection...");

    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase not configured; skipping tests");
      return res.json({
        status: "skipped",
        message: "Supabase not configured in this environment",
      });
    }

    // Test basic connection
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("✅ Supabase Auth connection successful");

    // Test users table
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (usersError) {
      console.error("❌ Users table error:", {
        message: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint,
      });
    } else {
      console.log("✅ Users table accessible");
    }

    // Test user_profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (profilesError) {
      console.error("❌ User_profiles table error:", {
        message: profilesError.message,
        code: profilesError.code,
        details: profilesError.details,
        hint: profilesError.hint,
      });
    } else {
      console.log("✅ User_profiles table accessible");
    }

    // Test insert permissions with a real test
    console.log("🧪 Testing insert permissions...");

    let insertTest = "skipped";
    let insertError = null;

    if (supabaseAdmin) {
      // Use admin client to bypass RLS for this diagnostic
      const { error } = await supabaseAdmin
        .from("users")
        .insert({ email: "test@example.com" });

      insertError = error;
      if (!error) {
        insertTest = "success";
        // Clean up test record
        await supabaseAdmin
          .from("users")
          .delete()
          .eq("email", "test@example.com");
        console.log("🧹 Test record cleaned up");
      } else {
        insertTest = "failed";
        console.error("❌ Insert test failed (admin client):", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }
    } else {
      console.warn(
        "Supabase admin client not available; skipping insert permission test",
      );
      insertTest = "skipped";
    }

    // Return results
    const results = {
      timestamp: new Date().toISOString(),
      supabase_connection: "success",
      users_table: usersError ? "error" : "success",
      profiles_table: profilesError ? "error" : "success",
      insert_permissions: insertTest,
      errors: {
        users_error: usersError
          ? {
              message: usersError.message,
              code: usersError.code,
              hint: usersError.hint,
            }
          : null,
        profiles_error: profilesError
          ? {
              message: profilesError.message,
              code: profilesError.code,
              hint: profilesError.hint,
            }
          : null,
        insert_error: insertError
          ? {
              message: insertError.message,
              code: insertError.code,
              hint: insertError.hint,
            }
          : null,
      },
      ready_for_registration:
        !usersError && !profilesError && insertTest === "success",
    };

    res.json({
      status: "success",
      message: "Supabase connection test completed",
      data: results,
    });
  } catch (error: any) {
    console.error("❌ Supabase test failed:", error);
    res.status(500).json({
      status: "error",
      message: "Supabase connection test failed",
      error: error.message,
    });
  }
};

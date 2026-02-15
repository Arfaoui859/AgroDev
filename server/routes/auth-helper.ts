import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

export const createUserWithProfile: RequestHandler = async (req, res) => {
  try {
    const { userId, email, userData } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId and email",
      });
    }

    console.log(`🔄 Creating user record with admin permissions for: ${email}`);

    // Use admin client to bypass RLS
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: email,
        full_name: userData?.full_name || email.split("@")[0],
        full_name_ar: userData?.full_name_ar || "مستخدم",
        role: userData?.role || "farmer",
        location: userData?.location,
        specialization: userData?.specialization,
        experience_years: userData?.experience_years,
        verified: userData?.verified || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      console.error("❌ Error creating user record:", userError);
      return res.status(500).json({
        success: false,
        error: userError.message,
        code: userError.code,
      });
    }

    console.log("✅ User record created successfully");

    // Try to create user profile
    const { data: profileRecord, error: profileError } = await supabaseAdmin
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
      })
      .select()
      .single();

    if (profileError) {
      console.error(
        "⚠️ Error creating profile (continuing anyway):",
        profileError,
      );
    } else {
      console.log("✅ User profile created successfully");
    }

    res.json({
      success: true,
      user: userRecord,
      profile: profileRecord,
      message: "User and profile created successfully",
    });
  } catch (error: any) {
    console.error("❌ Server error creating user:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const checkUserExists: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .single();

    if (error) {
      return res.json({
        exists: false,
        error: error.message,
      });
    }

    res.json({
      exists: true,
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      exists: false,
      error: error.message,
    });
  }
};

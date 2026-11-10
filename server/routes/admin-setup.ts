import { RequestHandler } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const setupAdminUser: RequestHandler = async (req, res) => {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(503).json({
      success: false,
      error: "Supabase admin client is not configured",
    });
  }

  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password = typeof req.body?.password === "string"
    ? req.body.password
    : "";

  // Never ship or silently apply default administrator credentials.
  if (!EMAIL_PATTERN.test(email) || password.length < 12) {
    return res.status(400).json({
      success: false,
      error: "A valid email and a password of at least 12 characters are required",
    });
  }

  try {
    let userId: string;
    let created = false;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "مدير النظام" },
      });

    if (authError) {
      if (!authError.message?.toLowerCase().includes("already registered")) {
        return res.status(400).json({
          success: false,
          error: authError.message || "Failed to create administrator identity",
        });
      }

      const { data: listData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;

      const existingUser = listData.users.find(
        (candidate) => candidate.email?.toLowerCase() === email,
      );
      if (!existingUser) {
        return res.status(409).json({
          success: false,
          error: "The identity already exists but could not be resolved",
        });
      }
      userId = existingUser.id;

      // The operator explicitly supplies the bootstrap password in this
      // token-protected request. Apply it to an existing Auth identity too;
      // otherwise the setup response would misleadingly imply that the
      // submitted password is usable for login.
      const { error: passwordError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name: "مدير النظام" },
        });
      if (passwordError) {
        return res.status(400).json({
          success: false,
          error: passwordError.message || "Failed to update administrator password",
        });
      }
    } else {
      if (!authData.user?.id) {
        throw new Error("Supabase Auth did not return a user ID");
      }
      userId = authData.user.id;
      created = true;
    }

    // Use only columns that exist in database/cloud-setup.sql.
    const { data: persistedUser, error: userError } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
          email,
          full_name: "مدير النظام",
          role: "admin",
          email_verified: true,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("id, email, role")
      .single();

    if (userError || persistedUser?.role !== "admin") {
      console.error("Administrator profile persistence failed:", userError);
      return res.status(500).json({
        success: false,
        error: "Administrator identity exists, but the database role was not persisted",
      });
    }

    // Profile preferences are not columns in the current user_profiles schema.
    const { data: existingProfile, error: profileLookupError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

    if (profileLookupError) {
      console.warn("Administrator profile lookup failed:", profileLookupError.message);
    } else if (!existingProfile) {
      const { error: profileInsertError } = await supabaseAdmin
        .from("user_profiles")
        .insert({ user_id: userId });
      if (profileInsertError) {
        console.warn("Administrator profile creation failed:", profileInsertError.message);
      }
    }

    return res.json({
      success: true,
      message: "Administrator account and database role are configured",
      userId,
      email,
      role: persistedUser.role,
      created,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set up administrator";
    console.error("Setup administrator error:", message);
    return res.status(500).json({ success: false, error: message });
  }
};

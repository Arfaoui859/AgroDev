import { RequestHandler } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase";
import { verifyAdminToken } from "../lib/adminAuth";
import { sanitizeNetworkMessage } from "../lib/errors";

export const ADMIN_EMAIL_PATTERN = /^[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+$/;

export const adminCreateUser: RequestHandler = async (req, res) => {
  if (!verifyAdminToken(req)) {
    return res.status(403).json({ success: false, error: "Forbidden: invalid admin token" });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(503).json({ success: false, error: "Supabase admin client is not configured" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const fullName = typeof req.body?.full_name === "string" ? req.body.full_name.trim() : "";

  if (!ADMIN_EMAIL_PATTERN.test(email) || password.length < 12) {
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
        user_metadata: { full_name: fullName || email.split("@")[0] },
      });

    let userId = authData.user?.id;
    if (authError) {
      if (!authError.message.toLowerCase().includes("already registered")) {
        return res.status(400).json({ success: false, error: sanitizeNetworkMessage(authError.message) });
      }

      const { data: listed, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      userId = listed.users.find((user) => user.email?.toLowerCase() === email)?.id;
    }

    if (!userId) {
      return res.status(409).json({ success: false, error: "Auth identity could not be resolved" });
    }

    const { data: persisted, error: persistError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email,
        full_name: fullName || email.split("@")[0],
        role: "admin",
        email_verified: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select("id, email, role")
      .single();

    if (persistError || persisted?.role !== "admin") {
      console.error("Admin user persistence failed:", persistError);
      return res.status(500).json({
        success: false,
        error: "Auth identity exists, but administrator role was not persisted",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Administrator account created or promoted",
      userId,
      email,
      role: persisted.role,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Admin user creation failed";
    return res.status(500).json({ success: false, error: message });
  }
};

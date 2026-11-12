import { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

/**
 * Idempotent self-provisioning of the caller's application profile.
 *
 * The primary provisioning path is the trusted `handle_new_auth_user` trigger
 * on `auth.users` (see `database/rls-hardening.sql`), which creates the
 * `public.users` row as `farmer`. If that trigger is missing on a given
 * database — a real cause of "registration succeeded but the farmer cannot
 * enter the dashboard" — the authenticated user has a valid Supabase session
 * but no profile row, and every role-gated route correctly fails closed.
 *
 * This endpoint is the compensating step. It is safe because:
 *  - identity comes only from the verified JWT (`requireAuth` sets `req.userId`);
 *  - the client can never supply a role or a user id — every created row is
 *    `farmer`, and an existing row is returned untouched (never elevated);
 *  - it is idempotent (`ON CONFLICT DO NOTHING`) and only fills a gap.
 */
export const ensureUserProfile: RequestHandler = async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      error: "PROFILE_PROVISIONING_UNAVAILABLE",
      message: "خدمة قاعدة البيانات غير مهيأة على الخادم.",
    });
  }

  const userId = req.userId;
  if (!userId || req.identitySource !== "jwt") {
    return res.status(401).json({
      success: false,
      error: "VERIFIED_SESSION_REQUIRED",
      message: "يلزم تسجيل دخول موثّق.",
    });
  }

  try {
    const PROFILE_COLUMNS =
      "id,email,full_name,role,requested_role,email_verified,is_active";
    const LEGACY_PROFILE_COLUMNS =
      "id,email,full_name,role,email_verified,is_active";

    const readProfile = (columns: string) =>
      supabaseAdmin!
        .from("users")
        .select(columns)
        .eq("id", userId)
        .maybeSingle();

    let { data: existing, error: readError } = await readProfile(PROFILE_COLUMNS);
    if (readError && /requested_role/.test(readError.message || "")) {
      ({ data: existing, error: readError } = await readProfile(LEGACY_PROFILE_COLUMNS));
    }

    if (readError) {
      console.error("[ensure-profile] users read failed:", readError.message);
      return res.status(503).json({
        success: false,
        error: "PROFILE_READ_FAILED",
        message: "تعذّر قراءة الملف الشخصي.",
      });
    }

    if (existing) {
      return res.json({
        success: true,
        created: false,
        profile: existing,
      });
    }

    // Row is missing: verify the identity against Supabase Auth before writing,
    // so a forged id can never mint a profile.
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      return res.status(401).json({
        success: false,
        error: "UNKNOWN_IDENTITY",
        message: "الهوية غير معروفة.",
      });
    }

    const email = authUser.user.email ?? null;
    const meta = authUser.user.user_metadata ?? {};
    const fullName =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (email ? email.split("@")[0] : "User");

    // Record (but never grant) the role the user asked for at signup, so an
    // administrator has a signal to approve. The account itself is always
    // created as `farmer`.
    const REQUESTABLE_ROLES = new Set([
      "farmer",
      "agronomist",
      "trader",
      "veterinarian",
      "inspector",
    ]);
    const requestedRole =
      typeof meta.requested_role === "string" &&
      REQUESTABLE_ROLES.has(meta.requested_role)
        ? meta.requested_role
        : null;

    const baseRow: Record<string, unknown> = {
      id: userId,
      email,
      full_name: fullName,
      role: "farmer",
      email_verified: Boolean(authUser.user.email_confirmed_at),
      is_active: true,
    };

    const insertProfile = (row: Record<string, unknown>) =>
      supabaseAdmin!
        .from("users")
        .insert(row)
        .select("id,email,full_name,role,requested_role,email_verified,is_active")
        .maybeSingle();

    // `requested_role` arrives with migration 20261112_requested_role.sql; if the
    // column is absent, fall back to the legacy insert instead of failing.
    let { data: created, error: insertError } = await insertProfile({
      ...baseRow,
      requested_role: requestedRole,
    });
    if (insertError && /requested_role/.test(insertError.message || "")) {
      ({ data: created, error: insertError } = await insertProfile(baseRow));
    }

    if (insertError) {
      // A concurrent request may have created the row between the read and the
      // insert; re-read rather than failing.
      let { data: raced } = await readProfile(PROFILE_COLUMNS);
      if (!raced) {
        ({ data: raced } = await readProfile(LEGACY_PROFILE_COLUMNS));
      }
      if (raced) {
        return res.json({ success: true, created: false, profile: raced });
      }
      console.error("[ensure-profile] users insert failed:", insertError.message);
      return res.status(503).json({
        success: false,
        error: "PROFILE_CREATE_FAILED",
        message: "تعذّر إنشاء الملف الشخصي.",
      });
    }

    // Best-effort companion row (no unique constraint on user_id, so check
    // first). Failure here must not fail the request.
    const { data: profileRow } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profileRow) {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .insert({ user_id: userId });
      if (profileError) {
        console.warn("[ensure-profile] user_profiles insert skipped:", profileError.message);
      }
    }

    return res.status(201).json({ success: true, created: true, profile: created });
  } catch (error) {
    console.error(
      "[ensure-profile] unexpected error:",
      error instanceof Error ? error.message : "unknown",
    );
    return res.status(500).json({
      success: false,
      error: "PROFILE_PROVISIONING_FAILED",
      message: "فشل تجهيز الملف الشخصي.",
    });
  }
};

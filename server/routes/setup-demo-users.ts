import { RequestHandler } from "express";
import { supabaseAdmin, isSupabaseConfigured } from "../lib/supabase";

const demoUsers = [
  { email: "farmer@demo.local", fullName: "أحمد المزارع", role: "farmer" },
  { email: "agronomist@demo.local", fullName: "دكتور سارة الخبيرة", role: "agronomist" },
  { email: "trader@demo.local", fullName: "محمد التاجر", role: "trader" },
  { email: "veterinarian@demo.local", fullName: "دكتور فاطمة البيطارة", role: "veterinarian" },
  { email: "inspector@demo.local", fullName: "مراقب الحقول", role: "inspector" },
] as const;

function demoEnabled(): boolean {
  return process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEMO_ENDPOINTS === "true";
}

function rejectIfDemoDisabled(res: Parameters<RequestHandler>[1]): boolean {
  if (demoEnabled()) return false;
  res.status(404).json({ success: false, error: "Demo provisioning is disabled" });
  return true;
}

async function resolveAuthUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: demoUsers.find((u) => u.email === email)?.fullName },
  });

  if (!error && data.user) return { user: data.user, created: true };
  if (!error || !error.message.toLowerCase().includes("already registered")) {
    throw error || new Error("Supabase Auth did not return a user");
  }

  const { data: listed, error: listError } =
    await supabaseAdmin!.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = listed.users.find((user) => user.email?.toLowerCase() === email);
  if (!existing) throw new Error("Existing demo identity could not be resolved");
  return { user: existing, created: false };
}

export const setupDemoUsers: RequestHandler = async (_req, res) => {
  if (rejectIfDemoDisabled(res)) return;
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(503).json({ success: false, error: "Supabase admin client is not configured" });
  }

  const password = process.env.DEMO_USER_PASSWORD || "";
  if (password.length < 12) {
    return res.status(400).json({
      success: false,
      error: "Set DEMO_USER_PASSWORD to a strong password of at least 12 characters for local demo use",
    });
  }

  const results: Array<{
    email: string;
    role: string;
    userId?: string;
    success: boolean;
    authCreated?: boolean;
    error?: string;
  }> = [];

  for (const demo of demoUsers) {
    try {
      const { user, created } = await resolveAuthUser(demo.email, password);
      const { data: persisted, error: userError } = await supabaseAdmin
        .from("users")
        .upsert({
          id: user.id,
          email: demo.email,
          full_name: demo.fullName,
          role: demo.role,
          email_verified: true,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select("id, role")
        .single();

      if (userError || persisted?.role !== demo.role) {
        throw userError || new Error("Demo role was not persisted");
      }

      const { data: profile, error: profileLookupError } = await supabaseAdmin
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profileLookupError && !profile) {
        const { error: profileInsertError } = await supabaseAdmin
          .from("user_profiles")
          .insert({ user_id: user.id });
        if (profileInsertError) {
          throw profileInsertError;
        }
      } else if (profileLookupError) {
        throw profileLookupError;
      }

      results.push({
        email: demo.email,
        role: demo.role,
        userId: user.id,
        success: true,
        authCreated: created,
      });
    } catch (error: unknown) {
      results.push({
        email: demo.email,
        role: demo.role,
        success: false,
        error: error instanceof Error ? error.message : "Unknown provisioning error",
      });
    }
  }

  const successful = results.filter((item) => item.success);
  return res.status(successful.length === results.length ? 200 : 207).json({
    success: successful.length === results.length,
    total: results.length,
    successful,
    failed: results.filter((item) => !item.success),
  });
};

export const getDemoUsers: RequestHandler = async (_req, res) => {
  if (rejectIfDemoDisabled(res)) return;
  return res.json({
    demoUsers: demoUsers.map((user) => ({
      email: user.email,
      role: user.role,
      name: user.fullName,
    })),
    passwordConfigured: Boolean(process.env.DEMO_USER_PASSWORD),
  });
};

export const deleteDemoUsers: RequestHandler = async (_req, res) => {
  if (rejectIfDemoDisabled(res)) return;
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(503).json({ success: false, error: "Supabase admin client is not configured" });
  }

  const { data, error } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  const demoEmails = new Set(demoUsers.map((user) => user.email));
  const targets = data.users.filter((user) =>
    user.email && demoEmails.has(user.email.toLowerCase() as (typeof demoUsers)[number]["email"]),
  );

  const results = [];
  for (const user of targets) {
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    results.push({
      email: user.email,
      userId: user.id,
      deleted: !deleteError,
      ...(deleteError ? { error: deleteError.message } : {}),
    });
  }

  return res.json({
    success: results.every((item) => item.deleted),
    deleted: results.filter((item) => item.deleted).length,
    results,
  });
};

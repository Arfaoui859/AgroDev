import crypto from "crypto";
import type { Request, Response } from "express";
import { scopedClientFromAuthHeader, supabaseAdmin } from "../lib/supabase";
import { runFarmAgentScan } from "../services/ai/autonomousFarmAgent";

function callerDb(req: Request) {
  return scopedClientFromAuthHeader(req.header("authorization"));
}

export async function getAutonomousAgentStatus(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(503).json({ success: false, code: "DATABASE_OR_AUTH_UNAVAILABLE" });
  const [{ data: settings, error: settingsError }, { data: farms, error: farmsError }] = await Promise.all([
    db.from("farm_agent_settings").select("enabled,cadence_minutes,last_scan_at,last_events_count").eq("user_id", req.userId).maybeSingle(),
    db.from("farms").select("id").eq("owner_id", req.userId),
  ]);
  if (settingsError || farmsError) {
    return res.status(503).json({ success: false, code: "AGENT_STATUS_UNAVAILABLE", message: settingsError?.message || farmsError?.message });
  }
  const cadence = settings?.cadence_minutes ?? 60;
  const lastScan = settings?.last_scan_at ? new Date(settings.last_scan_at) : null;
  return res.json({
    success: true,
    data: {
      enabled: settings?.enabled ?? true,
      cadenceMinutes: cadence,
      lastScanAt: settings?.last_scan_at ?? null,
      nextScanAt: lastScan ? new Date(lastScan.getTime() + cadence * 60_000).toISOString() : null,
      lastEventsCount: settings?.last_events_count ?? 0,
      farmsCount: farms?.length ?? 0,
      delivery: "in_app_only",
      scheduler: "GitHub Actions scheduled workflow",
    },
  });
}

export async function updateAutonomousAgentSettings(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(503).json({ success: false, code: "DATABASE_OR_AUTH_UNAVAILABLE" });
  const enabled = req.body?.enabled;
  const cadence = req.body?.cadenceMinutes;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ success: false, code: "INVALID_ENABLED_VALUE", message: "enabled must be a boolean." });
  }
  const allowedCadences = [15, 30, 60, 180, 360, 1440];
  if (cadence !== undefined && !allowedCadences.includes(Number(cadence))) {
    return res.status(400).json({ success: false, code: "INVALID_CADENCE", allowed: allowedCadences });
  }
  const { data, error } = await db.from("farm_agent_settings").upsert({
    user_id: req.userId,
    enabled,
    ...(cadence !== undefined ? { cadence_minutes: Number(cadence) } : {}),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" }).select("enabled,cadence_minutes,last_scan_at,last_events_count").single();
  if (error) return res.status(503).json({ success: false, code: "AGENT_SETTINGS_SAVE_FAILED", message: error.message });
  return res.json({ success: true, data });
}

export async function runAutonomousAgentNow(req: Request, res: Response) {
  const db = callerDb(req);
  if (!db || !req.userId) return res.status(503).json({ success: false, code: "DATABASE_OR_AUTH_UNAVAILABLE" });
  try {
    const result = await runFarmAgentScan(db, req.userId, { ignoreDisabled: true });
    return res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AGENT_SCAN_FAILED";
    console.error("Autonomous farm-agent scan failed:", message);
    return res.status(503).json({ success: false, code: "AGENT_SCAN_FAILED", message });
  }
}

function validInternalToken(req: Request): boolean {
  const expected = process.env.AGRO_AGENT_MONITOR_TOKEN || "";
  const match = /^Bearer\s+(.+)$/i.exec(req.header("authorization") || "");
  const provided = match?.[1]?.trim() || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Called by the repository's scheduled GitHub Actions workflow. It uses the
 * server-side service-role client and never accepts a user id from the caller.
 */
export async function runScheduledAutonomousAgent(req: Request, res: Response) {
  if (!validInternalToken(req)) return res.status(401).json({ success: false, code: "INVALID_INTERNAL_TOKEN" });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !supabaseAdmin) {
    return res.status(503).json({ success: false, code: "SERVICE_ROLE_NOT_CONFIGURED" });
  }

  const { data: farms, error: farmsError } = await supabaseAdmin
    .from("farms")
    .select("owner_id")
    .not("owner_id", "is", null);
  if (farmsError) return res.status(503).json({ success: false, code: "FARM_SCAN_SOURCE_UNAVAILABLE", message: farmsError.message });

  const userIds = Array.from(new Set((farms ?? []).map((farm: any) => farm.owner_id).filter(Boolean))) as string[];
  const { data: settingsRows, error: settingsError } = userIds.length
    ? await supabaseAdmin.from("farm_agent_settings").select("user_id,enabled,cadence_minutes,last_scan_at").in("user_id", userIds)
    : { data: [], error: null };
  if (settingsError) return res.status(503).json({ success: false, code: "AGENT_SETTINGS_SOURCE_UNAVAILABLE", message: settingsError.message });

  const settingsByUser = new Map((settingsRows ?? []).map((row: any) => [row.user_id, row]));
  const now = new Date();
  const summary = { usersDiscovered: userIds.length, usersScanned: 0, usersSkipped: 0, usersFailed: 0, notificationsCreated: 0, eventsDetected: 0 };
  const failures: Array<{ userId: string; code: string }> = [];

  for (const [userIndex, userId] of userIds.entries()) {
    const setting: any = settingsByUser.get(userId);
    if (setting?.enabled === false) { summary.usersSkipped += 1; continue; }
    const cadence = Number(setting?.cadence_minutes) || 60;
    const lastScan = setting?.last_scan_at ? Date.parse(setting.last_scan_at) : 0;
    if (lastScan && now.getTime() - lastScan < cadence * 60_000) { summary.usersSkipped += 1; continue; }
    try {
      const result = await runFarmAgentScan(supabaseAdmin, userId, { now });
      if (result.skipped) { summary.usersSkipped += 1; continue; }
      summary.usersScanned += 1;
      summary.notificationsCreated += result.notificationsCreated;
      summary.eventsDetected += result.eventsDetected;
    } catch (error) {
      summary.usersFailed += 1;
      failures.push({ userIndex: userIndex + 1, code: error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN" });
    }
  }

  return res.json({
    success: summary.usersFailed === 0,
    scannedAt: now.toISOString(),
    summary,
    failures,
    note: "This scheduler evaluates persisted farm, cultivation, soil-analysis and sensor-device records. It does not claim continuous sensor streaming or live weather, disease or market surveillance.",
  });
}

import { Router } from "express";
import { isSupabaseConfigured } from "../lib/supabase";
import { getLLMInfo } from "../services/providers/llmProvider";

/**
 * Public, secret-free capability endpoints.
 *
 * The SPA's service-status panel used to probe admin-gated maintenance routes
 * (`/api/test/supabase`, `/api/test/auth`). Those require the admin token, so a
 * correctly secured production deployment reported the database as "unavailable"
 * even when it was healthy. These endpoints are safe to expose: they only report
 * whether a dependency is configured and which variables are missing — never a
 * credential value.
 */
const router = Router();

function databaseStatus() {
  return {
    available: isSupabaseConfigured,
    requiresConfiguration: isSupabaseConfigured
      ? []
      : ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
    provenance: isSupabaseConfigured ? "configured" : "not-configured",
  };
}

router.get("/database", (_req, res) => {
  res.json(databaseStatus());
});

router.get("/auth", (_req, res) => {
  // Authentication is delegated to Supabase Auth; it is available exactly when
  // the Supabase client is configured.
  res.json(databaseStatus());
});

router.get("/ai", (_req, res) => {
  const info = getLLMInfo();
  res.json({
    available: info.configured,
    provider: info.provider,
    kind: info.kind,
    credentialAvailable: info.credentialAvailable,
    requiresConfiguration: info.configured
      ? []
      : ["AI_BASE_URL + AI_API_KEY", "or OPENAI_API_KEY", "or GEMINI_API_KEY"],
    // Per-capability detail (engine + provenance) lives in /api/ai/capabilities.
    capabilitiesEndpoint: "/api/ai/capabilities",
  });
});

router.get("/", (_req, res) => {
  const db = databaseStatus();
  const ai = getLLMInfo();
  res.json({
    database: db,
    auth: db,
    ai: { available: ai.configured, provider: ai.provider, kind: ai.kind },
  });
});

export default router;

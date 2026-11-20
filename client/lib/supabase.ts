import { createClient } from "@supabase/supabase-js";

// Public, RLS-protected anon credential. It is the same key the mobile app
// ships. Keep it current: a rotated key that is still embedded here makes every
// sign-in fail with "Invalid API key" while the rest of the app looks healthy.
const EMBEDDED_SUPABASE_URL = "https://jymrhhlwdbclctobhbsi.supabase.co";
const EMBEDDED_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTM2NDYsImV4cCI6MjA3MDE4OTY0Nn0.l2VjAq1vZgkiAeL2EtAJp3iUWBHWbXPmQdNuNq197po";
// A rotated key is issued later than the bundled one. An older key still
// decodes and names this project, but the server rejects it.
const EMBEDDED_SUPABASE_KEY_IAT = 1754613646;

function keyClaims(key: string): { ref: string; iat?: number; exp?: number } | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as {
      role?: string;
      ref?: string;
      iat?: number;
      exp?: number;
    };
    if (claims.role !== "anon" || !claims.ref) return null;
    return { ref: claims.ref.toLowerCase(), iat: claims.iat, exp: claims.exp };
  } catch {
    return null;
  }
}

function isStaleKey(claims: { iat?: number; exp?: number }): boolean {
  if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) return true;
  return typeof claims.iat === "number" && claims.iat < EMBEDDED_SUPABASE_KEY_IAT;
}

/**
 * A build-time env override is accepted only when it names the same project and
 * carries a key at least as new as the bundled one. Otherwise a stale
 * `VITE_SUPABASE_ANON_KEY` would 401 every auth request.
 */
function resolveSupabaseConfig(): { url: string; anonKey: string } {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  const ref = url
    ? /^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i.exec(url)?.[1]?.toLowerCase()
    : null;
  const claims = anonKey ? keyClaims(anonKey) : null;
  if (url && anonKey && ref && claims && claims.ref === ref && !isStaleKey(claims)) {
    return { url: url.replace(/\/+$/, ""), anonKey };
  }
  return { url: EMBEDDED_SUPABASE_URL, anonKey: EMBEDDED_SUPABASE_ANON_KEY };
}

const config = resolveSupabaseConfig();

export const supabaseUrl = config.url;

// Create Supabase client
export const supabase = createClient(config.url, config.anonKey);

// Test the connection (best-effort; will log helpful guidance if key invalid)
if (typeof window !== "undefined") {
  supabase.auth
    .getSession()
    .then(({ error }) => {
      if (error) {
        console.error("Supabase connection error:", error.message);

        if (typeof error.message === "string" && error.message.includes("Invalid API key")) {
          console.error(`\n🔑 SUPABASE API KEY ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The Supabase API key used by the client appears invalid. To fix:

1. Open your Supabase project settings > API and copy the ANON public key
2. Set it in your dev environment as VITE_SUPABASE_ANON_KEY
   (create a .env.local with VITE_SUPABASE_ANON_KEY=your_key)
3. Restart the dev server

Current URL: ${supabaseUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        }
      } else {
        console.log("✅ Supabase client initialized");
      }
    })
    .catch((e) => {
      console.warn("Supabase client test failed:", e?.message || e);
    });
}

export type User = {
  id: string;
  email: string;
  full_name: string;
  full_name_ar: string;
  // Add backward compatibility aliases
  name?: string;
  nameArabic?: string;
  roleArabic?: string;
  phone?: string;
  role:
    | "farmer"
    | "agronomist"
    | "trader"
    | "veterinarian"
    | "admin"
    | "inspector";
  location?: string;
  specialization?: string;
  experience_years?: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  // Add additional properties for compatibility
  is2FAEnabled?: boolean;
  permissions?: string[];
};

export type UserProfile = {
  id: string;
  user_id: string;
  avatar_url?: string;
  bio?: string;
  bio_ar?: string;
  farm_size_hectares?: number;
  crops_grown?: string[];
  certifications?: string[];
  preferences: {
    language: "ar" | "en";
    notifications: boolean;
    weather_alerts: boolean;
    market_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
};

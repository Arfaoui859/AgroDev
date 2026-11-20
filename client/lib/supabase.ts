import { createClient } from "@supabase/supabase-js";

// Supabase configuration (prefer Vite env vars for client builds)
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://jymrhhlwdbclctobhbsi.supabase.co";

// Prefer Vite public anon key; fall back to embedded key only as last resort.
// This fallback must stay valid: a stale key makes every sign-in fail with
// "Invalid API key" while the rest of the app still looks healthy. It is the
// same public, RLS-protected anon key the mobile app ships.
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTM2NDYsImV4cCI6MjA3MDE4OTY0Nn0.l2VjAq1vZgkiAeL2EtAJp3iUWBHWbXPmQdNuNq197po";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

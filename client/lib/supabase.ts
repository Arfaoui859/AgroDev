import { createClient } from "@supabase/supabase-js";

// Client credentials must be supplied by the deployment environment.
// The anon/publishable key is public by design, but pinning a project URL/key
// in source can silently connect preview builds to the wrong database.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Keep module imports/builds safe when local developers have not configured
// Supabase yet. This loopback target deliberately avoids connecting to any
// real project; the UI must surface missing configuration to the user.
export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "supabase-client-not-configured",
);

// Test the connection only when both public client settings are present.
if (typeof window !== "undefined" && isSupabaseConfigured) {
  supabase.auth
    .getSession()
    .then(({ error }) => {
      if (error) {
        console.error("Supabase connection error:", error.message);

        if (error.message.includes("Invalid API key")) {
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

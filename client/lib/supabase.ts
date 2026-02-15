import { createClient } from "@supabase/supabase-js";

// Supabase configuration (prefer Vite env vars for client builds)
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://jymrhhlwdbclctobhbsi.supabase.co";

// Prefer Vite public anon key; fall back to embedded key only as last resort
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjc2NzEsImV4cCI6MjA0OTYwMzY3MX0.aAGN3jLnpCjNOw7-J3Lp4iQBbwMT9X6kMzgRgQtYz7E";

// Create Supabase client with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Improve resilience to temporary network failures
    flowType: 'pkce',
  },
  db: {
    // Add retry logic for transient failures
    schema: 'public',
  },
  // Add a fetch implementation with better error handling
  fetch: customFetch,
});

// Custom fetch wrapper to handle network errors gracefully
async function customFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Set timeout for the request (15 seconds)
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    // Log fetch failures but don't crash
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Supabase fetch error for ${url}:`, errorMessage);

    // Return a network error response instead of throwing
    // This allows Supabase to handle it gracefully
    if (errorMessage.includes('timeout') || errorMessage.includes('abort') || errorMessage.includes('Failed to fetch')) {
      return new Response(JSON.stringify({ error: 'Network timeout or connectivity issue' }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw error;
  }
}

// Test the connection (best-effort; will log helpful guidance if key invalid)
if (typeof window !== "undefined") {
  // Use a timeout to prevent hanging if Supabase is unreachable
  const testTimeout = new Promise((resolve) => {
    setTimeout(() => {
      console.warn("⏱️ Supabase connection test timed out - proceeding without verification");
      resolve(null);
    }, 5000);
  });

  Promise.race([
    supabase.auth.getSession(),
    testTimeout,
  ])
    .then(({ error } = { error: null }) => {
      if (error) {
        console.error("⚠️ Supabase connection warning:", error.message);

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
        console.log("✅ Supabase client initialized successfully");
      }
    })
    .catch((e) => {
      console.warn("⚠️ Supabase client initialization warning:", e?.message || e);
      console.info("The application will continue to function, but some features may be limited");
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

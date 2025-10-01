import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = "https://jymrhhlwdbclctobhbsi.supabase.co";

// Your actual Supabase anon public key
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bXJoaGx3ZGJjbGN0b2JoYnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjc2NzEsImV4cCI6MjA0OTYwMzY3MX0.aAGN3jLnpCjNOw7-J3Lp4iQBbwMT9X6kMzgRgQtYz7E";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
supabase.auth.getSession().then(({ error }) => {
  if (error) {
    console.error("Supabase connection error:", error.message);

    // If it's an API key error, provide helpful information
    if (error.message.includes("Invalid API key")) {
      console.error(`
🔑 SUPABASE API KEY ERROR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The Supabase API key is invalid. Please follow these steps:

1. Go to your Supabase dashboard: https://app.supabase.com/projects
2. Select your project: jymrhhlwdbclctobhbsi
3. Navigate to Settings > API
4. Copy the "anon public" key
5. Replace the supabaseAnonKey in client/lib/supabase.ts

Current URL: ${supabaseUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }
  } else {
    console.log("✅ Supabase connected successfully");
  }
});

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

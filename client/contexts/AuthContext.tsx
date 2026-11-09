import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type {
  User as AppUser,
  UserProfile as AppUserProfile,
} from "../lib/supabase";
import { retryWithBackoff } from "../lib/retry";
import { Session } from "@supabase/supabase-js";

// =============== TYPES & INTERFACES ===============

export type UserRole =
  | "farmer"
  | "agronomist"
  | "trader"
  | "veterinarian"
  | "admin"
  | "inspector";
export type Permission = string;

interface AuthContextType {
  user: AppUser | null;
  userProfile: AppUserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    userData: Partial<AppUser>,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  logout?: () => Promise<void>; // Alias for signOut
  updateProfile: (updates: Partial<AppUserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  // 2FA. Returns structured results so callers can distinguish success from failure.
  enable2FA?: (
    method?: "sms" | "email" | "authenticator",
  ) => Promise<{ success: boolean; qrCode?: string; backupCodes?: string[]; error?: string }>;
  disable2FA?: (code?: string) => Promise<{ success: boolean; error?: string }>;
  verify2FA?: (code: string) => Promise<{ success: boolean; error?: string }>;
  generateBackupCodes?: () => Promise<{ success: boolean; codes?: string[]; error?: string }>;
}

// =============== CONTEXT CREATION ===============

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// =============== AUTH PROVIDER ===============

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Add timeout to prevent hanging. Increased to 30s and wrapped in retry logic
        const timeoutMs = 30000; // 30 seconds
        const authPromise = supabase.auth.getSession();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Auth initialization timeout")),
            timeoutMs,
          );
        });

        const {
          data: { session: initialSession },
        } = (await Promise.race([authPromise, timeoutPromise])) as any;

        if (mounted) {
          setSession(initialSession);
          if (initialSession?.user) {
            try {
              await loadUserData(initialSession.user.id);
            } catch (userDataError) {
              console.error("Error loading user data:", userDataError);
              // Continue anyway, don't block on user data loading
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Also add a fallback timeout
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth initialization fallback timeout triggered");
        setIsLoading(false);
      }
    }, 15000); // 15 second fallback

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
    };

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);

      if (session?.user) {
        try {
          await loadUserData(session.user.id);
        } catch (error) {
          console.error("Error loading user data in auth state change:", error);
          // Continue anyway
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setIsLoading(false);

      // Handle auth events
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        navigate("/");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Load user data from database
  const loadUserData = async (userId: string) => {
    try {
      // Add timeout for database queries and use retry logic
      const timeoutMs = 15000; // 15 second timeout

      // Try to load user details from custom table with retries
      const userQuery = async () => {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) throw error;
        return data;
      };

      let userData: any = null;
      let userError: any = null;
      try {
        // Retry up to 2 times with backoff
        userData = await retryWithBackoff(
          () =>
            Promise.race([
              userQuery(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Database query timeout")),
                  timeoutMs,
                ),
              ),
            ]),
          2,
          300,
        );
      } catch (e: any) {
        userError = e;
      }

      if (userError) {
        // Check if this is a table-not-found error
        const isTableMissing = userError.message?.includes('relation') && userError.message?.includes('does not exist');
        const isPermissionDenied = userError.message?.includes('permission denied');

        if (isTableMissing) {
          console.warn(`
⚠️  DATABASE TABLES NOT FOUND
═══════════════════════════════════════════════════════════
The 'users' table doesn't exist in your Supabase database.

📋 QUICK FIX:
1. Copy the file: supabase-tables-setup.sql (project root)
2. Go to: https://app.supabase.com/projects/[project-id]/sql/new
3. Paste and run the SQL script
4. Refresh the application

This is a one-time setup. After running, everything will work.
═══════════════════════════════════════════════════════════
          `);
        } else if (isPermissionDenied) {
          console.warn(`
⚠️  PERMISSION DENIED - RLS Policy Issue
═══════════════════════════════════════════════════════════
Row Level Security (RLS) policies are blocking access.

📋 FIX:
1. Run supabase-tables-setup.sql to fix RLS policies
2. Or check RLS policies in Supabase dashboard
═══════════════════════════════════════════════════════════
          `);
        } else {
          console.log(
            "Custom user table not available, using Supabase Auth data only",
          );
        }

        // Fallback: create minimal user object from auth data
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUser({
            id: user.id,
            email: user.email || "",
            full_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "User",
            full_name_ar: user.user_metadata?.full_name_ar || "مستخدم",
            role: "farmer",
            verified: user.email_confirmed_at ? true : false,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
          });
        }
        return;
      }

      setUser(userData);

      // Try to load user profile with timeout and retries
      const profileQuery = async () => {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (error) throw error;
        return data;
      };

      let profileData: any = null;
      try {
        profileData = await retryWithBackoff(
          () =>
            Promise.race([
              profileQuery(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Database query timeout")),
                  timeoutMs,
                ),
              ),
            ]),
          2,
          300,
        );
      } catch (e) {
        console.log(
          "Custom profile table not available or timed out, using defaults",
        );
      }

      if (!profileData) {
        setUserProfile({
          id: "default",
          user_id: userId,
          preferences: {
            language: "ar",
            notifications: true,
            weather_alerts: true,
            market_alerts: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    userData: Partial<AppUser>,
  ) => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting Supabase Auth signup for:", email);

      const requestedRole = userData.role;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            full_name_ar: userData.full_name_ar,
            phone: userData.phone,
            requested_role: requestedRole,
          },
        },
      });

      if (error) {
        console.error("❌ Supabase Auth signup error:", error);
        throw error;
      }

      console.log("📋 Signup response:", {
        hasUser: !!data.user,
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        hasSession: !!data.session,
        needsEmailConfirmation: !data.session && data.user,
      });

      if (data.user) {
        console.log("✅ User created in Supabase Auth:", data.user.email);

        if (!data.session) {
          console.log(
            "📧 Email confirmation required - user must check their email",
          );
          // Show message to user about email confirmation
          alert(
            "تم إنشاء الحساب! يرجى فحص بريدك الإلكترو��ي لتأكيد الحساب قبل تسجيل الدخول.",
          );
        }

        // public.users is provisioned by the trusted auth.users database trigger.
        // Never accept a role or create privileged profile records from the browser.
        if (data.session) {
          await loadUserData(data.user.id);
        }


      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Log full result for debugging
      console.log("signIn result:", result);

      if (result.error) throw result.error;

      const user = result.data?.user;
      const sessionData = result.data?.session;

      if (!user) {
        console.warn("signIn: no user in response, session:", sessionData);
        return result;
      }

      // Update local auth state immediately (don't rely solely on onAuthStateChange)
      setSession(sessionData || null);
      try {
        await loadUserData(user.id);
      } catch (e) {
        console.error("Error loading user data after signIn:", e);
      }

      // Navigate to home
      try {
        navigate("/");
      } catch (e) {
        console.warn("Navigation after signIn failed:", e);
      }

      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setUserProfile(null);
      setSession(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<AppUserProfile>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!session?.user) return;
    await loadUserData(session.user.id);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    isLoading,
    isAuthenticated: !!session?.user,
    signUp,
    signIn,
    signOut,
    logout: signOut, // Alias for backward compatibility
    updateProfile,
    resetPassword,
    refreshUser,
    // 2FA is not backed by the auth provider yet. Return explicit failures so
    // the UI never reports a successful enable/verify that did not happen.
    enable2FA: async () => {
      console.warn("2FA is not configured");
      return { success: false, error: "2FA is not configured" };
    },
    disable2FA: async () => {
      console.warn("2FA is not configured");
      return { success: false, error: "2FA is not configured" };
    },
    verify2FA: async () => {
      console.warn("2FA is not configured");
      return { success: false, error: "2FA is not configured" };
    },
    generateBackupCodes: async () => {
      console.warn("2FA is not configured");
      return { success: false, error: "2FA is not configured" };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

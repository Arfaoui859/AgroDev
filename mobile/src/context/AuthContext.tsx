import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { apiRequest } from '../api/client';
import { clearCache, setCacheNamespace, namespaceUserId } from '../api/cache';
import { clearLegacyHistory, setHistoryUserId } from '../api/history';
import { PRODUCTION_API_BASE_URL } from '../config';
import { User, UserRole } from '../types';

const ONBOARDED_KEY = 'agrogrowth.onboarded';
const PREFERRED_ROLE_KEY = 'agrogrowth.preferredRole';

// Confirmation and recovery links must land on a deployed page. Without an
// explicit target Supabase falls back to the dashboard Site URL, which may still
// be localhost — a link a phone can never open.
const EMAIL_REDIRECT_URL = PRODUCTION_API_BASE_URL;

const VALID_ROLES: UserRole[] = [
  'farmer',
  'gardener',
  'agronomist',
  'veterinarian',
  'trader',
  'company',
  'inspector',
  'investor',
  'government',
  'admin',
];

function asRole(value: unknown): UserRole | null {
  return typeof value === 'string' && (VALID_ROLES as string[]).includes(value)
    ? (value as UserRole)
    : null;
}

interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  /** True until the persisted session has been restored on cold start. */
  isInitialising: boolean;
  isLoading: boolean;
  hasOnboarded: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map a Supabase user + optional profile row into our User shape. */
function mapUser(sbUser: SupabaseUser, profile?: any): User {
  const meta = sbUser.user_metadata ?? {};
  return {
    id: sbUser.id,
    email: sbUser.email || profile?.email || '',
    full_name: profile?.full_name || meta.full_name || 'AgriVibe User',
    full_name_ar: profile?.full_name_ar || meta.full_name_ar,
    phone: sbUser.phone || profile?.phone || meta.phone,
    role: (profile?.role || meta.role || 'farmer') as UserRole,
    language_preference: profile?.language_preference || meta.language_preference,
    governorate: profile?.governorate || meta.governorate,
  };
}

/**
 * Read the caller's profile through the gateway's self-provisioning endpoint.
 * It is idempotent and never lets the client pick a role.
 */
async function fetchProfile(): Promise<any | null> {
  const res = await apiRequest<{ profile: any }>('/api/auth/ensure-profile', { method: 'POST' });
  return res.data?.profile ?? null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);
  // Local experience preference (UI only). Never grants server privileges.
  const preferredRoleRef = React.useRef<UserRole | null>(null);
  // Tracks the latest auth identity so deferred profile requests cannot let an
  // older account overwrite the state after a fast account switch.
  const authUserIdRef = React.useRef<string | null>(null);
  // The role the backend actually assigned, kept separately so clearing the
  // preference restores the authoritative value instead of the chosen one.
  const serverRoleRef = React.useRef<UserRole | null>(null);

  /** Apply the stored UI preference over the server-assigned role. */
  const withPreference = (u: User | null): User | null => {
    if (!u) return u;
    serverRoleRef.current = u.role;
    return preferredRoleRef.current ? { ...u, role: preferredRoleRef.current } : u;
  };

  // Restore persisted session + onboarding flag on cold start.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [onboarded, preferredRole] = await Promise.all([
          AsyncStorage.getItem(ONBOARDED_KEY),
          AsyncStorage.getItem(PREFERRED_ROLE_KEY),
        ]);
        if (active) {
          setHasOnboarded(onboarded === 'true');
          preferredRoleRef.current = asRole(preferredRole);
        }

        const {
          data: { session: restored },
        } = await supabase.auth.getSession();
        if (!active) return;
        // Namespace the offline cache before any authenticated request runs so
        // one account can never read another's cached private records.
        setCacheNamespace(restored?.user?.id ?? null);
        setHistoryUserId(restored?.user?.id ?? null);
        await clearLegacyHistory();
        setSession(restored);
        authUserIdRef.current = restored?.user?.id ?? null;
        if (restored?.user) {
          // Never block app startup on the profile API. The verified Supabase
          // session is sufficient to render an authenticated fallback user;
          // onAuthStateChange hydrates the authoritative DB profile in the
          // background after the auth lock has been released.
          setUser(withPreference(mapUser(restored.user)));
        }
      } catch (error) {
        console.warn('session restore failed:', error);
      } finally {
        if (active) setIsInitialising(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Keep this callback synchronous. Calling fetchProfile() here would call
      // supabase.auth.getSession() while Supabase is still holding its auth
      // lock, which can deadlock token refresh and make a valid user appear
      // signed out.
      const nextUser = nextSession?.user ?? null;
      authUserIdRef.current = nextUser?.id ?? null;
      setSession(nextSession);
      setHistoryUserId(nextUser?.id ?? null);

      if (!nextUser) {
        setUser(null);
        return;
      }

      setUser(withPreference(mapUser(nextUser)));

      // A macrotask guarantees the auth callback has returned and Supabase's
      // internal lock has been released before any API helper calls getSession().
      setTimeout(() => {
        void (async () => {
          if (!active || authUserIdRef.current !== nextUser.id) return;

          if (namespaceUserId() !== nextUser.id) {
            await clearCache();
            if (!active || authUserIdRef.current !== nextUser.id) return;
            setCacheNamespace(nextUser.id);
          }

          try {
            const profile = await fetchProfile();
            if (active && authUserIdRef.current === nextUser.id) {
              setUser(withPreference(mapUser(nextUser, profile)));
            }
          } catch {
            /* keep the metadata-derived user */
          }
        })().catch((error) => {
          console.warn('deferred auth profile hydration failed:', error);
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn: AuthContextType['signIn'] = async (email, pass) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) {
        // Raw reason for device logs; the UI localises it. Never a credential.
        console.warn('Supabase sign-in rejected:', error.status, error.message);
        const needsConfirmation = /confirm/i.test(error.message);
        return { success: false, error: error.message, needsConfirmation };
      }
      if (data.user) {
        authUserIdRef.current = data.user.id;
        // Establish the authenticated session immediately. Profile hydration is
        // supplementary: a temporary gateway outage must not turn a successful
        // Supabase sign-in into a reported login failure.
        setSession(data.session);
        setUser(withPreference(mapUser(data.user)));
        // Do not wait for the profile API during login. The auth state listener
        // hydrates the profile asynchronously after Supabase releases its lock.
        // Awaiting this network request here can leave the login button spinning
        // until the gateway timeout and make a valid sign-in look like a failure.
      }
      return { success: true };
    } catch (error: any) {
      // Empty string lets the UI layer localise the failure message.
      return { success: false, error: error?.message || '' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp: AuthContextType['signUp'] = async ({ email, password, fullName, phone, role }) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        phone: phone?.trim() || undefined,
        options: {
          emailRedirectTo: EMAIL_REDIRECT_URL,
          data: {
            full_name: fullName.trim(),
            full_name_ar: fullName.trim(),
            phone: phone?.trim(),
            // A self-declared role is a request only; the backend assigns the
            // authoritative role and never trusts client metadata for authz.
            role: role ?? 'farmer',
          },
        },
      });
      if (error) return { success: false, error: error.message };

      // Supabase returns a user with no session when email confirmation is on.
      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true };
      }
      if (data.session?.user) {
        authUserIdRef.current = data.session.user.id;
        // Keep signup successful even if the profile gateway is temporarily
        // unavailable; the user metadata provides a safe initial profile.
        setSession(data.session);
        setUser(withPreference(mapUser(data.session.user)));
        try {
          const profile = await fetchProfile();
          if (authUserIdRef.current === data.session.user.id) {
            setUser(withPreference(mapUser(data.session.user, profile)));
          }
        } catch (profileError) {
          console.warn('profile hydration failed after sign-up; continuing with authenticated session:', profileError);
        }
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || '' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword: AuthContextType['resetPassword'] = async (email) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: EMAIL_REDIRECT_URL,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || '' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation: AuthContextType['resendConfirmation'] = async (email) => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || '' };
    }
  };

  const signOut = async () => {
    authUserIdRef.current = null;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('sign-out warning:', error);
    }
    // Drop cached private records and re-point the cache at the anonymous
    // namespace so a later account on this device cannot replay them.
    await clearCache();
    setCacheNamespace(null);
    setHistoryUserId(null);
    setUser(null);
    setSession(null);
  };

  const updateRole: AuthContextType['updateRole'] = async (role) => {
    // Local experience preference. The authoritative role lives in the
    // database and is only changed by an administrator. Choosing the role the
    // server already assigned clears the preference so the account's real role
    // shows through again.
    const isAuthoritative = role === serverRoleRef.current;
    preferredRoleRef.current = isAuthoritative ? null : role;
    setUser((prev) => (prev ? { ...prev, role } : prev));
    try {
      if (isAuthoritative) await AsyncStorage.removeItem(PREFERRED_ROLE_KEY);
      else await AsyncStorage.setItem(PREFERRED_ROLE_KEY, role);
    } catch {
      /* non-fatal */
    }
  };

  const completeOnboarding = async () => {
    setHasOnboarded(true);
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    } catch {
      /* non-fatal */
    }
  };

  const refreshProfile = async () => {
    const {
      data: { session: current },
    } = await supabase.auth.getSession();
    if (!current?.user) return;
    const profile = await fetchProfile();
    if (authUserIdRef.current === current.user.id) {
      setUser(withPreference(mapUser(current.user, profile)));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user,
        isInitialising,
        isLoading,
        hasOnboarded,
        signIn,
        signUp,
        resetPassword,
        resendConfirmation,
        signOut,
        updateRole,
        completeOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

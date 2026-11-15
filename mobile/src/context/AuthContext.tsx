import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../api/supabase';
import { apiRequest } from '../api/client';
import { clearCache, setCacheNamespace, namespaceUserId } from '../api/cache';
import { User, UserRole } from '../types';

const ONBOARDED_KEY = 'agrogrowth.onboarded';
const PREFERRED_ROLE_KEY = 'agrogrowth.preferredRole';

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
        setSession(restored);
        if (restored?.user) {
          const profile = await fetchProfile();
          if (active) setUser(withPreference(mapUser(restored.user, profile)));
        }
      } catch (error) {
        console.warn('session restore failed:', error);
      } finally {
        if (active) setIsInitialising(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        // A different account may be signing in on this device: re-point the
        // cache namespace and drop anything cached under the previous one.
        if (namespaceUserId() !== nextSession.user.id) {
          await clearCache();
          setCacheNamespace(nextSession.user.id);
        }
        setUser(withPreference(mapUser(nextSession.user)));
        // Best-effort profile hydration; never blocks the auth state.
        try {
          const profile = await fetchProfile();
          setUser(withPreference(mapUser(nextSession.user, profile)));
        } catch {
          /* keep the metadata-derived user */
        }
      } else {
        setUser(null);
      }
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
        const needsConfirmation = /confirm/i.test(error.message);
        return { success: false, error: error.message, needsConfirmation };
      }
      if (data.user) {
        const profile = await fetchProfile();
        setUser(withPreference(mapUser(data.user, profile)));
        setSession(data.session);
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
        const profile = await fetchProfile();
        setUser(withPreference(mapUser(data.session.user, profile)));
        setSession(data.session);
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || '' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('sign-out warning:', error);
    }
    // Drop cached private records and re-point the cache at the anonymous
    // namespace so a later account on this device cannot replay them.
    await clearCache();
    setCacheNamespace(null);
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
    setUser(withPreference(mapUser(current.user, profile)));
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const defaultDemoUser: User = {
  id: 'demo-farmer-id',
  email: 'farmer@agrogrowth.tn',
  full_name: 'Mohamed Ali Ben Salem',
  full_name_ar: 'محمد علي بن سالم',
  phone: '+216 98 123 456',
  role: 'farmer',
  language_preference: 'ar',
  governorate: 'القيروان / باجة',
};

const roleProfiles: Record<UserRole, Partial<User>> = {
  farmer: {
    full_name: 'Mohamed Ali Ben Salem',
    full_name_ar: 'محمد علي بن سالم',
    role: 'farmer',
    email: 'farmer@agrogrowth.tn',
  },
  agronomist: {
    full_name: 'Dr. Leila Trabelsi',
    full_name_ar: 'د. ليلى الطرابلسي',
    role: 'agronomist',
    email: 'agronomist@agrogrowth.tn',
  },
  trader: {
    full_name: 'Youssef Mansour',
    full_name_ar: 'يوسف المنصور',
    role: 'trader',
    email: 'trader@agrogrowth.tn',
  },
  veterinarian: {
    full_name: 'Dr. Karim Dridi',
    full_name_ar: 'د. كريم الدريدي (طبيب بيطري)',
    role: 'veterinarian',
    email: 'vet@agrogrowth.tn',
  },
  inspector: {
    full_name: 'Sami Bouazizi',
    full_name_ar: 'سامي البوعزيزي (مراقب جودة)',
    role: 'inspector',
    email: 'inspector@agrogrowth.tn',
  },
  admin: {
    full_name: 'Admin AgroGrowth',
    full_name_ar: 'مدير منصة AgroGrowth',
    role: 'admin',
    email: 'admin@agrogrowth.tn',
  },
  government: {
    full_name: 'Direction Générale de la Production Agricole',
    full_name_ar: 'الإدارة العامة للإنتاج الفلاحي (تونس)',
    role: 'government',
    email: 'gov@agrogrowth.tn',
  },
  investor: {
    full_name: 'Agri-Capital Investment',
    full_name_ar: 'صندوق الاستثمار الفلاحي التونسي',
    role: 'investor',
    email: 'investor@agrogrowth.tn',
  },
  gardener: {
    full_name: 'Home Grower',
    full_name_ar: 'هاوي حدائق وزراعة منزلية',
    role: 'gardener',
    email: 'gardener@agrogrowth.tn',
  },
  company: {
    full_name: 'AgroCooperative Tunisia',
    full_name_ar: 'تعاونية فلاحية تونسية',
    role: 'company',
    email: 'company@agrogrowth.tn',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultDemoUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check real Supabase session if available
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@agrogrowth.tn',
            full_name: session.user.user_metadata?.full_name || 'AgroGrowth User',
            full_name_ar: session.user.user_metadata?.full_name_ar || 'مستخدم المنصة',
            role: (session.user.user_metadata?.role as UserRole) || 'farmer',
            phone: session.user.phone,
          });
        }
      } catch (err) {
        console.log('Using default demo profile:', err);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@agrogrowth.tn',
          full_name: session.user.user_metadata?.full_name || 'AgroGrowth User',
          full_name_ar: session.user.user_metadata?.full_name_ar || 'مستخدم المنصة',
          role: (session.user.user_metadata?.role as UserRole) || 'farmer',
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || 'User',
          full_name_ar: data.user.user_metadata?.full_name_ar || 'مستخدم',
          role: (data.user.user_metadata?.role as UserRole) || 'farmer',
        });
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login error' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Signout warning:', e);
    }
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const profile = roleProfiles[newRole];
    setUser((prev) => ({
      ...(prev || defaultDemoUser),
      ...profile,
      role: newRole,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        switchRole,
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

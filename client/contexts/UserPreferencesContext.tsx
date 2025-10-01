import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  nameArabic: string;
  email: string;
  phone: string;
  avatar?: string;
  role:
    | "farmer"
    | "agronomist"
    | "trader"
    | "veterinarian"
    | "inspector"
    | "admin"
    | "government";
  roleArabic: string;
  location: {
    country: string;
    countryArabic: string;
    governorate: string;
    governorateArabic: string;
    city: string;
    cityArabic: string;
    coordinates?: { lat: number; lng: number };
  };
  farmInfo?: {
    name: string;
    nameArabic: string;
    size: number; // in hectares
    cropTypes: string[];
    farmingType: "organic" | "conventional" | "mixed";
    establishedYear: number;
  };
}

export interface UserPreferences {
  // Language & Localization
  language: "ar" | "en";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12h" | "24h";
  currency: "JOD" | "USD" | "EUR";
  units: "metric" | "imperial";

  // Dashboard & UI
  theme: "light" | "dark" | "auto";
  dashboardLayout: "compact" | "comfortable" | "spacious";
  defaultDashboard: string;
  sidebarCollapsed: boolean;
  quickAccess: string[];
  favoritePages: string[];

  // Notifications
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
    weatherAlerts: boolean;
    diseaseAlerts: boolean;
    marketUpdates: boolean;
    irrigationReminders: boolean;
    systemNotifications: boolean;
    frequency: "immediate" | "hourly" | "daily" | "weekly";
  };

  // Data & Privacy
  dataSharing: {
    analytics: boolean;
    research: boolean;
    marketing: boolean;
  };
  autoBackup: boolean;
  dataRetention: "1year" | "2years" | "5years" | "indefinite";

  // Agricultural Settings
  cropPreferences: string[];
  weatherLocation: {
    lat: number;
    lng: number;
    name: string;
    nameArabic: string;
  };
  irrigationSchedule: {
    enabled: boolean;
    defaultTime: string;
    frequency: "daily" | "weekly" | "bi-weekly";
  };
  alertThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    soilMoisture: { min: number; max: number };
    pestRisk: "low" | "medium" | "high";
  };
}

interface UserPreferencesContextType {
  profile: UserProfile;
  preferences: UserPreferences;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  exportUserData: () => Promise<string>;
  importUserData: (data: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return context;
};

// Default user profile
const defaultProfile: UserProfile = {
  id: "user-001",
  name: "Sami Arfaoui",
  nameArabic: "سامي العرفاوي",
  email: "sami.arfaoui@agrogrowth.com",
  phone: "+962 79 123 4567",
  role: "farmer",
  roleArabic: "فلاح",
  location: {
    country: "Jordan",
    countryArabic: "الأردن",
    governorate: "Irbid",
    governorateArabic: "إربد",
    city: "Irbid",
    cityArabic: "إربد",
    coordinates: { lat: 32.5556, lng: 35.8517 },
  },
  farmInfo: {
    name: "Al-Mahmoud Farm",
    nameArabic: "مزرعة المحمود",
    size: 25,
    cropTypes: ["Wheat", "Tomato", "Olive"],
    farmingType: "mixed",
    establishedYear: 2010,
  },
};

// Default preferences
const defaultPreferences: UserPreferences = {
  // Language & Localization
  language: "ar",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  currency: "JOD",
  units: "metric",

  // Dashboard & UI
  theme: "light",
  dashboardLayout: "comfortable",
  defaultDashboard: "/farmer-dashboard",
  sidebarCollapsed: false,
  quickAccess: [
    "/farmer-dashboard",
    "/analysis",
    "/recommendations",
    "/disease-upload",
    "/market-dashboard",
  ],
  favoritePages: [],

  // Notifications
  notifications: {
    email: true,
    browser: true,
    mobile: true,
    weatherAlerts: true,
    diseaseAlerts: true,
    marketUpdates: true,
    irrigationReminders: true,
    systemNotifications: true,
    frequency: "immediate",
  },

  // Data & Privacy
  dataSharing: {
    analytics: true,
    research: false,
    marketing: false,
  },
  autoBackup: true,
  dataRetention: "2years",

  // Agricultural Settings
  cropPreferences: ["Wheat", "Tomato", "Olive", "Cucumber"],
  weatherLocation: {
    lat: 32.5556,
    lng: 35.8517,
    name: "Irbid",
    nameArabic: "إربد",
  },
  irrigationSchedule: {
    enabled: true,
    defaultTime: "06:00",
    frequency: "daily",
  },
  alertThresholds: {
    temperature: { min: 5, max: 40 },
    humidity: { min: 30, max: 80 },
    soilMoisture: { min: 20, max: 80 },
    pestRisk: "medium",
  },
};

export const UserPreferencesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);

  // Load user data from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("agroGrowthUserProfile");
      const savedPreferences = localStorage.getItem(
        "agroGrowthUserPreferences",
      );

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }

      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, []);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("agroGrowthUserProfile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(
      "agroGrowthUserPreferences",
      JSON.stringify(preferences),
    );
  }, [preferences]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      // Handle nested object updates
      const merged = { ...prev };
      Object.keys(updates).forEach((key) => {
        const value = updates[key as keyof UserPreferences];
        if (value && typeof value === "object" && !Array.isArray(value)) {
          merged[key as keyof UserPreferences] = {
            ...prev[key as keyof UserPreferences],
            ...value,
          } as any;
        } else {
          (merged as any)[key] = value;
        }
      });
      return merged;
    });
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem("agroGrowthUserPreferences");
  };

  const exportUserData = async (): Promise<string> => {
    const exportData = {
      profile,
      preferences,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    return JSON.stringify(exportData, null, 2);
  };

  const importUserData = async (data: string): Promise<boolean> => {
    try {
      const importedData = JSON.parse(data);

      if (importedData.profile) {
        setProfile(importedData.profile);
      }

      if (importedData.preferences) {
        setPreferences(importedData.preferences);
      }

      return true;
    } catch (error) {
      console.error("Error importing user data:", error);
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      // In a real app, this would make an API call to delete the account
      localStorage.removeItem("agroGrowthUserProfile");
      localStorage.removeItem("agroGrowthUserPreferences");
      localStorage.removeItem("agroGrowthNotifications");
      localStorage.removeItem("agroGrowthRecentSearches");
      localStorage.removeItem("agroGrowthSearchHistory");

      // Reset to defaults
      setProfile(defaultProfile);
      setPreferences(defaultPreferences);

      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      return false;
    }
  };

  const value: UserPreferencesContextType = {
    profile,
    preferences,
    updateProfile,
    updatePreferences,
    resetPreferences,
    exportUserData,
    importUserData,
    deleteAccount,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

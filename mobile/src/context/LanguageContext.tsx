import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, Translations, getTranslations, isRTL, setActiveLanguage } from '../i18n';
import { ExtraTranslations, getExtra } from '../i18n/extra';

const LANGUAGE_KEY = 'agrogrowth.language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  /** Supplementary strings for newer features (auth, states, scanner). */
  x: ExtraTranslations;
  isArabic: boolean;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED: Language[] = ['ar', 'fr', 'en'];

/**
 * Language + direction provider.
 *
 * Direction is handled with runtime `row-reverse`/`textAlign` rather than
 * `I18nManager.forceRTL` so the user can switch language without an app
 * restart, which matters on low-end devices where a restart is disruptive.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  // Keep the module-level language in sync so non-hook modules (the API client)
  // can localise their fallback messages too.
  useEffect(() => {
    setActiveLanguage(language);
  }, [language]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored && SUPPORTED.includes(stored as Language)) {
          setLanguageState(stored as Language);
        }
      } catch (error) {
        console.warn('language restore failed:', error);
      }
    })();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {
      /* non-fatal */
    });
  };

  const t = getTranslations(language);
  const x = getExtra(language);
  const isArabic = language === 'ar';
  const isRtl = isRTL(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, x, isArabic, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

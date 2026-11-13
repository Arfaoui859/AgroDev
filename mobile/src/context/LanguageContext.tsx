import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, getTranslations, isRTL } from '../i18n';
import { I18nManager } from 'react-native';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isArabic: boolean;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = getTranslations(language);
  const isArabic = language === 'ar';
  const isRtl = isRTL(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isArabic, isRtl }}>
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

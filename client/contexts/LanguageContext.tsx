import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  isArabic: boolean;
  setIsArabic: (value: boolean) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [isArabic, setIsArabic] = useState(true);

  const toggleLanguage = () => {
    setIsArabic(prev => !prev);
  };

  return (
    <LanguageContext.Provider value={{ isArabic, setIsArabic, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

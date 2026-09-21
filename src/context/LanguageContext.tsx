import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Translations } from '../translations/types';
import { TRANSLATIONS } from '../translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: keyof Translations, defaultText?: string) => string;
  speechLocale: string;
  isLanguageSelected: boolean;
}

const STORAGE_KEY = 'uzhavan_selected_language';

export const SPEECH_LOCALES: Record<LanguageCode, string> = {
  ta: 'ta-IN',
  en: 'en-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  hi: 'hi-IN',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLanguageSelected, setIsLanguageSelected] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && (saved in TRANSLATIONS)) {
      return saved;
    }
    return 'ta'; // Tamil default or initial
  });

  const setLanguage = (lang: LanguageCode) => {
    if (lang in TRANSLATIONS) {
      setLanguageState(lang);
      setIsLanguageSelected(true);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (err) {
        console.warn('Could not save language to localStorage:', err);
      }
    }
  };

  const t = (key: keyof Translations, defaultText?: string): string => {
    const currentDict = TRANSLATIONS[language];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultText || (key as string);
  };

  const speechLocale = SPEECH_LOCALES[language] || 'ta-IN';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speechLocale,
        isLanguageSelected,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

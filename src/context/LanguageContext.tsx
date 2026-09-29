import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { Translations } from '../translations/types';
import { TRANSLATIONS } from '../translations';
import { authService } from '../services/authService';

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
    return !!(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('selectedLanguage'));
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem('selectedLanguage')) as LanguageCode | null;
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
        localStorage.setItem('selectedLanguage', lang);
      } catch (err) {
        console.warn('Could not save language to localStorage:', err);
      }

      // Synchronize with logged-in user profile in Firestore
      try {
        const session = authService.getCurrentSession();
        if (session && session.uid) {
          session.language = lang;
          localStorage.setItem('uzhavan_session', JSON.stringify(session));

          // Also update farmer profile cache if present
          const farmerProf = localStorage.getItem('uzhavan_farmer_profile');
          if (farmerProf) {
            try {
              const parsed = JSON.parse(farmerProf);
              parsed.language = lang;
              parsed.selectedLanguage = lang;
              localStorage.setItem('uzhavan_farmer_profile', JSON.stringify(parsed));
              localStorage.setItem(`uzhavan_farmer_profile_${session.uid}`, JSON.stringify(parsed));
            } catch (e) {}
          }

          // Update Firestore users/{userId} safely using setDoc with merge: true
          import('../firebase/config').then(({ db }) => {
            import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
              const userRef = doc(db, 'users', session.uid);
              setDoc(
                userRef,
                {
                  language: lang,
                  selectedLanguage: lang,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              ).catch(() => {});

              if (session.role === 'farmer') {
                const farmerRef = doc(db, 'farmers', session.uid);
                setDoc(
                  farmerRef,
                  {
                    selectedLanguage: lang,
                    language: lang,
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true }
                ).catch(() => {});
              }
            });
          });
        }
      } catch (syncErr) {
        console.warn('Language profile sync notice:', syncErr);
      }
    }
  };

  // Sync on startup if logged-in user has profile language (only if user hasn't explicitly chosen one)
  useEffect(() => {
    try {
      const explicitLang = (localStorage.getItem('selectedLanguage') || localStorage.getItem(STORAGE_KEY)) as LanguageCode | null;
      if (explicitLang && (explicitLang in TRANSLATIONS)) {
        // User has already explicitly chosen their preferred language; preserve it!
        return;
      }
      const session = authService.getCurrentSession();
      if (session && session.language && (session.language as LanguageCode) in TRANSLATIONS) {
        setLanguageState(session.language as LanguageCode);
        setIsLanguageSelected(true);
      }
    } catch {}
  }, []);

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

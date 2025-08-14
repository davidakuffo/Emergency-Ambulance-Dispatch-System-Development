"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Language, 
  Translation, 
  getTranslation, 
  getLanguagePreference, 
  saveLanguagePreference 
} from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  translation: Translation;
  setLanguage: (language: Language) => void;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translation, setTranslation] = useState<Translation>(getTranslation('en'));

  useEffect(() => {
    // Load saved language preference or detect browser language
    const preferredLanguage = getLanguagePreference();
    setLanguageState(preferredLanguage);
    setTranslation(getTranslation(preferredLanguage));
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setTranslation(getTranslation(newLanguage));
    saveLanguagePreference(newLanguage);
  };

  const availableLanguages: Language[] = ['en', 'tw', 'ga'];

  return (
    <LanguageContext.Provider value={{
      language,
      translation,
      setLanguage,
      availableLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenience hook for just getting translations
export function useTranslation() {
  const { translation } = useLanguage();
  return translation;
}

"use client";
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language, getLanguageName, getLanguageFlag } from '@/lib/i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'footer' | 'floating';
  className?: string;
}

export default function LanguageSelector({ variant = 'header', className = '' }: LanguageSelectorProps) {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  if (variant === 'floating') {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white shadow-lg rounded-full p-3 border border-gray-200 hover:shadow-xl transition-all duration-200"
            aria-label="Select language"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getLanguageFlag(language)}</span>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {getLanguageName(language)}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[150px]">
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 ${
                    language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{getLanguageFlag(lang)}</span>
                  <span className="font-medium">{getLanguageName(lang)}</span>
                  {language === lang && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150"
          aria-label="Select language"
        >
          <span>{getLanguageFlag(language)}</span>
          <span>{getLanguageName(language)}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[120px]">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 text-sm ${
                  language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{getLanguageFlag(lang)}</span>
                <span>{getLanguageName(lang)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Header variant (default)
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-150"
        aria-label="Select language"
      >
        <span className="text-base">{getLanguageFlag(language)}</span>
        <span className="font-medium">{getLanguageName(language)}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[140px] z-50">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 ${
                language === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="text-base">{getLanguageFlag(lang)}</span>
              <span className="font-medium">{getLanguageName(lang)}</span>
              {language === lang && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Click outside handler
export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
}

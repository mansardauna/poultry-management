'use strict';
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Language, TranslationDict, SupportedLanguageInfo, SUPPORTED_LANGUAGES } from '@/lib/i18n/types';
import { enDict } from '@/lib/i18n/locales/en';
import { zhDict } from '@/lib/i18n/locales/zh';
import { idDict } from '@/lib/i18n/locales/id';
import { hiDict } from '@/lib/i18n/locales/hi';
import { swDict } from '@/lib/i18n/locales/sw';
import { arDict } from '@/lib/i18n/locales/ar';
import { esDict } from '@/lib/i18n/locales/es';
import { frDict } from '@/lib/i18n/locales/fr';
import { yoDict } from '@/lib/i18n/locales/yo';
import { igDict } from '@/lib/i18n/locales/ig';
import { haDict } from '@/lib/i18n/locales/ha';
import { GLOBAL_PHRASES } from '@/lib/i18n/phrases';

export type { Language, TranslationDict, SupportedLanguageInfo };
export { SUPPORTED_LANGUAGES };

export const translations: Record<Language, TranslationDict> = {
  en: enDict,
  zh: zhDict,
  id: idDict,
  hi: hiDict,
  sw: swDict,
  ar: arDict,
  es: esDict,
  fr: frDict,
  yo: yoDict,
  ig: igDict,
  ha: haDict,
};

/**
 * Context type for language settings.
 */
export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  texts: TranslationDict;
  dir: 'ltr' | 'rtl';
  currencySymbol: string;
  formatNumber: (value: number | string, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number | string, currencySymbol?: string) => string;
  t: (term: string, fallback?: string) => string;
  supportedLanguages: SupportedLanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Provider for language settings.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = Cookies.get('pfms_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    } else {
      Cookies.set('pfms_lang', 'en', { path: '/' });
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
      Cookies.set('pfms_lang', lang, { path: '/' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pfms_language_changed', { detail: lang }));
      }
    }
  }, []);

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';
  const locale = useMemo(() => {
    switch (language) {
      case 'zh': return 'zh-CN';
      case 'id': return 'id-ID';
      case 'hi': return 'hi-IN';
      case 'sw': return 'sw-KE';
      case 'ar': return 'ar-SA';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'yo': return 'yo-NG';
      case 'ig': return 'ig-NG';
      case 'ha': return 'ha-NG';
      case 'en':
      default: return 'en-US';
    }
  }, [language]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = language;
    }
  }, [language, dir]);

  const texts = useMemo(() => translations[language] || translations.en, [language]);

  const formatNumber = useCallback((value: number | string, options?: Intl.NumberFormatOptions) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num)) return String(value);
    try {
      return new Intl.NumberFormat(locale, options).format(num);
    } catch {
      return num.toLocaleString();
    }
  }, [locale]);

  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return String(date);
      return new Intl.DateTimeFormat(locale, options || {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(d);
    } catch {
      return String(date);
    }
  }, [locale]);

  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  useEffect(() => {
    const fetchCurrency = () => {
      fetch('/api/branding')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.currencySymbol) setCurrencySymbol(data.currencySymbol);
        })
        .catch(() => {});
    };

    fetchCurrency();

    if (typeof window !== 'undefined') {
      window.addEventListener('pfms_brand_updated', fetchCurrency);
      return () => {
        window.removeEventListener('pfms_brand_updated', fetchCurrency);
      };
    }
  }, []);

  const formatCurrency = useCallback((amount: number | string, customSymbol?: string) => {
    const sym = (customSymbol !== undefined && customSymbol !== null && customSymbol !== '') ? customSymbol : currencySymbol;
    const formattedNum = formatNumber(amount);
    return `${sym}${formattedNum}`;
  }, [currencySymbol, formatNumber]);

  const t = useCallback((term: string, fallback?: string): string => {
    if (!term) return fallback || '';
    
    // 1. Direct lookup in current language GLOBAL_PHRASES
    if (GLOBAL_PHRASES[language] && GLOBAL_PHRASES[language][term]) {
      return GLOBAL_PHRASES[language][term];
    }

    // 2. Lookup in menu dictionary
    if (texts.menu && texts.menu[term]) {
      return texts.menu[term];
    }

    // 3. Lookup in common dictionary
    if (texts.common && (texts.common as any)[term]) {
      return (texts.common as any)[term];
    }

    // 4. Search across all sub-dictionaries in texts
    for (const section of Object.values(texts)) {
      if (typeof section === 'object' && section !== null) {
        if ((section as any)[term]) return (section as any)[term];
      }
    }

    // 5. Fallback
    return fallback || term;
  }, [language, texts]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      texts,
      dir,
      currencySymbol,
      formatNumber,
      formatDate,
      formatCurrency,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access the current language context.
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

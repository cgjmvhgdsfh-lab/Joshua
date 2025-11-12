import React, { createContext, useState, useEffect, useContext, FC, ReactNode, useMemo } from 'react';
import { Locale } from '../types';
import { translations } from '../locales';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, ...args: any[]) => string;
  speechLangCode: string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const getBestInitialLocale = (): Locale => {
    const supportedLocales: Locale[] = ['de', 'en', 'es', 'fr', 'it', 'pt', 'ja', 'ru', 'zh', 'hi', 'ar', 'nl', 'ko', 'tr', 'pl', 'sv', 'no', 'da', 'fi', 'el', 'id', 'uk', 'cs', 'hu', 'ro', 'vi', 'th', 'he', 'bn', 'ms', 'fil'];
    const storedLocale = localStorage.getItem('universum-locale') as Locale | null;
    if (storedLocale && supportedLocales.includes(storedLocale)) {
      return storedLocale;
    }
    const browserLang = navigator.language.split('-')[0];
    if (supportedLocales.includes(browserLang as Locale)) {
        return browserLang as Locale;
    }
    return 'de'; // Default to German
};


export const LocaleProvider: FC<{children: ReactNode}> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(getBestInitialLocale);

  useEffect(() => {
    localStorage.setItem('universum-locale', locale);
    document.documentElement.lang = locale;
    if (locale === 'ar' || locale === 'he') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [locale]);
  
  const speechLangCode = useMemo(() => {
    switch(locale) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'it': return 'it-IT';
      case 'pt': return 'pt-BR';
      case 'ja': return 'ja-JP';
      case 'ru': return 'ru-RU';
      case 'zh': return 'zh-CN';
      case 'hi': return 'hi-IN';
      case 'ar': return 'ar-SA';
      case 'nl': return 'nl-NL';
      case 'ko': return 'ko-KR';
      case 'tr': return 'tr-TR';
      case 'pl': return 'pl-PL';
      case 'sv': return 'sv-SE';
      case 'no': return 'no-NO';
      case 'da': return 'da-DK';
      case 'fi': return 'fi-FI';
      case 'el': return 'el-GR';
      case 'id': return 'id-ID';
      case 'uk': return 'uk-UA';
      case 'cs': return 'cs-CZ';
      case 'hu': return 'hu-HU';
      case 'ro': return 'ro-RO';
      case 'vi': return 'vi-VN';
      case 'th': return 'th-TH';
      case 'he': return 'he-IL';
      case 'bn': return 'bn-IN';
      case 'ms': return 'ms-MY';
      case 'fil': return 'fil-PH';
      case 'de':
      default:
        return 'de-DE';
    }
  }, [locale]);

  const t = (key: string, ...args: any[]): string => {
    let template = translations[locale]?.[key] || translations['en']?.[key];
    if (typeof template === 'function') {
      return (template as Function)(...args);
    }
    if(typeof template !== 'string') {
        return key;
    }
    return template;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, speechLangCode }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
'use client';

import { createContext, useContext, useCallback } from 'react';
import type { Locale } from './config';
import type { Messages } from './get-messages';

type TranslationFn = (key: string, params?: Record<string, string>) => string;

interface TranslationsContextValue {
  locale: Locale;
  messages: Messages;
  t: TranslationFn;
}

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

export function TranslationsProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t: TranslationFn = useCallback(
    (key, params) => {
      const value = key.split('.').reduce<unknown>((obj, k) => {
        if (obj && typeof obj === 'object' && k in (obj as Record<string, unknown>)) {
          return (obj as Record<string, unknown>)[k];
        }
        return undefined;
      }, messages);

      if (typeof value !== 'string') return key;

      if (!params) return value;

      let result = value;
      for (const [k, v] of Object.entries(params)) {
        result = result.split(`{${k}}`).join(v);
      }
      return result;
    },
    [messages],
  );

  return (
    <TranslationsContext.Provider value={{ locale, messages, t }}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const ctx = useContext(TranslationsContext);
  if (!ctx) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return ctx;
}

export function useLocale(): Locale {
  return useTranslations().locale;
}

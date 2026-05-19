export const locales = ['en', 'ms', 'zh', 'ta'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Melayu',
  zh: '中文',
  ta: 'தமிழ்',
};
export const LOCALE_COOKIE = 'locale';

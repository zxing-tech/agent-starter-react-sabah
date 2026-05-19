import { cache } from 'react';
import { cookies } from 'next/headers';
import { type Locale, locales, defaultLocale, LOCALE_COOKIE } from './config';

export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
});

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { type Locale, locales, LOCALE_COOKIE } from './config';

const ONE_YEAR = 365 * 24 * 60 * 60;

export async function setLocale(locale: string) {
  if (!locales.includes(locale as Locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  });

  revalidatePath('/', 'layout');
}

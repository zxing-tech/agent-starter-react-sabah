'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type SignInResult = {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
};

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function signIn(formData: FormData): Promise<SignInResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const rememberMe = formData.get('rememberMe') === 'on';

  // Set remember-me preference cookie BEFORE signIn so the cookie handler can read it
  const cookieStore = await cookies();
  if (rememberMe) {
    cookieStore.set('remember_me', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS,
    });
  } else {
    cookieStore.delete('remember_me');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Clean up remember_me cookie on failed login
    cookieStore.delete('remember_me');

    // Supabase returns "Invalid login credentials" — normalize to a generic code
    if (
      error.message.toLowerCase().includes('invalid login credentials') ||
      error.message.toLowerCase().includes('invalid email or password')
    ) {
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
      };
    }

    // Supabase rate limiting
    if (error.status === 429) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        rateLimited: true,
      };
    }

    return { success: false, error: error.message };
  }

  return { success: true };
}

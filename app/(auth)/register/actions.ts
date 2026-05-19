'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type SignUpResult = {
  success: boolean;
  error?: string;
};

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = process.env.SITE_URL || headersList.get('origin') || '';

  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const consentAt = formData.get('consentAt') as string;

  if (!consentAt) {
    return { success: false, error: 'SERVER_CONSENT_REQUIRED' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        pdpa_consent_at: consentAt,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { success: false, error: 'EMAIL_TAKEN' };
    }
    return { success: false, error: error.message };
  }

  // Edge case: Supabase returns no error but user has no identities
  // This happens when the email is already confirmed
  if (data.user && data.user.identities?.length === 0) {
    return { success: false, error: 'EMAIL_TAKEN' };
  }

  return { success: true };
}

export type ResendResult = {
  success: boolean;
  error?: string;
};

export async function resendVerification(email: string): Promise<ResendResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

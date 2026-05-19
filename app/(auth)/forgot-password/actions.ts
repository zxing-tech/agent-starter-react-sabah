'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type ResetPasswordResult = {
  success: boolean;
};

export async function resetPassword(formData: FormData): Promise<ResetPasswordResult> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = process.env.SITE_URL || headersList.get('origin') || '';

  const email = formData.get('email') as string;

  // Always return success regardless of whether the email exists (anti-enumeration)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return { success: true };
}

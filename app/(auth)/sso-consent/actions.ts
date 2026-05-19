'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function acceptConsent() {
  const supabase = await createClient();

  // Verify user is authenticated before updating metadata
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      pdpa_consent_at: new Date().toISOString(),
    },
  });

  if (error) {
    redirect('/sso-consent?error=' + encodeURIComponent(error.message));
  }

  redirect('/');
}

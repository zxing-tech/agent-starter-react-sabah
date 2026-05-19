'use client';

import { useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from '@/lib/i18n/client';

export function SSOButton() {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSSO() {
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { error: ssoError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: '*',
          prompt: 'select_account',
        },
      },
    });

    if (ssoError) {
      setError(ssoError.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSSO}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-tv-border bg-tv-surface text-base font-medium text-white transition-colors hover:bg-tv-border focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg disabled:opacity-50"
      >
        {loading ? (
          <CircleNotch size={20} className="animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        )}
        {loading ? t('common.ssoRedirecting') : t('common.ssoButton')}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

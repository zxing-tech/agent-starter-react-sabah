'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useTranslations } from '@/lib/i18n/client';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslations();

  useEffect(() => {
    console.error('[Auth error boundary]', error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-tv-bg px-4">
      <div className="w-full max-w-sm text-center">
        <p className="mb-3 text-4xl text-tv-muted">TheraVerse</p>
        <h1 className="mb-2 text-xl font-semibold text-white">{t('errorPage.heading')}</h1>
        <p className="mb-8 text-sm text-tv-muted">
          {t('errorPage.description')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg"
          >
            {t('common.tryAgain')}
          </button>
          <Link
            href="/login"
            className="rounded text-sm text-tv-muted hover:text-tv-text focus-visible:ring-2 focus-visible:ring-tv-accent"
          >
            {t('common.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}

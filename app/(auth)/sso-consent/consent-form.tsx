'use client';

import { useState, useTransition } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { acceptConsent } from './actions';
import { useTranslations } from '@/lib/i18n/client';

export function ConsentForm({ name, email }: { name: string; email: string }) {
  const { t } = useTranslations();
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      {/* User info from IdP */}
      <div className="mb-6 rounded-xl bg-tv-surface/50 px-4 py-3 text-left text-sm">
        <p className="text-tv-muted">
          {t('ssoConsent.signedInAs')} <span className="font-medium text-white">{name || email}</span>
        </p>
        {name && (
          <p className="text-tv-muted">{email}</p>
        )}
      </div>

      {/* PDPA consent */}
      <label className="flex cursor-pointer items-start gap-3 text-left">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-tv-border bg-tv-surface text-tv-accent focus:ring-tv-accent focus:ring-offset-0"
        />
        <span className="text-sm text-tv-text">
          {t('ssoConsent.consentPrefix')}{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tv-link underline hover:text-tv-link-hover"
          >
            {t('ssoConsent.privacyLink')}
          </a>{' '}
          {t('ssoConsent.consentAnd')}{' '}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tv-link underline hover:text-tv-link-hover"
          >
            {t('ssoConsent.termsLink')}
          </a>
          {t('ssoConsent.consentSuffix')}
        </span>
      </label>

      <form
        action={() => {
          startTransition(async () => {
            await acceptConsent();
          });
        }}
      >
        <button
          type="submit"
          disabled={!agreed || isPending}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <CircleNotch size={20} className="animate-spin" />
              {t('ssoConsent.submitting')}
            </>
          ) : (
            t('ssoConsent.submit')
          )}
        </button>
      </form>
    </div>
  );
}

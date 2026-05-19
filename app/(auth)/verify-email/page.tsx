import Link from 'next/link';
import { EnvelopeSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { ResendButton } from './resend-button';
import { getLocale } from '@/lib/i18n/get-locale';
import { getMessages, t } from '@/lib/i18n/get-messages';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; verified?: string; error?: string }>;
}) {
  const { email, verified, error } = await searchParams;
  const locale = await getLocale();
  const m = await getMessages(locale);

  // State: verified successfully
  if (verified === 'true') {
    return (
      <div className="fixed inset-0 z-10 flex min-h-svh flex-col items-center justify-center bg-tv-bg">
        <div className="mx-auto w-full max-w-sm px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
            <CheckCircle size={32} weight="fill" className="text-green-400" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-white">
            {t(m, 'verifyEmail.verifiedHeading')}
          </h1>
          <p className="text-tv-muted">
            {t(m, 'verifyEmail.verifiedSubtitle')}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover"
          >
            {t(m, 'verifyEmail.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  // State: expired or invalid token
  if (error === 'expired') {
    return (
      <div className="fixed inset-0 z-10 flex min-h-svh flex-col items-center justify-center bg-tv-bg">
        <div className="mx-auto w-full max-w-sm px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/20">
            <WarningCircle size={32} weight="fill" className="text-orange-400" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-white">
            {t(m, 'verifyEmail.expiredHeading')}
          </h1>
          <p className="text-tv-muted">
            {t(m, 'verifyEmail.expiredSubtitle')}
          </p>

          {email && (
            <div className="mt-6">
              <ResendButton email={email} />
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Link
              href="/register"
              className="block text-sm text-tv-link hover:text-tv-link-hover"
            >
              {t(m, 'verifyEmail.registerAgain')}
            </Link>
            <Link
              href="/login"
              className="block text-sm text-tv-muted hover:text-tv-text"
            >
              {t(m, 'common.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default state: email sent, waiting for verification
  return (
    <div className="fixed inset-0 z-10 flex min-h-svh flex-col items-center justify-center bg-tv-bg">
      <div className="mx-auto w-full max-w-sm px-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/20">
          <EnvelopeSimple size={32} className="text-green-400" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-white">{t(m, 'verifyEmail.checkInbox')}</h1>
        <p className="text-tv-muted">
          {t(m, 'verifyEmail.sentTo')}{' '}
          {email ? (
            <span className="font-medium text-white">{email}</span>
          ) : (
            t(m, 'verifyEmail.sentToFallback')
          )}
          {t(m, 'verifyEmail.sentToSuffix')}
        </p>

        <div className="mt-6 rounded-xl bg-tv-surface/50 px-4 py-3 text-sm text-tv-muted">
          {t(m, 'verifyEmail.spamHint')}
        </div>

        {email && (
          <div className="mt-4">
            <ResendButton email={email} />
          </div>
        )}

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-tv-link hover:text-tv-link-hover"
        >
          {t(m, 'common.backToLogin')}
        </Link>
      </div>
    </div>
  );
}

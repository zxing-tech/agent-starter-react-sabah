import { redirect } from 'next/navigation';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';
import { ConsentForm } from './consent-form';
import { getLocale } from '@/lib/i18n/get-locale';
import { getMessages, t } from '@/lib/i18n/get-messages';

export default async function SSOConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated — shouldn't be here
  if (!user) {
    redirect('/login');
  }

  // Already consented — go to dashboard
  if (user.user_metadata?.pdpa_consent_at) {
    redirect('/');
  }

  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const email = user.email || '';

  const locale = await getLocale();
  const m = await getMessages(locale);

  return (
    <div className="fixed inset-0 z-10 flex min-h-svh flex-col items-center justify-center bg-tv-bg">
      <div className="mx-auto w-full max-w-sm px-6 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-tv-accent/20">
          <ShieldCheck size={32} className="text-tv-accent" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-white">{t(m, 'ssoConsent.heading')}</h1>
        <p className="mb-6 text-tv-muted">
          {t(m, 'ssoConsent.subtitle')}
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <ConsentForm name={name} email={email} />
      </div>
    </div>
  );
}
